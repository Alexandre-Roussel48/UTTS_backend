const express = require('express');
const userRoutes = require('./userRoutes');
const indexController = require('../controllers/indexController');

const router = express.Router();

router.post('/register', indexController.register);
router.post('/login', indexController.login);
router.use('/user', userRoutes);

module.exports = router;