const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { createOrUpdateTheft } = require('../models/theftModel');

const prisma = new PrismaClient();

async function createOrUpdateUser(data) {
    try {
        let salt = uuidv4();
        let user;

        if (!data.id) {
            const hashedPassword = await bcrypt.hash(data.password + salt, 10);
            user = await prisma.user.create({
                data: {
                    id: uuidv4(),
                    username: data.username,
                    connection_count: -1,
                    password_hash: hashedPassword,
                    password_salt: salt
                }
            });

            const commonCards = await prisma.card.findMany({
              where: {
                rarity: 'common'
              }
            });

            const starterCards = commonCards.sort(() => Math.random() - 0.5).slice(0, 5);

            const inventoryItems = starterCards.map(card => ({
                user_id: user.id,
                card_id: card.id
            }));

            await prisma.inventory.createMany({
                data: inventoryItems
            });
        } else {
            // Update existing user
            const hashedPassword = await bcrypt.hash(data.password + salt, 10);
            user = await prisma.user.update({
                where: {
                    id: data.id
                },
                data: {
                    username: data.username,
                    password_hash: hashedPassword,
                    password_salt: salt
                }
            });
        }

        return user.id;
    } catch (error) {
        throw new Error(`Error in createOrUpdateUser function: ${error.message}`);
    }
}

async function checkUser(data) {
    try {
        const matchingUsers = await prisma.user.findMany({
            where: {
                username: data.username
            }
        });

        for (const user of matchingUsers) {
            if (await bcrypt.compare(data.password + user.password_salt, user.password_hash)) {
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        connection_count: user.connection_count + 1
                    }
                });

                const res = await prisma.user.findUnique({
                    where: { id: user.id }
                });

                const thefts = await prisma.theft.findMany({
                    where: {
                        victim_id: user.id,
                        date: {
                            gt: user.last_connection
                        }
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
                        card: card,
                        thief: thief.username
                    };
                }));

                return {
                    user: res,
                    thefts: reformattedThefts
                };
            }
        }

        return null;
    } catch (error) {
        throw new Error(`Error in checkUser function: ${error.message}`);
    }
}

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
        throw new Error(`Error fetching inventory: ${error.message}`);
    }
}

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
        throw new Error(`Error fetching inventory: ${error.message}`);
    }
}

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
        throw new Error(`Error fetching inventory: ${error.message}`);
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
            data: { next_card: new Date(Date.now() + 10000) }, // 10 secs from now
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
        throw new Error(`Error fetching drop: ${error.message}`);
    }
}

async function theftCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { next_theft: new Date(Date.now() + 10000) },
        });

        const theftId = await createOrUpdateTheft(userId);

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
        throw new Error(`Error fetching theft: ${error.message}`);
    }
}

async function updateLastConnection(userId) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                last_connection: new Date(Date.now())
            }
        });
    } catch (error) {
        throw new Error(`Error updating last connection: ${error.message}`);
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

            await prisma.inventory.create({
                data: {
                    user_id: userId,
                    card_id: oldVault.card_id
                }
            });
        }
        await prisma.vault.create({
            data: {
                user_id: userId,
                card_id: card.id,
                rarity: card.rarity
            }
        });

        const inventoryToDelete = await prisma.inventory.findFirst({
            where: {
                user_id: userId,
                card_id: card.id
            }
        });

        await prisma.inventory.deleteMany({
            where: { id: inventoryToDelete.id },
        });

        return 1;
    } catch (error) {
        throw new Error(`Error in createVault function: ${error.message}`);
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
        throw new Error(`Error in updateForge function: ${error.message}`);
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
        throw new Error(`Error in updateForge function: ${error.message}`);
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

        await prisma.inventory.create({
            data: {
                user_id: userId,
                card_id: oldVault.card_id
            }
        });

        return 1;
    } catch (error) {
        throw new Error(`Error in updateForge function: ${error.message}`);
    }  
}

module.exports = {
    createOrUpdateUser,
    checkUser,
    getInventory,
    getVault,
    getForge,
    dropCard,
    theftCard,
    updateLastConnection,
    createVault,
    updateForge,
    deleteForge,
    deleteVault
};