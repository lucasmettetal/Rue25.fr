import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// vi.hoisted crée les mocks avant que les modules soient chargés —
// nécessaire pour les partager entre la factory vi.mock() et les tests.
const { mockConstructEvent, mockRetrieve } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockRetrieve: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class {
    constructor() {
      this.webhooks = { constructEvent: mockConstructEvent };
      this.checkout = { sessions: { retrieve: mockRetrieve } };
    }
  },
}));

vi.mock('../lib/prisma.js', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    product: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../lib/mailer.js', () => ({
  sendOrderConfirmation: vi.fn(),
}));

import app from '../app.js';
import prisma from '../lib/prisma.js';

const FAKE_BODY = Buffer.from(JSON.stringify({ type: 'checkout.session.completed' }));

describe('Webhook Stripe — signature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejette une signature invalide → 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'sig_invalide')
      .send(FAKE_BODY);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature invalide/i);
  });

  it('rejette une requête sans en-tête stripe-signature → 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No stripe-signature header value was provided');
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(FAKE_BODY);

    expect(res.status).toBe(400);
  });
});

describe('Webhook Stripe — idempotence', () => {
  const FAKE_SESSION = {
    id: 'cs_test_abc123',
    payment_status: 'paid',
    metadata: { user_id: null, customer_name: 'Alice', customer_email: 'alice@example.com' },
    amount_total: 8900,
  };

  const EXISTING_ORDER = {
    id: 99,
    reference: 'R25-111111',
    status: 'nouveau',
    total: 89,
    customerName: 'Alice',
    customerEmail: 'alice@example.com',
    stripeSessionId: 'cs_test_abc123',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne crée pas de doublon si la commande existe déjà (rejeu du webhook)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: FAKE_SESSION },
    });

    // La commande existe déjà en base
    prisma.order.findUnique.mockResolvedValue(EXISTING_ORDER);

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'sig_valide_mockee')
      .send(FAKE_BODY);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
});
