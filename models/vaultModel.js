const { PrismaClient } = require('@prisma/client');
const { createOrUpdateInventory, deleteOrUpdateInventory } = require('../models/inventoryModel');

const prisma = new PrismaClient();

async function getVault(userId) {
    try {
        const vaults = await prisma.vault.findMany({
            where: {
                user_id: userId
            }
        });
        const cardIds = vaults.map(vault => vault.card_id);
        const cards = await prisma.card.findMany({
            where: {
                id: {
                    in: cardIds
                }
            }
        });
        return cards;
    } catch (error) {
        console.log(`Error fetching vault: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function createVault(userId, card) {
    try {
        const oldVault = await prisma.vault.findUnique({
            where: {
                user_id_rarity: {
                    user_id: userId,
                    rarity: card.rarity
                }
            }
        });

        if (oldVault) {
            await prisma.vault.deleteMany({
                where: {
                    id: oldVault.id
                }
            });

            await createOrUpdateInventory(userId, oldVault.card_id);
        }
        await prisma.vault.create({
            data: {
                user_id: userId,
                card_id: card.id,
                rarity: card.rarity
            }
        });

        await deleteOrUpdateInventory(userId, card.id, false);

        return 1;
    } catch (error) {
        console.log(`Error in createVault function: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function deleteVault(userId, card) {
    try {
        const oldVault = await prisma.vault.findUnique({
            where: {
                user_id_rarity: {
                    user_id: userId,
                    rarity: card.rarity
                }
            }
        });

        await prisma.vault.deleteMany({
            where: {
                id: oldVault.id
            }
        });

        await createOrUpdateInventory(userId, oldVault.card_id);

        return 1;
    } catch (error) {
        console.log(`Error in deleteVault function: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    } 
}

module.exports = {
    getVault,
    createVault,
    deleteVault
};