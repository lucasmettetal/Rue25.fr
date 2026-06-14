import pool from './pool.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const products = [
  {
    name: 'Chemise Lin Naturel',
    description: 'Chemise artisanale en lin 100% naturel, cousue à la main. Coupe décontractée, parfaite pour l\'été.',
    price: 89.00,
    category: 'Chemises',
    image_url: 'https://images.unsplash.com/photo-1602215464429-5d4eb71a7711?w=600&h=800&fit=crop&auto=format',
    in_stock: true,
    sizes: ['S', 'M', 'L', 'XL'],
    materials: ['Lin 100%', 'Boutons nacre'],
  },
  {
    name: 'Robe Coton Brodée',
    description: 'Robe longue en coton biologique avec broderies florales faites main. 15 heures de travail artisanal.',
    price: 145.00,
    category: 'Robes',
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop&auto=format',
    in_stock: true,
    sizes: ['XS', 'S', 'M', 'L'],
    materials: ['Coton bio', 'Fil de broderie'],
  },
  {
    name: 'Veste Laine Mérinos',
    description: 'Veste structurée en laine mérinos, tricotée à la main. Design intemporel.',
    price: 195.00,
    category: 'Vestes',
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&h=800&fit=crop&auto=format',
    in_stock: true,
    sizes: ['S', 'M', 'L'],
    materials: ['Laine mérinos', 'Doublure coton'],
  },
  {
    name: 'Pantalon Toile Lavée',
    description: 'Pantalon décontracté en toile de coton lavée, finitions soignées et poches plaquées.',
    price: 98.00,
    category: 'Pantalons',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=600&h=800&fit=crop&auto=format',
    in_stock: true,
    sizes: ['36', '38', '40', '42', '44'],
    materials: ['Coton toile lavée', 'Boutons laiton'],
  },
  {
    name: 'Pull Cachemire Artisanal',
    description: 'Pull luxueux en cachemire, entièrement tricoté à la main. Douceur incomparable.',
    price: 225.00,
    category: 'Pulls',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop&auto=format',
    in_stock: false,
    sizes: ['S', 'M', 'L'],
    materials: ['Cachemire 100%'],
  },
  {
    name: 'Jupe Midi Plissée',
    description: 'Jupe midi en coton avec plissé artisanal. Taille élastique confortable.',
    price: 78.00,
    category: 'Jupes',
    image_url: 'https://images.unsplash.com/photo-1583496661160-fb5218afa3e9?w=600&h=800&fit=crop&auto=format',
    in_stock: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    materials: ['Coton 95%', 'Élasthanne 5%'],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    // Admin
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin25', 12);
    await client.query(`
      INSERT INTO admins (email, password) VALUES ($1, $2)
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@rue25.fr', hash]);
    console.log('✅ Admin créé');

    // Products
    for (const p of products) {
      await client.query(`
        INSERT INTO products (name, description, price, category, image_url, in_stock, sizes, materials)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [p.name, p.description, p.price, p.category, p.image_url, p.in_stock, p.sizes, p.materials]);
    }
    console.log(`✅ ${products.length} produits insérés`);

    // Sample orders
    const ref = 'R25-001';
    const existing = await client.query('SELECT id FROM orders WHERE reference=$1', [ref]);
    if (existing.rows.length === 0) {
      const prod = await client.query('SELECT id, name, price FROM products LIMIT 1');
      if (prod.rows.length > 0) {
        const { rows: [order] } = await client.query(`
          INSERT INTO orders (reference, customer_name, email, total, status)
          VALUES ($1,$2,$3,$4,$5) RETURNING id
        `, [ref, 'Marie Dupont', 'marie@example.fr', prod.rows[0].price, 'livré']);
        await client.query(`
          INSERT INTO order_items (order_id, product_id, name, price, size, quantity)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [order.id, prod.rows[0].id, prod.rows[0].name, prod.rows[0].price, 'M', 1]);
        console.log('✅ Commande exemple créée');
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => { console.error('Seed échoué :', err); process.exit(1); });
