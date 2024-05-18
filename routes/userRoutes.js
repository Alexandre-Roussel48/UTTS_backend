const express = require('express');
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/get_inventory', verifyToken, userController.getInventory);
router.post('/get_forge', verifyToken, userController.getForge);
router.post('/get_vault', verifyToken, userController.getVault);
router.post('/drop', verifyToken, userController.drop);
router.post('/theft', verifyToken, userController.theft);
router.post('/forge', verifyToken, userController.forge);
router.post('/inventory_card', verifyToken, userController.inventoryCard);
router.post('/vault_card', verifyToken, userController.vaultCard);
router.post('/forge_card', verifyToken, userController.forgeCard);
router.post('/get_user_data', verifyToken, userController.getUserData);

module.exports = router;