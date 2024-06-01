const { PrismaClient } = require('@prisma/client');
const { getInventory, createOrUpdateInventory, deleteOrUpdateInventory } = require('../models/inventoryModel');

const prisma = new PrismaClient();

async function getForge(userId) {
    try {
        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId,
                forge: {gt : 0}
            }
        });
        const cards = await Promise.all(inventories.map(async (inventory) => {
            const card = await prisma.card.findUnique({
                where: {
                    id: inventory.card_id
                }
            });
            card.count = inventory.forge;
            return card;
        }));
        return cards;
    } catch (error) {
        console.log(`Error fetching forge: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function forgeCard(userId) {
    try {
        const cards = await getForge(userId);
        let weight = 0;
        for (let card of cards) {
            if (card.rarity == "common") {weight += 1;}
            else if (card.rarity == "uncommon") {weight += 5;}
            else if (card.rarity == "rare") {weight += 11;}
            else if (card.rarity == "epic") {weight += 23;}
            else if (card.rarity == "legendary") {weight += 41;}
        }
        const value = Math.random();
        if (value < 0.3) {
            weight /= 2;
        } else if (value < 0.6) {
            weight *= 2;
        }

        for (let card of cards) {
            await deleteOrUpdateInventory(userId, card.id, true);
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

        await createOrUpdateInventory(userId, forge.id);

        return forge;
    } catch (error) {
        console.log(`Error forging card: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function updateForge(userId, card) {
    try {
        const inventory = await prisma.inventory.findFirst({
            where: {
                user_id : userId,
                card_id : card.id
            }
        });

        if (inventory.count - inventory.forge > 0) {
            await prisma.inventory.update({
                where: {
                    id: inventory.id
                },
                data: {
                    forge : inventory.forge + 1
                }
            });
        }


        return 1;
    } catch (error) {
        console.log(`Error in updateForge function: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function deleteForge(userId, card) {
    try {
        const inventory = await prisma.inventory.findFirst({
            where: {
                user_id : userId,
                card_id : card.id
            }
        });

        if (inventory.forge > 0) {
            await prisma.inventory.update({
                where: {
                    id: inventory.id
                },
                data: {
                    forge : inventory.forge - 1
                }
            });
        }

        return 1;
    } catch (error) {
        console.log(`Error in deleteForge function: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = {
    getForge,
    forgeCard,
    updateForge,
    deleteForge
};