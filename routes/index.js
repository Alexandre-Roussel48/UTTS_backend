const express = require('express');
const userRoutes = require('./userRoutes');
const indexController = require('../controllers/indexController');

const router = express.Router();

router.post('/check_connection', indexController.checkConnection);
router.post('/set_last_connection', indexController.setLastConnection);
router.post('/get_leaderboard', indexController.getLeaderboard);
router.post('/register', indexController.register);
router.post('/login', indexController.login);
router.post('/logout', indexController.logout);
router.use('/user', userRoutes);

module.exports = router;