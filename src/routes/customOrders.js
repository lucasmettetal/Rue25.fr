import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { generateRef, isValidEmail, stripHeaderChars } from '../lib/utils.js';
import { sendCustomOrderConfirmation } from '../lib/mailer.js';

const router = Router();

const VALID_STATUSES = ['nouveau', 'en étude', 'devis envoyé', 'accepté', 'en création', 'terminé', 'annulé'];

const customOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes envoyées, réessayez dans une heure' },
});

function toJSON(c) {
  return {
    id: c.id,
    reference: c.reference,
    status: c.status,
    name: c.name,
    email: c.email,
    phone: c.phone,
    garment_type: c.garmentType,
    description: c.description,
    chest: c.chest,
    waist: c.waist,
    hips: c.hips,
    height: c.height,
    inseam: c.inseam,
    materials: c.materials,
    budget: c.budget,
    timeline: c.timeline,
    notes: c.notes,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

// ── Public — soumettre une demande ───────────────────────────────────────────

router.post('/', customOrderLimiter, async (req, res) => {
  const { name, email, phone, garment_type, description, chest, waist, hips, height, inseam, materials, budget, timeline, notes } = req.body;
  if (!name || !email || !garment_type || !description) {
    return res.status(400).json({ error: 'Nom, email, type de vêtement et description sont requis' });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalide' });
  const safeName = stripHeaderChars(name);
  try {
    const order = await prisma.customOrder.create({
      data: {
        reference: generateRef('SM'),
        name: safeName,
        email,
        phone: phone || null,
        garmentType: garment_type,
        description,
        chest: chest || null,
        waist: waist || null,
        hips: hips || null,
        height: height || null,
        inseam: inseam || null,
        materials: materials || null,
        budget: budget || null,
        timeline: timeline || null,
        notes: notes || null,
      },
    });

    sendCustomOrderConfirmation({
      to: email,
      name: safeName,
      reference: order.reference,
      garmentType: garment_type,
    });

    res.status(201).json({ reference: order.reference, id: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.customOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(toJSON));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await prisma.customOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Demande introuvable' });
    res.json(toJSON(order));
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
    const order = await prisma.customOrder.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json(toJSON(order));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Demande introuvable' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
