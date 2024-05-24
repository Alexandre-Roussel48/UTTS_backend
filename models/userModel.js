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

async function getLeaderboard() {
    try {
        const users = await prisma.user.findMany();
        for (let user of users) {
            const inventories = await prisma.inventory.findMany({
                where: {
                    user_id: user.id
                }
            });
            const inventoryMap = inventories.map(inventory => inventory.card_id);

            const vaults = await prisma.vault.findMany({
                where: {
                    user_id: user.id
                }
            });
            const vaultMap = vaults.map(vault => vault.card_id);

            const cards = await prisma.card.findMany({
                where: {
                    OR: [
                        {
                            id: {
                              in: inventoryMap
                            }
                        },
                        {
                            id: {
                              in: vaultMap
                            }
                        }
                    ]
                }
            });
            user.cards = cards;
        }
        return users.map(user => ({
            username: user.username,
            cards: user.cards.length
        })).sort((a, b) => b.cards - a.cards);;
    } catch (error) {
        throw new Error(`Error in getLeaderboard function: ${error.message}`);
    } 
}

async function getUserData(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId
            }
        });
        const inventoryMap = inventories.map(inventory => inventory.card_id);

        const vaults = await prisma.vault.findMany({
            where: {
                user_id: userId
            }
        });
        const vaultMap = vaults.map(vault => vault.card_id);

        const cards = await prisma.card.findMany({
            where: {
                OR: [
                    {
                        id: {
                          in: inventoryMap
                        }
                    },
                    {
                        id: {
                          in: vaultMap
                        }
                    }
                ]
            }
        });

        const common = await prisma.card.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                id: {
                                  in: inventoryMap
                                }
                            },
                            {
                                id: {
                                  in: vaultMap
                                }
                            }
                        ]
                    },
                    {
                        rarity: 'common'
                    }
                ]
            }
        });

        const uncommon = await prisma.card.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                id: {
                                  in: inventoryMap
                                }
                            },
                            {
                                id: {
                                  in: vaultMap
                                }
                            }
                        ]
                    },
                    {
                        rarity: 'uncommon'
                    }
                ]
            }
        });

        const rare = await prisma.card.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                id: {
                                  in: inventoryMap
                                }
                            },
                            {
                                id: {
                                  in: vaultMap
                                }
                            }
                        ]
                    },
                    {
                        rarity: 'rare'
                    }
                ]
            }
        });

        const epic = await prisma.card.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                id: {
                                  in: inventoryMap
                                }
                            },
                            {
                                id: {
                                  in: vaultMap
                                }
                            }
                        ]
                    },
                    {
                        rarity: 'epic'
                    }
                ]
            }
        });

        const legendary = await prisma.card.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                id: {
                                  in: inventoryMap
                                }
                            },
                            {
                                id: {
                                  in: vaultMap
                                }
                            }
                        ]
                    },
                    {
                        rarity: 'legendary'
                    }
                ]
            }
        });

        return {
            username: user.username,
            cards: cards.length,
            common: common.length,
            uncommon: uncommon.length,
            rare: rare.length,
            epic: epic.length,
            legendary: legendary.length
        };
    } catch (error) {
        console.log(`Error in getUserData function: ${error.message}`);
        return null;
    }
}

async function incrementConnectionCount(userId) {
    const res = await prisma.user.findUnique({
        where: { id: userId }
    });

    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            connection_count: res.connection_count + 1
        }
    });
}

async function getUser(userId, increment) {
    try {
        if (increment) {
            incrementConnectionCount(userId);
        }

        const res = await prisma.user.findUnique({
            where: { id: userId }
        });

        const thefts = await prisma.theft.findMany({
            where: {
                victim_id: userId,
                date: {
                    gt: res.last_connection
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
    } catch (error) {
        console.log(`Error in getUser function: ${error.message}`);
        return null;
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
        console.log(`Error fetching forge: ${error.message}`);
        return null;
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
        console.log(`Error fetching inventory: ${error.message}`);
        return null;
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
        console.log(`Error fetching vault: ${error.message}`);
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

async function theftCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { next_theft: new Date(Date.now() + (1000 * 60 * 5)) },
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
        console.log(`Error fetching theft: ${error.message}`);
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
        console.log(`Error updating last connection: ${error.message}`);
        return null;
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
        console.log(`Error in createVault function: ${error.message}`);
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
        console.log(`Error in deleteVault function: ${error.message}`);
        return null;
    }  
}

module.exports = {
    createOrUpdateUser,
    checkUser,
    getLeaderboard,
    getUser,
    getUserData,
    getInventory,
    getVault,
    getForge,
    dropCard,
    theftCard,
    forgeCard,
    updateLastConnection,
    createVault,
    updateForge,
    deleteForge,
    deleteVault
};