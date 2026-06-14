import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ── Catégories ───────────────────────────────────────────────────────────

  const chemises = await prisma.category.create({
    data: { name: 'Chemises', slug: 'chemises', description: 'Chemises artisanales en fibres naturelles' },
  });
  const robes = await prisma.category.create({
    data: { name: 'Robes', slug: 'robes', description: 'Robes confectionnées à la main' },
  });
  const vestes = await prisma.category.create({
    data: { name: 'Vestes', slug: 'vestes', description: 'Vestes et manteaux en fibres naturelles' },
  });

  console.log('✅ 3 catégories créées');

  // ── Produits ─────────────────────────────────────────────────────────────

  await prisma.product.createMany({
    data: [
      // Chemises
      {
        name: 'Chemise Lin Naturel', slug: 'chemise-lin-naturel',
        description: 'Chemise artisanale en lin 100% naturel, cousue à la main. Coupe décontractée, parfaite pour l\'été.',
        price: 89.00,
        imageUrl: 'https://images.unsplash.com/photo-1602215464429-5d4eb71a7711?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L','XL'], materials: ['Lin 100%', 'Boutons nacre'], categoryId: chemises.id,
      },
      {
        name: 'Chemise Coton Bio', slug: 'chemise-coton-bio',
        description: 'Chemise légère en coton biologique certifié GOTS. Coutures plates pour un confort optimal.',
        price: 79.00,
        imageUrl: 'https://images.unsplash.com/photo-1604695573706-53170668f6a6?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['S','M','L','XL'], materials: ['Coton bio 100%'], categoryId: chemises.id,
      },
      {
        name: 'Chemise Voile de Soie', slug: 'chemise-voile-soie',
        description: 'Chemise en voile de soie, légèreté et élégance naturelle. Finition à la main.',
        price: 135.00,
        imageUrl: 'https://images.unsplash.com/photo-1625946227485-0f5bfabf75cf?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L'], materials: ['Soie 100%'], categoryId: chemises.id,
      },
      // Robes
      {
        name: 'Robe Coton Brodée', slug: 'robe-coton-brodee',
        description: 'Robe longue en coton biologique avec broderies florales faites main. 15 heures de travail artisanal.',
        price: 145.00,
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L'], materials: ['Coton bio', 'Fil de broderie'], categoryId: robes.id,
      },
      {
        name: 'Robe Lin Midi', slug: 'robe-lin-midi',
        description: 'Robe mi-longue en lin lavé, tombé naturel. Fabriquée en atelier français.',
        price: 118.00,
        imageUrl: 'https://images.unsplash.com/photo-1550639524-a6e63e7b5b6f?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L','XL'], materials: ['Lin lavé 100%'], categoryId: robes.id,
      },
      {
        name: 'Robe Soie Plissée', slug: 'robe-soie-plissee',
        description: 'Robe plissée en soie naturelle, coupe fluide et élégante. Pièce d\'exception.',
        price: 195.00,
        imageUrl: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600&h=800&fit=crop&auto=format',
        inStock: false, sizes: ['S','M','L'], materials: ['Soie 70%', 'Lin 30%'], categoryId: robes.id,
      },
      // Vestes
      {
        name: 'Veste Laine Mérinos', slug: 'veste-laine-merinos',
        description: 'Veste structurée en laine mérinos, tricotée à la main. Design intemporel.',
        price: 195.00,
        imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L','XL'], materials: ['Laine mérinos 100%', 'Doublure coton'], categoryId: vestes.id,
      },
      {
        name: 'Veste Tweed Artisanale', slug: 'veste-tweed-artisanale',
        description: 'Veste en tweed tissé en Bretagne. Structure et caractère, finitions soignées.',
        price: 245.00,
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['S','M','L','XL'], materials: ['Laine tweed 90%', 'Cachemire 10%'], categoryId: vestes.id,
      },
      {
        name: 'Manteau Cachemire', slug: 'manteau-cachemire',
        description: 'Manteau long en cachemire mongol. Coupe droite, fermeture crochets dorés.',
        price: 395.00,
        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L'], materials: ['Cachemire 100%'], categoryId: vestes.id,
      },
      {
        name: 'Veste Lin Structurée', slug: 'veste-lin-structuree',
        description: 'Veste en lin brossé avec entoilage naturel. Coupe ajustée, style intemporel.',
        price: 158.00,
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop&auto=format',
        inStock: true, sizes: ['XS','S','M','L','XL'], materials: ['Lin 100%'], categoryId: vestes.id,
      },
    ],
  });

  console.log('✅ 10 produits créés');

  // ── Admin ────────────────────────────────────────────────────────────────

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin25', 12);
  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@rue25.fr',
      password: hash,
      firstName: 'Admin',
      lastName: 'Rue25',
      role: 'ADMIN',
    },
  });

  console.log('✅ Compte admin créé');
  console.log('🎉 Seed terminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
