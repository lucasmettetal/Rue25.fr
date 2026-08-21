import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../lib/prisma.js', () => ({
  default: {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    category: { upsert: vi.fn() },
  },
}));

vi.mock('../lib/mailer.js', () => ({
  sendOrderConfirmation: vi.fn(),
}));

import app from '../app.js';
import prisma from '../lib/prisma.js';

const PRODUCT = {
  id: 1,
  name: 'Chemise Lin Naturel',
  slug: 'chemise-lin-naturel',
  description: 'Chemise artisanale en lin.',
  price: 89,
  imageUrl: null,
  inStock: true,
  quantity: 3,
  sizes: ['S', 'M'],
  materials: ['Lin 100%'],
  category: { id: 1, name: 'Chemises', slug: 'chemises' },
  createdAt: new Date('2026-06-14'),
  updatedAt: new Date('2026-08-20'),
};

describe('GET /api/products/:idOrSlug', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
  });

  it('cherche par identifiant quand le paramètre est numérique', async () => {
    prisma.product.findUnique.mockResolvedValue(PRODUCT);

    const res = await request(app).get('/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('chemise-lin-naturel');
    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it('cherche par slug quand le paramètre ne l’est pas', async () => {
    prisma.product.findUnique.mockResolvedValue(PRODUCT);

    const res = await request(app).get('/api/products/chemise-lin-naturel');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Chemise Lin Naturel');
    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'chemise-lin-naturel' } }),
    );
  });

  it('répond 404 sur un slug inconnu', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/products/piece-supprimee');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/introuvable/i);
  });
});

// ── Galerie ─────────────────────────────────────────────────────────────────

function adminToken() {
  return jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const BASE_BODY = { name: 'Veste', price: 169, category: 'Vestes', quantity: 2 };

describe('galerie produit', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.product.create.mockReset();
    prisma.product.update.mockReset();
    prisma.category.upsert.mockReset();
    prisma.category.upsert.mockResolvedValue({ id: 1, name: 'Vestes', slug: 'vestes' });
    prisma.product.findUnique.mockResolvedValue(null); // slug libre
    prisma.product.create.mockImplementation(({ data }) => ({ ...PRODUCT, ...data, category: PRODUCT.category }));
    prisma.product.update.mockImplementation(({ data }) => ({ ...PRODUCT, ...data, category: PRODUCT.category }));
  });

  it('refuse plus de 5 visuels', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...BASE_BODY, images: ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg', '/6.jpg'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 visuels maximum/i);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('retient le premier visuel comme image principale et écarte les doublons', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...BASE_BODY, images: ['/a.jpg', '  ', '/b.jpg', '/a.jpg'], video_url: ' /film.mp4 ' });

    expect(res.status).toBe(201);
    const { data } = prisma.product.create.mock.calls[0][0];
    expect(data.images).toEqual(['/a.jpg', '/b.jpg']);
    expect(data.imageUrl).toBe('/a.jpg');
    expect(data.videoUrl).toBe('/film.mp4');
  });

  it('reprend une image seule quand la galerie n’est pas fournie', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...BASE_BODY, image_url: '/seule.jpg' });

    expect(res.status).toBe(201);
    const { data } = prisma.product.create.mock.calls[0][0];
    expect(data.images).toEqual(['/seule.jpg']);
  });

  it('garde galerie et image principale cohérentes à la mise à jour', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ images: ['/nouveau.jpg', '/autre.jpg'] });

    expect(res.status).toBe(200);
    const { data } = prisma.product.update.mock.calls[0][0];
    expect(data.imageUrl).toBe('/nouveau.jpg');
    expect(data.images).toEqual(['/nouveau.jpg', '/autre.jpg']);
  });

  it('vide la galerie et l’image principale ensemble', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ images: [] });

    expect(res.status).toBe(200);
    const { data } = prisma.product.update.mock.calls[0][0];
    expect(data.images).toEqual([]);
    expect(data.imageUrl).toBeNull();
  });
});
