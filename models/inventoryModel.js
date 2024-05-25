const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getInventory(userId) {
    try {
        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId,
                forge: false
            }
        });
        const cardIds = inventories.map(inventory => inventory.card_id);
        const cards = [];
        for (index in cardIds) {
            cards.push(await prisma.card.findUnique({
                where: {
                    id: cardIds[index]
                }
            }));
        }
        return cards;
    } catch (error) {
        console.log(`Error fetching inventory: ${error.message}`);
        return null;
    }
}

async function dropCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.next_card > new Date()) {
            return null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { next_card: new Date(Date.now() + (1000 * 60 * 2)) },
        });

        const commonCards = await prisma.card.findMany({
          where: {
            rarity: 'common'
          }
        });

        const dropArray = commonCards.sort(() => Math.random() - 0.5);

        const drop = dropArray[0];

        const inventory = await prisma.inventory.create({
            data: {
                user_id: userId,
                card_id: drop.id,
            },
        });

        return { drop: drop, next_card: updatedUser.next_card };
    } catch (error) {
        console.log(`Error fetching drop: ${error.message}`);
        return null;
    }
}

module.exports = {
    getInventory,
    dropCard
};