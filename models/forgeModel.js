const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getForge(userId) {
    try {
        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId,
                forge: true
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
        console.log(`Error fetching forge: ${error.message}`);
        return null;
    }
}

async function forgeCard(userId) {
    try {
        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId,
                forge: true
            }
        });
        if (inventories.length == 0) {
            return;
        }
        const cardIds = inventories.map(inventory => inventory.card_id);
        const cards = [];
        for (index in cardIds) {
            cards.push(await prisma.card.findUnique({
                where: {
                    id: cardIds[index]
                }
            }));
        }
        let weight = 0;
        for (let card of cards) {
            if (card.rarity == "common") {weight += 1;}
            else if (card.rarity == "uncommon") {weight += 5;}
            else if (card.rarity == "rare") {weight += 11;}
            else if (card.rarity == "epic") {weight += 23;}
            else if (card.rarity == "legendary") {weight += 41;}
        }
        if (Math.random() < 0.6) {
            weight /= 2;
        }

        for (let inventory of inventories) {
            await prisma.inventory.delete({
                where: { id: inventory.id }
            });
        }

        // Forge a new card
        let forge;
        if (weight < 5) {
            const commonCards = await prisma.card.findMany({
              where: {
                rarity: 'common'
              }
            });

            forge = commonCards.sort(() => Math.random() - 0.5).slice(0, 1)[0];
        } else if (weight < 11) {
            const uncommonCards = await prisma.card.findMany({
              where: {
                rarity: 'uncommon'
              }
            });

            forge = uncommonCards.sort(() => Math.random() - 0.5).slice(0, 1)[0];
        } else if (weight < 23) {
            const rareCards = await prisma.card.findMany({
              where: {
                rarity: 'rare'
              }
            });

            forge = rareCards.sort(() => Math.random() - 0.5).slice(0, 1)[0];
        } else if (weight < 41) {
            const epicCards = await prisma.card.findMany({
              where: {
                rarity: 'epic'
              }
            });

            forge = epicCards.sort(() => Math.random() - 0.5).slice(0, 1)[0];
        } else {
            const legendaryCards = await prisma.card.findMany({
              where: {
                rarity: 'legendary'
              }
            });

            forge = legendaryCards.sort(() => Math.random() - 0.5).slice(0, 1)[0];
        }

        await prisma.inventory.create({
            data: {
                user_id: userId,
                card_id: forge.id
            }
        });

        return forge;
    } catch (error) {
        console.log(`Error forging card: ${error.message}`);
        return null;
    }
}

async function updateForge(userId, card) {
    try {
        const inventory = await prisma.inventory.findFirst({
            where: {
                user_id : userId,
                card_id : card.id,
                forge : false
            }
        });

        await prisma.inventory.update({
            where: {
                id: inventory.id
            },
            data: {
                forge : true
            }
        });

        return 1;
    } catch (error) {
        console.log(`Error in updateForge function: ${error.message}`);
        return null;
    }  
}

async function deleteForge(userId, card) {
    try {
        const inventory = await prisma.inventory.findFirst({
            where: {
                user_id : userId,
                card_id : card.id,
                forge : true
            }
        });

        await prisma.inventory.update({
            where: {
                id: inventory.id
            },
            data: {
                forge : false
            }
        });

        return 1;
    } catch (error) {
        console.log(`Error in deleteForge function: ${error.message}`);
        return null;
    }  
}

module.exports = {
    getForge,
    forgeCard,
    updateForge,
    deleteForge
};