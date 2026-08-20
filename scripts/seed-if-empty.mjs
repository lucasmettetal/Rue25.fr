import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();
try {
  const count = await prisma.user.count();
  if (count === 0) {
    console.log('🌱 Base vide — seed en cours...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  } else {
    console.log(`✓ Base existante (${count} utilisateur(s)) — seed ignoré`);
  }
} finally {
  await prisma.$disconnect();
}
