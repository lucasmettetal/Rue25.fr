// Rotation de l'identifiant admin — À exécuter UNE fois contre la base de PRODUCTION.
//
//   Ne met JAMAIS le mot de passe dans le code ni dans git : il est lu depuis l'environnement.
//
//   Usage (Railway) :
//     ADMIN_EMAIL="nouveau@rue25.fr" ADMIN_PASSWORD="…" [OLD_ADMIN_EMAIL="admin@rue25.fr"] \
//       node scripts/rotate-admin.js
//
//   - Renomme + réencode le compte ADMIN existant s'il y en a un (ou celui d'OLD_ADMIN_EMAIL).
//   - En crée un si aucun n'existe.
//   Le hash bcrypt (cost 12) est identique à celui du seed.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const oldEmail = process.env.OLD_ADMIN_EMAIL; // optionnel

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis');
  }
  if (password.length < 16) {
    throw new Error('Mot de passe trop court (16 caractères minimum attendus)');
  }

  const hash = await bcrypt.hash(password, 12);

  // On cible le compte à faire évoluer : par OLD_ADMIN_EMAIL sinon le premier ADMIN.
  const target = oldEmail
    ? await prisma.user.findUnique({ where: { email: oldEmail } })
    : await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (target) {
    await prisma.user.update({
      where: { id: target.id },
      data: { email, password: hash, role: 'ADMIN' },
    });
    console.log(`✅ Compte admin mis à jour (id ${target.id}) → ${email}`);
  } else {
    const created = await prisma.user.create({
      data: { email, password: hash, firstName: 'Admin', lastName: 'Rue25', role: 'ADMIN' },
    });
    console.log(`✅ Compte admin créé (id ${created.id}) → ${email}`);
  }

  // Sécurité : s'assurer qu'aucun autre ADMIN ne traîne avec l'ancien couple.
  const others = await prisma.user.findMany({ where: { role: 'ADMIN', email: { not: email } } });
  if (others.length) {
    console.warn(`⚠️  ${others.length} autre(s) compte(s) ADMIN existent encore :`,
      others.map(u => u.email).join(', '));
  }
}

main()
  .then(() => console.log('🎉 Rotation terminée.'))
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
