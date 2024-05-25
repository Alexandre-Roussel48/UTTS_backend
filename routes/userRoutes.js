const express = require('express');
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/inventory', verifyToken, userController.getInventory);
router.get('/forge', verifyToken, userController.getForge);
router.get('/vault', verifyToken, userController.getVault);
router.get('/drop', verifyToken, userController.drop);
router.get('/theft', verifyToken, userController.theft);
router.get('/data', verifyToken, userController.getUserData);
router.put('/forge', verifyToken, userController.forgeCard);
router.put('/inventory', verifyToken, userController.inventoryCard);
router.put('/vault', verifyToken, userController.vaultCard);
router.post('/forge', verifyToken, userController.forge);

module.exports = router;