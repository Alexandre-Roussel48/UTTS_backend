const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { createOrUpdateTheft } = require('../models/theftModel');

const prisma = new PrismaClient();

async function isAdmin(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        return user.is_admin;
    } catch (error) {
        throw new Error(`Error in isAdmin function: ${error.message}`);
    }
}

async function createUser(data) {
    try {
        let salt = uuidv4();
        let user;

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

        return user.id;
    } catch (error) {
        throw new Error(`Error in createUser function: ${error.message}`);
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

async function getUsers() {
    try {
        const users = await prisma.user.findMany();
        return users.map(user => ({
            id: user.id,
            username: user.username
        }));
    } catch (error) {
        throw new Error(`Error in getUsers function: ${error.message}`);
    }
}

async function deleteUser(userId) {
    try {
        await prisma.inventory.deleteMany({where: {user_id: userId}});
        await prisma.vault.deleteMany({where: {user_id: userId}});
        await prisma.theft.deleteMany({where: {thief_id: userId}});
        await prisma.theft.deleteMany({where: {victim_id: userId}});
        await prisma.user.delete({where: {id: userId}});
    } catch (error) {
        throw new Error(`Error in deleteUser function: ${error.message}`);
    }
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

module.exports = {
    isAdmin,
    createUser,
    checkUser,
    getLeaderboard,
    getUsers,
    deleteUser,
    getUser,
    getUserData,
    updateLastConnection,
};