import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { requireCustomer } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
});

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ── Admin login ──────────────────────────────────────────────────────────────

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') return res.status(401).json({ error: 'Identifiants incorrects' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = signToken({ id: user.id, email: user.email, role: 'ADMIN' });
    res.json({ token, admin: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Customer register ────────────────────────────────────────────────────────

router.post('/register', loginLimiter, async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' });
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hash, firstName: firstName || null, lastName: lastName || null, role: 'USER' },
    });
    const token = signToken({ id: user.id, email: user.email, role: 'USER' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Customer login ───────────────────────────────────────────────────────────

router.post('/customer/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'USER') return res.status(401).json({ error: 'Identifiants incorrects' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = signToken({ id: user.id, email: user.email, role: 'USER' });
    res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Current customer profile ─────────────────────────────────────────────────

router.get('/me', requireCustomer, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Customer orders ──────────────────────────────────────────────────────────

router.get('/my-orders', requireCustomer, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(o => ({
      id: o.id,
      reference: o.reference,
      status: o.status,
      total: o.total,
      created_at: o.createdAt,
      items: o.items.map(i => ({
        id: i.id, name: i.name, price: i.price, size: i.size, quantity: i.quantity,
      })),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
