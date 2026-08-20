import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Prisma — aucune base de données réelle dans les tests
vi.mock('../lib/prisma.js', () => ({
  default: {
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock mailer — pas d'envoi d'email pendant les tests
vi.mock('../lib/mailer.js', () => ({
  sendOrderConfirmation: vi.fn(),
}));

import app from '../app.js';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Contrôle d\'accès — routes admin', () => {
  it('GET /api/orders/stats sans token → 401', async () => {
    const res = await request(app).get('/api/orders/stats');
    expect(res.status).toBe(401);
  });

  it('GET /api/orders/stats avec token CLIENT (role USER) → 403', async () => {
    const token = makeToken({ id: 42, role: 'USER' });
    const res = await request(app)
      .get('/api/orders/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/orders/stats avec token ADMIN → 200', async () => {
    prisma.order.aggregate.mockResolvedValue({ _sum: { total: 0 } });
    prisma.order.count.mockResolvedValue(0);
    const token = makeToken({ id: 1, role: 'ADMIN' });
    const res = await request(app)
      .get('/api/orders/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('IDOR — isolation des commandes par utilisateur', () => {
  beforeEach(() => {
    // Simule que l'utilisateur 10 a deux commandes
    prisma.user.findUnique.mockResolvedValue({ id: 10, email: 'alice@example.com' });
    prisma.order.findMany.mockResolvedValue([
      { id: 1, userId: 10, reference: 'R25-111', status: 'nouveau', total: 50, customerName: 'Alice', customerEmail: 'alice@example.com', createdAt: new Date(), updatedAt: new Date(), items: [] },
    ]);
  });

  it('GET /api/auth/my-orders retourne uniquement les commandes de l\'utilisateur connecté', async () => {
    const token = makeToken({ id: 10, role: 'USER' });
    const res = await request(app)
      .get('/api/auth/my-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Vérifie que Prisma a bien été appelé avec le filtre sur l'ID de l'utilisateur connecté
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 10 } })
    );
  });

  it('GET /api/auth/my-orders sans token → 401', async () => {
    const res = await request(app).get('/api/auth/my-orders');
    expect(res.status).toBe(401);
  });
});
