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

export const MAX_IMAGES = 5;

// Nettoie la galerie reçue : chaque entrée est une URL non vide, sans doublon.
// La première est le visuel principal. `image_url` sert de repli pour les
// appels qui n'envoient encore qu'une seule image.
function normalizeImages(images, imageUrl) {
  const source = Array.isArray(images)
    ? images
    : (imageUrl ? [imageUrl] : []);

  const seen = new Set();
  const out = [];
  for (const raw of source) {
    const url = String(raw ?? '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function normalizeVideo(videoUrl) {
  const url = String(videoUrl ?? '').trim();
  return url || null;
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
    images: p.images ?? [],
    video_url: p.videoUrl ?? null,
    in_stock: p.inStock,
    quantity: p.quantity,
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
    console.error(err);
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

// Accepte l'identifiant numérique (utilisé par l'admin) ou le slug (utilisé par
// les URL publiques /produit/:slug, indexables et partageables).
router.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const where = /^\d+$/.test(idOrSlug) ? { id: Number(idOrSlug) } : { slug: idOrSlug };
  try {
    const product = await prisma.product.findUnique({
      where,
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(toJSON(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Admin (JWT required) ────────────────────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  const { name, description, price, category, image_url, images, video_url, quantity, sizes, materials } = req.body;
  if (!name || !price || !category || quantity === undefined) {
    return res.status(400).json({ error: 'Nom, prix, catégorie et quantité requis' });
  }
  if (Number(quantity) < 0) {
    return res.status(400).json({ error: 'Quantité invalide' });
  }
  const gallery = normalizeImages(images, image_url);
  if (gallery.length > MAX_IMAGES) {
    return res.status(400).json({ error: `${MAX_IMAGES} visuels maximum par produit` });
  }
  try {
    const cat = await resolveCategory(category);
    const slug = await uniqueSlug(slugify(name));
    const qty = Number(quantity);
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price,
        imageUrl: gallery[0] || null,
        images: gallery,
        videoUrl: normalizeVideo(video_url),
        quantity: qty,
        inStock: qty > 0,
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
  const { name, description, price, category, image_url, images, video_url, quantity, sizes, materials } = req.body;
  try {
    const data = {};
    if (name !== undefined)        data.name        = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined)       data.price       = price;
    if (video_url !== undefined)   data.videoUrl    = normalizeVideo(video_url);

    // La galerie et le visuel principal ne se dissocient jamais : dès que
    // l'un des deux champs est fourni, on recalcule les deux ensemble.
    if (images !== undefined || image_url !== undefined) {
      const gallery = normalizeImages(images, image_url);
      if (gallery.length > MAX_IMAGES) {
        return res.status(400).json({ error: `${MAX_IMAGES} visuels maximum par produit` });
      }
      data.images   = gallery;
      data.imageUrl = gallery[0] || null;
    }
    if (quantity !== undefined) {
      if (Number(quantity) < 0) return res.status(400).json({ error: 'Quantité invalide' });
      data.quantity = Number(quantity);
      data.inStock = Number(quantity) > 0;
    }
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
    // onDelete: Restrict sur order_items — on préserve l'historique des commandes
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Ce produit est lié à des commandes existantes et ne peut pas être supprimé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
