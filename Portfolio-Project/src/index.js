import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes        from './routes/auth.js';
import productRoutes     from './routes/products.js';
import orderRoutes       from './routes/orders.js';
import stripeRoutes, { stripeWebhook } from './routes/stripe.js';
import customOrderRoutes from './routes/customOrders.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Le webhook Stripe nécessite le body brut — doit être monté avant express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'rue25-api' }));

app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/stripe',        stripeRoutes);
app.use('/api/custom-orders', customOrderRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Rue 25 API — http://localhost:${PORT}`));
