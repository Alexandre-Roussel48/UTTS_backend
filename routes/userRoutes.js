const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/inventory', userController.getInventory);
router.get('/forge', userController.getForge);
router.get('/vault', userController.getVault);
router.get('/drop', userController.drop);
router.get('/theft', userController.theft);
router.get('/data', userController.getUserData);
router.get('/notification', userController.getThefts);
router.put('/forge', userController.forgeCard);
router.put('/inventory', userController.inventoryCard);
router.put('/vault', userController.vaultCard);
router.post('/forge', userController.forge);
router.delete('/notification', userController.deleteTheft);

module.exports = router;