const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const userIdToWsMap = {};

wss.on('connection', (ws, req) => {
  try {
    const tokenPattern = /authToken=([^;]+)/;
    const tokenMatch = req.headers.cookie.match(tokenPattern);

    if (!tokenMatch) {
      throw new Error('Token not found in cookies');
    }

    const token = tokenMatch[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedToken.user_id;

    userIdToWsMap[userId] = ws;

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      delete userIdToWsMap[userId];
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

  } catch (error) {
    console.error('JWT token verification failed or other error:', error);
    ws.close();
  }
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

const PORT = process.env.WS_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Websocket server running on port ${PORT}`);
});

module.exports = userIdToWsMap;