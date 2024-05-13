const { getInventory, getForge, getVault, dropCard, theftCard, updateLastConnection, createVault, updateForge, deleteForge, deleteVault } = require('../models/userModel');
const userIdToWsMap = require('../websocket/websocketManager');

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

function sendMessageToUser(userId, jsonData) {
  try {
    const ws = userIdToWsMap[userId];
    if (ws) {
      const jsonString = JSON.stringify({
        card: jsonData.card,
        thief: jsonData.thief
      });
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
  sendMessageToUser(theftData.victim_id, theftData);
  res.json({
    theft: theftData.card,
    next_theft: theftData.next_theft
  });
};

exports.setLastConnection = async (req, res) => {
  await updateLastConnection(req.authData.user_id);
  return res.status(200).json({ status: 'Last connection set' });
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