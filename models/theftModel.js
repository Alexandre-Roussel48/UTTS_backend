const { PrismaClient } = require('@prisma/client');
const { createOrUpdateInventory, deleteOrUpdateInventory } = require('../models/inventoryModel');

const prisma = new PrismaClient();

async function createTheft(userId) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId }
      }
    });
    let victimId;
    let inventories;
    let gap = 0;
    do {
      victimId = users[Math.floor(Math.random() * users.length)].id;

      inventories = await prisma.inventory.findMany({
        where: {
          user_id: victimId
        },
        select: {
          card_id: true
        }
      });
      gap += 1;
      if (gap > 100) {return null;}
    } while (inventories.length === 0);

    const randomCardId = inventories[Math.floor(Math.random() * inventories.length)].card_id;

    const theft = await prisma.theft.create({
      data: {
        thief_id: userId,
        victim_id: victimId,
        card_id: randomCardId
      }
    });

    return theft;
  } catch (error) {
    console.log(error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteTheft(userId, theftId) {
  try {
    const record = await prisma.theft.findFirst({
      where: {
        id: theftId,
        victim_id: userId,
      },
    });
    if (record) {
      await prisma.theft.delete({
        where: {
          id: theftId,
        },
      });
    }
    return 1;
  } catch (error) {
    console.log(error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function getThefts(victimId) {
  try {
    const thefts = await prisma.theft.findMany({
      where: {
        victim_id: victimId
      }
    });

    const reformattedThefts = await Promise.all(thefts.map(async (theft) => {
        const card = await prisma.card.findUnique({
            where: {
                id: theft.card_id
            }
        });
        const thief = await prisma.user.findUnique({
            where: {
                id: theft.thief_id
            }
        });
        return {
          id: theft.id,
          card: card,
          thief: thief.username
        };
    }));
    return reformattedThefts;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function theftCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (user.next_theft > new Date()) {
            return null;
        }

        const theft = await createTheft(userId);

        const thief = await prisma.user.update({
            where: { id: userId },
            data: { next_theft: new Date(Date.now() + (1000 * 60 * 2)) },
        });

        const victim = await prisma.user.findUnique({
          where: { id: theft.victim_id }
        });

        const card = await prisma.card.findUnique({
            where: { id: theft.card_id },
        });

        await deleteOrUpdateInventory(theft.victim_id, theft.card_id);

        await createOrUpdateInventory(userId, theft.card_id);

        return { card: card, next_theft: thief.next_theft, thief : user.username, victim : victim.username, victim_id : theft.victim_id};
    } catch (error) {
        console.log(`Error fetching theft: ${error.message}`);
        return null;
    } finally {
      await prisma.$disconnect();
    }
}

module.exports = {
    theftCard,
    deleteTheft,
    getThefts
};