const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTheft(userId) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId }
      }
    });
    let inventories;
    do {
      const victimId = users[Math.floor(Math.random() * users.length)].id;

      inventories = await prisma.inventory.findMany({
        where: {
          user_id: victimId
        },
        select: {
          card_id: true
        }
      });
    } while (inventories.length === 0);

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

async function theftCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.next_theft > new Date()) {
            return null;
        }

        const theftId = await createTheft(userId);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { next_theft: new Date(Date.now() + (1000 * 60 * 2)) },
        });

        const theft = await prisma.theft.findUnique({
            where: { id: theftId },
        });

        const card = await prisma.card.findUnique({
            where: { id: theft.card_id },
        });

        const inventoryToDelete = await prisma.inventory.findFirst({
          where: {
            user_id: theft.victim_id,
            card_id: theft.card_id
          }
        });

        await prisma.inventory.delete({
            where: { id: inventoryToDelete.id },
        });

        const inventory = await prisma.inventory.create({
            data: {
              user_id: userId,
              card_id: card.id,
            },
        });

        return { card: card, next_theft: updatedUser.next_theft, thief : user.username, victim_id : theft.victim_id};
    } catch (error) {
        console.log(`Error fetching theft: ${error.message}`);
        return null;
    }
}

module.exports = {
    theftCard
};