const express = require('express');
const userRoutes = require('./userRoutes');
const indexController = require('../controllers/indexController');
const verifyToken = require('../middleware/authMiddleware');
const userIdToWsMap = require('../websocket');
const rateLimit = require('express-rate-limit');

function routes() {
	const router = express.Router();

	const loginLimiter = rateLimit({
	  windowMs: 3 * 1000,
	  max: 1,
	  message: JSON.stringify({ status : "Too many requests, please try again later."})
	});

	const registerLimiter = rateLimit({
	  windowMs: 120 * 1000,
	  max: 1,
	  message: JSON.stringify({ status : "Too many requests, please try again later."})
	});

	router.get('/leaderboard', indexController.getLeaderboard);
	router.get('/users', verifyToken, indexController.getUsers);
	router.post('/check_connection', verifyToken, indexController.checkConnection);
	router.post('/register', registerLimiter, indexController.register);
	router.post('/login', loginLimiter, indexController.login);
	router.post('/logout', indexController.logout);
	router.delete('/user', verifyToken, indexController.deleteUser);
	router.use('/user', verifyToken, userRoutes);

	router.use('/socket', verifyToken);
	router.ws('/socket', (ws, req) => {
	  try {
	    const userId = req.authData.user_id;

	    userIdToWsMap[userId] = ws;

	    ws.on('close', () => {
	      delete userIdToWsMap[userId];
	    });
	  } catch (error) {
	    console.error('JWT token verification failed:', error);
	    ws.close();
	  }
	});
	return router;
}

module.exports = { routes };