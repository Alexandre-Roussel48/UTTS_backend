const { getUserData } = require('../models/userModel');
const { getInventory, dropCard } = require('../models/inventoryModel');
const { getForge, forgeCard, updateForge, deleteForge } = require('../models/forgeModel');
const { getVault, createVault, deleteVault } = require('../models/vaultModel');
const { theftCard, deleteTheft, getThefts } = require('../models/theftModel');
const userIdToWsMap = require('../websocket');

exports.getInventory = async (req, res) => {
  const inventory = await getInventory(req.authData.user_id);
  if (!inventory) {
    return res.status(400).json({ status: 'Error getting inventory' });
  }
  res.json(inventory);
};

exports.getForge = async (req, res) => {
  const forge = await getForge(req.authData.user_id);
  if (!forge) {
    return res.status(400).json({ status: 'Error getting forge' });
  }
  res.json(forge);
};

exports.getVault = async (req, res) => {
  const vault = await getVault(req.authData.user_id);
  if (!vault) {
    return res.status(400).json({ status: 'Error getting vault' });
  }
  res.json(vault);
};

exports.drop = async (req, res) => {
  const dropData = await dropCard(req.authData.user_id);
  if (!dropData) {
    return res.status(401).json({ status: 'Drop unauthorized now' });
  }
  res.json(dropData);
};

async function sendMessageToUser(userId) {
  try {
    const ws = userIdToWsMap[userId];
    if (ws) {
      const thefts = await getThefts(userId);
      const jsonString = JSON.stringify(thefts);
      ws.send(jsonString);
    }
  } catch (error) {
    console.log("couldnt send to victim");
  }
}

exports.theft = async (req, res) => {
  const theftData = await theftCard(req.authData.user_id);
  if (!theftData) {
    return res.status(401).json({ status: 'Theft unauthorized now' });
  }
  sendMessageToUser(theftData.victim_id);
  res.json({
    theft: theftData.card,
    next_theft: theftData.next_theft,
    victim : theftData.victim
  });
};

exports.deleteTheft = async (req, res) => {
  const theftData = await deleteTheft(req.authData.user_id, req.body.id);
  if (!theftData) {
    return res.status(401).json({ status : 'Record doesn\'t exists' });
  }
  return res.status(200).json({ status : 'Notification deleted' });
};

exports.getThefts = async (req, res) => {
  const thefts = await getThefts(req.authData.user_id);
  res.json(thefts);
};

exports.forge = async (req, res) => {
  const forgeData = await forgeCard(req.authData.user_id);
  if (!forgeData) {
    return res.status(401).json({ status: 'Forge failed' });
  }
  res.json({
    forge : forgeData
  });
};

exports.inventoryCard = async (req, res) => {
  let code;
  if (req.body.from == 'forge') {
    code = await deleteForge(req.authData.user_id, req.body.card);
  } else if (req.body.from == 'vault') {
    code = await deleteVault(req.authData.user_id, req.body.card);
  }
  if (!code) {
    return res.status(401).json({ status: 'No get back' });
  }
  return res.status(200).json({ status: 'Card sent to inventory' });  
}

exports.vaultCard = async (req, res) => {
  const code = await createVault(req.authData.user_id, req.body.card);
  if (!code) {
    return res.status(401).json({ status: 'No get back' });
  }
  return res.status(200).json({ status: 'Card vaulted' });
}

exports.forgeCard = async (req, res) => {
  const code = await updateForge(req.authData.user_id, req.body.card);
  if (!code) {
    return res.status(401).json({ status: 'No get back' });
  }
  return res.status(200).json({ status: 'Card sent to forge' });
}

exports.getUserData = async(req, res) => {
    try {
        const user = await getUserData(req.authData.user_id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ status: 'Something went wrong' });
    }
};