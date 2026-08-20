import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../lib/prisma.js', () => ({
  default: {
    product: { findMany: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../lib/mailer.js', () => ({
  sendOrderConfirmation: vi.fn(),
}));

import app from '../app.js';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;

function userToken(id = 1) {
  return jwt.sign({ id, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
}

const ORDER_BODY = {
  customer_name: 'Alice Dupont',
  email: 'alice@example.com',
  items: [{ product_id: 1, quantity: 2, size: 'M' }],
};

describe('POST /api/orders — stock', () => {
  it('refuse la commande si le stock est insuffisant', async () => {
    // Produit avec stock 1, commande de quantité 2
    prisma.product.findMany.mockResolvedValue([
      { id: 1, name: 'Chemise Lin', price: 89, inStock: true, quantity: 1 },
    ]);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken()}`)
      .send(ORDER_BODY);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantité suffisante/i);
  });

  it('refuse la commande si le produit est marqué inStock: false', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 1, name: 'Chemise Lin', price: 89, inStock: false, quantity: 10 },
    ]);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken()}`)
      .send(ORDER_BODY);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantité suffisante/i);
  });

  it('refuse les données invalides — quantité négative', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ ...ORDER_BODY, items: [{ product_id: 1, quantity: -1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantité/i);
  });

  it('refuse les données invalides — email malformé', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ ...ORDER_BODY, email: 'pasunemail' });

    expect(res.status).toBe(400);
  });

  // Rue25.fr autorise la commande sans compte (guest checkout) — contrairement au
  // repo école qui exige la connexion. On vérifie donc que le chemin invité aboutit.
  it('autorise la commande sans compte (guest checkout) → 201', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 1, name: 'Chemise Lin', price: 89, inStock: true, quantity: 10 },
    ]);
    prisma.$transaction.mockImplementation(async (cb) => cb({
      order: {
        create: vi.fn().mockResolvedValue({
          id: 1, reference: 'R25-1234567', status: 'nouveau', total: 178,
          customerName: 'Alice Dupont', customerEmail: 'alice@example.com',
          createdAt: new Date(), updatedAt: new Date(), items: [],
        }),
      },
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    }));

    const res = await request(app).post('/api/orders').send(ORDER_BODY);
    expect(res.status).toBe(201);
  });
});
