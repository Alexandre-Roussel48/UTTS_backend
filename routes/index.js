const express = require('express');
const userRoutes = require('./userRoutes');
const indexController = require('../controllers/indexController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/leaderboard', indexController.getLeaderboard);
router.get('/users', verifyToken, indexController.getUsers);
router.post('/check_connection', indexController.checkConnection);
router.post('/set_last_connection', indexController.setLastConnection);
router.post('/register', indexController.register);
router.post('/login', indexController.login);
router.post('/logout', indexController.logout);
router.delete('/user', verifyToken, indexController.deleteUser);
router.use('/user', userRoutes);

module.exports = router;