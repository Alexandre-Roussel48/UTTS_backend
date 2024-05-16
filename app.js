const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const routes = require('./routes');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

app.use(bodyParser.json());

app.use('/api', routes);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});