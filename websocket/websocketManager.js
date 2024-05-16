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
    const tokenPattern = new RegExp(`authToken=([^;]+)`);
    const token = req.headers.cookie.match(tokenPattern)[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedToken.user_id;

    userIdToWsMap[userId] = ws;

    ws.on('close', () => {
      delete userIdToWsMap[userId];
    });
  } catch (error) {
    console.error('JWT token verification failed:', error);
    ws.close();
  }
});

const PORT = process.env.WS_PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = userIdToWsMap;