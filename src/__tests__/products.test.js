import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/prisma.js', () => ({
  default: {
    product: { findUnique: vi.fn() },
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
