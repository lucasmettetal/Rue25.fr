import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(base) {
  let slug = base;
  let existing = await prisma.product.findUnique({ where: { slug } });
  let i = 2;
  while (existing) {
    slug = `${base}-${i++}`;
    existing = await prisma.product.findUnique({ where: { slug } });
  }
  return slug;
}

async function resolveCategory(name) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
}

function toJSON(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category?.name ?? null,
    image_url: p.imageUrl,
    in_stock: p.inStock,
    sizes: p.sizes,
    materials: p.materials,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// ── Public ───────────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  const { category, search } = req.query;
  try {
    const where = {};
    if (category && category !== 'Tous') {
      where.category = { name: category };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(toJSON));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(toJSON(product));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Admin (JWT required) ────────────────────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  const { name, description, price, category, image_url, in_stock, sizes, materials } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Nom, prix et catégorie requis' });
  }
  try {
    const cat = await resolveCategory(category);
    const slug = await uniqueSlug(slugify(name));
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price,
        imageUrl: image_url || null,
        inStock: in_stock ?? true,
        sizes: sizes || [],
        materials: materials || [],
        categoryId: cat.id,
      },
      include: { category: true },
    });
    res.status(201).json(toJSON(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, description, price, category, image_url, in_stock, sizes, materials } = req.body;
  try {
    const data = {};
    if (name !== undefined)        data.name        = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined)       data.price       = price;
    if (image_url !== undefined)   data.imageUrl    = image_url;
    if (in_stock !== undefined)    data.inStock     = in_stock;
    if (sizes !== undefined)       data.sizes       = sizes;
    if (materials !== undefined)   data.materials   = materials;
    if (category !== undefined) {
      const cat = await resolveCategory(category);
      data.categoryId = cat.id;
    }
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      include: { category: true },
    });
    res.json(toJSON(product));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
