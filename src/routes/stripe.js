import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import { generateRef, orderToJSON, isValidEmail, stripHeaderChars } from '../lib/utils.js';
import { sendOrderConfirmation } from '../lib/mailer.js';

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const MAX_REF_ATTEMPTS = 5;

function findOrderBySession(sessionId) {
  return prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  });
}

async function buildOrderItems(items) {
  const productIds = items.map(i => Number(i.product_id));
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = Object.fromEntries(products.map(p => [p.id, p]));

  const orderCounts = new Map();
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const productId = Number(item.product_id);
    orderCounts.set(productId, (orderCounts.get(productId) || 0) + item.quantity);
    const product = byId[productId];
    if (!product) throw new Error(`Produit ${item.product_id} introuvable`);
    orderItems.push({
      productId,
      name: product.name,
      price: product.price,
      size: item.size || null,
      quantity: item.quantity,
    });
    total += Number(product.price) * item.quantity;
  }

  for (const [productId, orderedQty] of orderCounts.entries()) {
    const product = byId[productId];
    if (!product) throw new Error(`Produit ${productId} introuvable`);
    if (!product.inStock || product.quantity < orderedQty) {
      throw new Error(`${product.name} n'est pas disponible en quantité suffisante`);
    }
  }

  return { total, orderItems };
}

// Crée la commande correspondant à une session Stripe payée, ou retourne celle
// qui existe déjà. L'unicité de stripe_session_id en base est ce qui garantit
// qu'un webhook et un appel /verify simultanés ne créent jamais deux commandes
// pour le même paiement : le perdant reçoit une violation d'unicité (P2002) et
// récupère la commande gagnante.
// Retourne { order, created } — created indique s'il faut envoyer l'email.
async function findOrCreateOrderForSession(session) {
  const existing = await findOrderBySession(session.id);
  if (existing) return { order: existing, created: false };

  const { customer_name, email, items: itemsJson, user_id } = session.metadata;
  const items = JSON.parse(itemsJson);

  let total, orderItems;
  try {
    ({ total, orderItems } = await buildOrderItems(items));
  } catch (err) {
    // Le stock a pu être décrémenté entre-temps par l'autre chemin de création
    const winner = await findOrderBySession(session.id);
    if (winner) return { order: winner, created: false };
    throw err;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => Number(i.product_id)) } },
  });

  for (let attempt = 0; attempt < MAX_REF_ATTEMPTS; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            reference: generateRef(),
            stripeSessionId: session.id,
            customerName: customer_name,
            customerEmail: email,
            total,
            status: 'nouveau',
            userId: user_id ? Number(user_id) : null,
            items: { create: orderItems },
          },
          include: { items: true },
        });

        for (const product of products) {
          const orderedQty = items
            .filter(i => Number(i.product_id) === product.id)
            .reduce((sum, i) => sum + i.quantity, 0);
          const remaining = product.quantity - orderedQty;
          const updated = await tx.product.updateMany({
            where: { id: product.id, quantity: { gte: orderedQty } },
            data: { quantity: remaining, inStock: remaining > 0 },
          });
          if (updated.count === 0) {
            throw new Error(`Impossible de mettre à jour le stock pour ${product.name}`);
          }
        }

        return newOrder;
      });

      return { order, created: true };
    } catch (err) {
      if (err.code !== 'P2002') throw err;

      const target = String(err.meta?.target ?? '');
      if (target.includes('session')) {
        // L'autre chemin (webhook ou /verify) a gagné la course
        const winner = await findOrderBySession(session.id);
        if (winner) return { order: winner, created: false };
        throw err;
      }
      // Collision improbable sur la référence aléatoire : on retente
    }
  }

  throw new Error('Impossible de générer une référence de commande unique');
}

// POST /api/stripe/checkout — crée une session Stripe Checkout
router.post('/checkout', optionalAuth, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env' });
  }

  const { items, customer_name, email, shipping } = req.body;
  if (!items?.length || !customer_name || !email) {
    return res.status(400).json({ error: 'Données manquantes' });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalide' });
  const safeCustomerName = stripHeaderChars(customer_name);

  try {
    const productIds = items.map(i => Number(i.product_id));
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const byId = Object.fromEntries(products.map(p => [p.id, p]));

    const orderCounts = new Map();
    const lineItems = [];
    for (const item of items) {
      const productId = Number(item.product_id);
      const product = byId[productId];
      if (!product) throw new Error(`Produit ${item.product_id} introuvable`);
      const nextCount = (orderCounts.get(productId) || 0) + item.quantity;
      orderCounts.set(productId, nextCount);
      if (!product.inStock || product.quantity < nextCount) {
        throw new Error(`${product.name} n'est pas disponible en quantité suffisante`);
      }
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            ...(item.size ? { description: `Taille : ${item.size}` } : {}),
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        customer_name: safeCustomerName,
        email,
        shipping: shipping || '',
        items: JSON.stringify(items),
        user_id: req.authUser?.id?.toString() || '',
      },
      success_url: `${process.env.CLIENT_URL}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/stripe/verify/:sessionId — confirmation côté client (fallback si webhook en retard)
router.get('/verify/:sessionId', optionalAuth, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' });

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Paiement non confirmé' });
    }

    // Une commande liée à un compte ne peut être consultée que par son propriétaire ou un admin
    const sessionUserId = session.metadata?.user_id ? Number(session.metadata.user_id) : null;
    if (sessionUserId && req.authUser?.id !== sessionUserId && req.authUser?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Soit la commande a déjà été créée par le webhook, soit on la crée ici
    // (fallback si le webhook n'a pas encore tiré)
    const { order, created } = await findOrCreateOrderForSession(session);

    if (created) {
      sendOrderConfirmation({
        to: order.customerEmail,
        name: order.customerName,
        reference: order.reference,
        items: order.items,
        total: order.total,
      });
    }

    res.json({ order: orderToJSON(order), reference: order.reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

// ── Webhook Stripe (monté avant express.json dans index.js) ──────────────────
export async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' });

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET manquant' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).json({ error: `Signature invalide : ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') return res.json({ received: true });

    const { order, created } = await findOrCreateOrderForSession(session);
    if (!created) return res.json({ received: true });

    sendOrderConfirmation({
      to: order.customerEmail,
      name: order.customerName,
      reference: order.reference,
      items: order.items,
      total: order.total,
    });
  }

  res.json({ received: true });
}
