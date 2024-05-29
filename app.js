const express = require('express');
const http = require('http');
const { routes } = require('./routes');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();

app.set('trust proxy', 1);

app.use(cookieParser());

app.use(cors({origin: process.env.FRONTEND_URL, credentials: true}));

app.use(bodyParser.json());

var expressWs = require('express-ws')(app);

app.use('/api', routes());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});