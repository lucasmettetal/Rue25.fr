// Nettoyage des fichiers téléversés qui ne sont plus référencés par aucun produit.
//
//   Remplacer une photo ou une vidéo dans l'admin n'efface pas l'ancien fichier :
//   il reste sur le volume. Avec des vidéos de 30 Mo, le disque se remplit sans
//   qu'on s'en aperçoive.
//
//   Par défaut le script n'affiche qu'un aperçu. La suppression n'a lieu qu'avec
//   --confirm, et elle est définitive.
//
//   Usage :
//     node scripts/prune-uploads.js              # aperçu seul
//     node scripts/prune-uploads.js --confirm    # supprime les orphelins
//
//   À lancer là où le dossier uploads/ est monté (sur Railway : le service API).

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const UPLOADS = 'uploads';
const confirm = process.argv.includes('--confirm');

// Les URL stockées sont tantôt relatives (/uploads/x.jpg), tantôt absolues
// (https://api…/uploads/x.jpg) selon l'époque : seul le nom de fichier compte.
function nomDeFichier(url) {
  if (!url) return null;
  const sansParams = String(url).split('?')[0];
  const nom = sansParams.split('/').pop();
  return nom || null;
}

function formatTaille(octets) {
  const mo = octets / (1024 * 1024);
  return mo >= 1 ? `${mo.toFixed(1)} Mo` : `${Math.round(octets / 1024)} Ko`;
}

async function main() {
  let fichiers;
  try {
    fichiers = await fs.readdir(UPLOADS);
  } catch {
    console.log(`Aucun dossier ${UPLOADS}/ ici — rien à nettoyer.`);
    return;
  }

  const produits = await prisma.product.findMany({
    select: { imageUrl: true, images: true, videoUrl: true },
  });

  const references = new Set();
  for (const p of produits) {
    for (const url of [p.imageUrl, p.videoUrl, ...(p.images ?? [])]) {
      const nom = nomDeFichier(url);
      if (nom) references.add(nom);
    }
  }

  const orphelins = [];
  let poids = 0;
  for (const nom of fichiers) {
    if (references.has(nom)) continue;
    const info = await fs.stat(path.join(UPLOADS, nom));
    if (!info.isFile()) continue;
    orphelins.push({ nom, taille: info.size });
    poids += info.size;
  }

  console.log(`\n📊 ${fichiers.length} fichier(s) dans ${UPLOADS}/, ${references.size} référencé(s) par un produit.`);

  if (orphelins.length === 0) {
    console.log('✅ Aucun fichier orphelin.\n');
    return;
  }

  console.log(`\n🗑️  ${orphelins.length} orphelin(s), ${formatTaille(poids)} au total :`);
  for (const o of orphelins) console.log(`   • ${o.nom} (${formatTaille(o.taille)})`);

  if (!confirm) {
    console.log('\n🔒 Aperçu seul — rien n’a été supprimé.');
    console.log('   Relancez avec --confirm pour appliquer (action DÉFINITIVE).\n');
    return;
  }

  for (const o of orphelins) await fs.unlink(path.join(UPLOADS, o.nom));
  console.log(`\n✅ ${orphelins.length} fichier(s) supprimé(s), ${formatTaille(poids)} libéré(s).\n`);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
