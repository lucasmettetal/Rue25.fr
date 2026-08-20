import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import authRoutes        from './routes/auth.js';
import productRoutes     from './routes/products.js';
import orderRoutes       from './routes/orders.js';
import stripeRoutes, { stripeWebhook } from './routes/stripe.js';
import customOrderRoutes from './routes/customOrders.js';
import uploadRoutes      from './routes/upload.js';
import contactRoutes     from './routes/contact.js';

const app = express();

// Derrière le proxy Railway/Cloudflare : nécessaire pour que le rate-limiter
// et les cookies voient la vraie IP client, pas celle du proxy.
app.set('trust proxy', 1);

// En-têtes de sécurité. crossOriginResourcePolicy en cross-origin car les
// images uploadées (/uploads) sont servies par l'API mais affichées depuis le
// front (domaine différent en production).
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://rue25.fr',
  'https://www.rue25.fr',
  'https://rue25.lucas-mettetal2.workers.dev',
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));

// Le webhook Stripe nécessite le body brut — doit être monté avant express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());

// Images produits uploadées par l'admin
app.use('/uploads', express.static('uploads'));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'rue25-api' }));

app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/stripe',        stripeRoutes);
app.use('/api/custom-orders', customOrderRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/contact',       contactRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

export default app;
