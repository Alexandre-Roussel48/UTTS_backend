const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOrUpdateInventory(userId, cardId) {
  try {
    const inventory = await prisma.inventory.upsert({
      where: {
        user_id_card_id: {
          user_id: userId,
          card_id: cardId
        }
      },
      update: {
        count: {
          increment: 1
        }
      },
      create: {
        user_id: userId,
        card_id: cardId,
        count: 1
      }
    });
    return inventory;
  } catch (error) {
    console.error('Error creating or updating inventory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteOrUpdateInventory(userId, cardId, forge) {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: {
        user_id_card_id: {
          user_id: userId,
          card_id: cardId
        }
      }
    });


    if (inventory) {
      if (inventory.count > 1) {

        if (forge || inventory.count == inventory.forge) {
          const updatedInventory = await prisma.inventory.update({
            where: {
              user_id_card_id: {
                user_id: userId,
                card_id: cardId
              }
            },
            data: {
              forge: {
                decrement: 1
              },
              count: {
                decrement: 1
              }
            }
          });
          return updatedInventory;
        }

        const updatedInventory = await prisma.inventory.update({
          where: {
            user_id_card_id: {
              user_id: userId,
              card_id: cardId
            }
          },
          data: {
            count: {
              decrement: 1
            }
          }
        });
        return updatedInventory;
      }
      
      await prisma.inventory.delete({
        where: {
          user_id_card_id: {
            user_id: userId,
            card_id: cardId
          }
        }
      });
      return null;
    }
  } catch (error) {
    console.error('Error creating, updating, or deleting inventory:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getInventory(userId) {
    try {
        const inventories = await prisma.inventory.findMany({
            where: {
                user_id: userId,
                count: {gt : 0}
            }
        });

        const filteredInventories = inventories.filter(inventory => (inventory.count - inventory.forge) > 0);

        const cards = await Promise.all(filteredInventories.map(async (inventory) => {
            const card = await prisma.card.findUnique({
                where: {
                    id: inventory.card_id
                }
            });
            card.count = inventory.count - inventory.forge;
            return card;
        }));
        return cards;
    } catch (error) {
        console.log(`Error fetching inventory: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

async function dropCard(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (user.next_card > new Date()) {
            return null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { next_card: new Date(Date.now() + (1000 * 20)) },
        });

        const commonCards = await prisma.card.findMany({
          where: {
            rarity: 'common'
          }
        });

        const dropArray = commonCards.sort(() => Math.random() - 0.5);

        const drop = dropArray[0];

        await createOrUpdateInventory(userId, drop.id);

        return { drop: drop, next_card: updatedUser.next_card };
    } catch (error) {
        console.log(`Error fetching drop: ${error.message}`);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = {
    createOrUpdateInventory,
    deleteOrUpdateInventory,
    getInventory,
    dropCard
};