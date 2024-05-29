const express = require('express');
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');

const router = express.Router();

const dropLimiter = rateLimit({
  windowMs: 19 * 1000,
  max: 1,
  message: "Too many requests, please try again later."
});

const theftLimiter = rateLimit({
  windowMs: 119 * 1000,
  max: 1,
  message: "Too many requests, please try again later."
});

router.get('/inventory', userController.getInventory);
router.get('/forge', userController.getForge);
router.get('/vault', userController.getVault);
router.get('/drop', dropLimiter, userController.drop);
router.get('/theft', theftLimiter, userController.theft);
router.get('/data', userController.getUserData);
router.get('/notification', userController.getThefts);
router.put('/forge', userController.forgeCard);
router.put('/inventory', userController.inventoryCard);
router.put('/vault', userController.vaultCard);
router.post('/forge', userController.forge);
router.delete('/notification', userController.deleteTheft);

module.exports = router;