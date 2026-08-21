// Purge des données de test — À exécuter contre la base de PRODUCTION avant l'ouverture.
//
//   Par défaut le script ne supprime RIEN : il affiche ce qu'il supprimerait.
//   La suppression n'a lieu qu'avec --confirm, et elle est DÉFINITIVE.
//
//   Usage :
//     node scripts/purge-test-data.js                       # aperçu seul
//     node scripts/purge-test-data.js --confirm             # supprime les commandes
//     node scripts/purge-test-data.js --confirm --sur-mesure --clients --produits
//
//   Cibles :
//     (toujours)     commandes + lignes de commande
//     --sur-mesure   demandes sur mesure
//     --clients      comptes clients et leurs adresses (JAMAIS les comptes admin)
//     --produits     produits du catalogue (impossible tant qu'une commande les référence,
//                    d'où la suppression des commandes en premier)

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const targets = {
  orders: true,
  customOrders: args.includes('--sur-mesure'),
  customers: args.includes('--clients'),
  products: args.includes('--produits'),
};

async function inventory() {
  const [orders, items, customOrders, customers, addresses, products, admins] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.customOrder.count(),
    prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
    prisma.address.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
  ]);
  return { orders, items, customOrders, customers, addresses, products, admins };
}

function report(before) {
  console.log('\n📊 Contenu actuel de la base :');
  console.log(`   commandes ................ ${before.orders} (${before.items} ligne(s))`);
  console.log(`   demandes sur mesure ...... ${before.customOrders}`);
  console.log(`   comptes clients .......... ${before.customers} (${before.addresses} adresse(s))`);
  console.log(`   produits ................. ${before.products}`);
  console.log(`   comptes admin ............ ${before.admins}  ← jamais touchés`);

  const planned = [
    targets.orders && `les ${before.orders} commande(s) et leurs lignes`,
    targets.customOrders && `les ${before.customOrders} demande(s) sur mesure`,
    targets.customers && `les ${before.customers} compte(s) client et leurs adresses`,
    targets.products && `les ${before.products} produit(s) du catalogue`,
  ].filter(Boolean);

  console.log('\n🗑️  Seraient supprimés :');
  planned.forEach(p => console.log(`   • ${p}`));
}

async function purge() {
  // Les lignes de commande partent en cascade avec leur commande (onDelete: Cascade).
  const orders = await prisma.order.deleteMany({});
  console.log(`   ✅ ${orders.count} commande(s) supprimée(s)`);

  if (targets.customOrders) {
    const custom = await prisma.customOrder.deleteMany({});
    console.log(`   ✅ ${custom.count} demande(s) sur mesure supprimée(s)`);
  }

  if (targets.customers) {
    // Les adresses appartiennent aux clients : elles partent d'abord.
    const addresses = await prisma.address.deleteMany({});
    const users = await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
    console.log(`   ✅ ${users.count} compte(s) client et ${addresses.count} adresse(s) supprimé(s)`);
  }

  if (targets.products) {
    // Possible seulement maintenant : order_items.product_id est en onDelete Restrict.
    const products = await prisma.product.deleteMany({});
    console.log(`   ✅ ${products.count} produit(s) supprimé(s)`);
  }
}

async function main() {
  const before = await inventory();
  report(before);

  if (!confirm) {
    console.log('\n🔒 Aperçu seul — rien n’a été supprimé.');
    console.log('   Relancez avec --confirm pour appliquer (action DÉFINITIVE).\n');
    return;
  }

  console.log('\n⚠️  Suppression en cours…');
  await purge();

  const after = await inventory();
  console.log('\n📊 Après purge :');
  console.log(`   commandes ${after.orders} · sur mesure ${after.customOrders} · clients ${after.customers} · produits ${after.products} · admin ${after.admins}`);
}

main()
  .then(() => console.log('\n🎉 Terminé.\n'))
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
