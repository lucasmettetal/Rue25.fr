import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { generateRef, orderToJSON } from '../lib/utils.js';
import { sendOrderConfirmation } from '../lib/mailer.js';

const router = Router();

const VALID_STATUSES = ['nouveau', 'en cours', 'livré', 'annulé'];

// ── Public — place an order ─────────────────────────────────────────────────

router.post('/', optionalAuth, async (req, res) => {
  const { customer_name, email, items } = req.body;
  if (!customer_name || !email || !items?.length) {
    return res.status(400).json({ error: 'Données de commande incomplètes' });
  }
  try {
    const productIds = items.map(i => Number(i.product_id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const byId = Object.fromEntries(products.map(p => [p.id, p]));

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const product = byId[Number(item.product_id)];
      if (!product) throw new Error(`Produit ${item.product_id} introuvable`);
      if (!product.inStock) throw new Error(`${product.name} est épuisé`);
      total += Number(product.price) * item.quantity;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: item.size || null,
        quantity: item.quantity,
      });
    }

    const order = await prisma.order.create({
      data: {
        reference: generateRef(),
        customerName: customer_name,
        customerEmail: email,
        total,
        userId: req.authUser?.id || null,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    sendOrderConfirmation({
      to: email,
      name: customer_name,
      reference: order.reference,
      items: order.items,
      total: order.total,
    });

    res.status(201).json({ order: orderToJSON(order), reference: order.reference });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [revenue, pending, total] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'livré' }, _sum: { total: true } }),
      prisma.order.count({ where: { status: { in: ['nouveau', 'en cours'] } } }),
      prisma.order.count(),
    ]);
    res.json({
      revenue: Number(revenue._sum.total || 0),
      pendingOrders: pending,
      totalOrders: total,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(orderToJSON));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { items: true },
    });
    res.json(orderToJSON(order));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Commande introuvable' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
