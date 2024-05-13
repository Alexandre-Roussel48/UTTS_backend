const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOrUpdateTheft(userId) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId }
      }
    });

    const victimId = users[Math.floor(Math.random() * users.length)].id;

    const inventories = await prisma.inventory.findMany({
      where: {
        user_id: victimId
      },
      select: {
        card_id: true
      }
    });

    if (inventories.length === 0) {
      return null;
    }

    const randomCardId = inventories[Math.floor(Math.random() * inventories.length)].card_id;

    const theft = await prisma.theft.create({
      data: {
        thief_id: userId,
        victim_id: victimId,
        card_id: randomCardId
      }
    });

    return theft.id;
  } catch (error) {
    console.log(error.message);
    return null;
  }
}

module.exports = {
    createOrUpdateTheft
};