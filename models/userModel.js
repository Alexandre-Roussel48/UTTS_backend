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
    } finally {
        await prisma.$disconnect();
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
                connection_count: 0,
                password_hash: hashedPassword,
                password_salt: salt
            }
        });

        const commonCards = await prisma.card.findMany({
          where: {
            rarity: 'common'
          }
        });

        const starterCards = commonCards.sort(() => Math.random() - 0.5).slice(0, 10);

        const inventoryItems = starterCards.map(card => ({
            user_id: user.id,
            card_id: card.id
        }));

        await prisma.inventory.createMany({
            data: inventoryItems
        });

        return user;
    } catch (error) {
        throw new Error(`Error in createUser function: ${error.message}`);
    } finally {
        await prisma.$disconnect();
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
    } finally {
        await prisma.$disconnect();
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
    } finally {
        await prisma.$disconnect();
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

    await prisma.$disconnect();
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
    } finally {
        await prisma.$disconnect();
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

async function getUser(data, increment) {
    try {
        let res;

        if (data.username) {
            const matchingUsers = await prisma.user.findMany({
                where: {
                    username: data.username
                }
            });

            for (const user of matchingUsers) {
                if (await bcrypt.compare(data.password + user.password_salt, user.password_hash)) {
                    res = await prisma.user.findUnique({
                        where: { id: user.id }
                    });
                    incrementConnectionCount(res.id);
                }
            }
        } else {
            res = await prisma.user.findUnique({
                where: { id: data }
            });
            if (increment) {incrementConnectionCount(res.id);}
        }

        return res ? res : null;
    } catch (error) {
        console.log(`Error in getUser function: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = {
    isAdmin,
    createUser,
    getLeaderboard,
    getUsers,
    deleteUser,
    getUser,
    getUserData
};