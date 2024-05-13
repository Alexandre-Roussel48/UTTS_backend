const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.card.createMany({
    data: [
      {id: 1, name: 'barriere_chantier', rarity: 'common'},
      {id: 2, name: 'cable_iphone_casse', rarity: 'common'},
      {id: 3, name: 'chat_mignon', rarity: 'common'},
      {id: 4, name: 'esc_key', rarity: 'common'},
      {id: 5, name: 'extincteur', rarity: 'common'},
      {id: 6, name: 'latte_lit', rarity: 'common'},
      {id: 7, name: 'mcdo_toy', rarity: 'common'},
      {id: 8, name: 'panneau_routier', rarity: 'common'},
      {id: 9, name: 'plot_de_chantier', rarity: 'common'},
      {id: 10, name: 'pot_a_eau', rarity: 'common'},
      {id: 11, name: 'ressort', rarity: 'common'},
      {id: 12, name: 'rj45', rarity: 'common'},
      {id: 13, name: 'vaisselle_mcdo', rarity: 'common'},
      {id: 14, name: 'vis_chaise', rarity: 'common'},
      {id: 15, name: '86_vide', rarity: 'uncommon'},
      {id: 16, name: 'parpaing', rarity: 'uncommon'},
      {id: 17, name: 'verre_tarbrew', rarity: 'uncommon'},
      {id: 18, name: 'ventouse', rarity: 'uncommon'},
      {id: 19, name: 'kapla', rarity: 'uncommon'},
      {id: 20, name: 'lait_perime', rarity: 'uncommon'},
      {id: 21, name: 'pq_vide', rarity: 'uncommon'},
      {id: 22, name: 'molette_souris', rarity: 'uncommon'},
      {id: 23, name: 'mousqueton', rarity: 'uncommon'},
      {id: 24, name: 'enjoliveur', rarity: 'uncommon'},
      {id: 25, name: 'dalle_plafond', rarity: 'uncommon'},
      {id: 26, name: 'tuyau_douche', rarity: 'uncommon'},
      {id: 27, name: 'ventilateur_pc', rarity: 'uncommon'},
      {id: 28, name: 'thermostat', rarity: 'uncommon'},
      {id: 29, name: 'velleda', rarity: 'rare'},
      {id: 30, name: 'masque_cheval', rarity: 'rare'},
      {id: 31, name: 'dvd_beauf', rarity: 'rare'},
      {id: 32, name: 'harmonica', rarity: 'rare'},
      {id: 33, name: 'hamster', rarity: 'rare'},
      {id: 34, name: 'essuie_glace', rarity: 'rare'},
      {id: 35, name: 'plaque_egout', rarity: 'rare'},
      {id: 36, name: 'cuvette_wc', rarity: 'rare'},
      {id: 37, name: 'feu_tricolore', rarity: 'epic'},
      {id: 38, name: 'masque_gaz', rarity: 'epic'},
      {id: 39, name: 'gopro', rarity: 'epic'},
      {id: 40, name: 'clopes', rarity: 'epic'},
      {id: 41, name: 'flipper_3.0', rarity: 'epic'},
      {id: 42, name: 'pano_mtp', rarity: 'legendary'},
      {id: 43, name: 'bibal', rarity: 'legendary'},
      {id: 44, name: 'bus_tam', rarity: 'legendary'},
      {id: 45, name: 'c15', rarity: 'legendary'}
    ],
  });

  console.log('Multiple rows created successfully');
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
