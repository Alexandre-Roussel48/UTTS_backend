const express = require('express');
const userRoutes = require('./userRoutes');
const indexController = require('../controllers/indexController');
const verifyToken = require('../middleware/authMiddleware');
const userIdToWsMap = require('../websocket');


function routes() {
	const router = express.Router();

	router.get('/leaderboard', indexController.getLeaderboard);
	router.get('/users', verifyToken, indexController.getUsers);
	router.post('/check_connection', verifyToken, indexController.checkConnection);
	router.post('/register', indexController.register);
	router.post('/login', indexController.login);
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