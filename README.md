# Rue 25 — Vêtements Artisanaux

Site e-commerce pour une marque de vêtements artisanaux français, avec boutique, panier, commandes, paiement Stripe, espace client, service sur mesure et dashboard admin.

**Stack :** React 18 + Vite + Tailwind CSS · Node.js + Express · PostgreSQL · Prisma ORM · Docker · Stripe

---

## Démarrage rapide (Docker)

```bash
cp .env.example .env
# → Éditez JWT_SECRET, STRIPE_SECRET_KEY et optionnellement les variables SMTP

docker compose up --build -d

# Première fois : migrations + données de démo
docker compose exec backend sh -c "npx prisma migrate deploy && node prisma/seed.js"
```

Ouvrez **http://localhost:5173**

---

## Installation manuelle (sans Docker)

### Prérequis

- Node.js 20+
- PostgreSQL (ou Docker pour la base uniquement)

### 1. Base de données

```bash
docker run -d \
  --name rue25-db \
  -e POSTGRES_USER=rue25 \
  -e POSTGRES_PASSWORD=rue25 \
  -e POSTGRES_DB=rue25 \
  -p 5433:5432 \
  postgres:17-alpine
```

### 2. Backend

```bash
# À la racine du projet
cp .env.example .env
# → Éditez DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY

npm install
npx prisma migrate deploy
node prisma/seed.js
npm run dev          # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Comptes par défaut (après seed)

| Rôle  | Email            | Mot de passe |
|-------|------------------|--------------|
| Admin | admin@rue25.fr   | admin25      |

---

## Variables d'environnement

Copiez `.env.example` en `.env` et remplissez les valeurs.

| Variable               | Requis | Description |
|------------------------|--------|-------------|
| `DATABASE_URL`         | ✓      | URL PostgreSQL |
| `JWT_SECRET`           | ✓      | Clé secrète JWT (min 32 caractères) |
| `JWT_EXPIRES_IN`       |        | Durée de validité du token (défaut : `7d`) |
| `ADMIN_EMAIL`          |        | Email admin créé au seed (défaut : `admin@rue25.fr`) |
| `ADMIN_PASSWORD`       |        | Mot de passe admin créé au seed (défaut : `admin25`) |
| `PORT`                 |        | Port du serveur (défaut : `3001`) |
| `CLIENT_URL`           |        | URL du frontend pour CORS et redirections Stripe |
| `STRIPE_SECRET_KEY`    | ✓      | Clé secrète Stripe (`sk_test_…` ou `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET`|        | Secret webhook Stripe (`whsec_…`) |
| `SMTP_HOST`            |        | Serveur SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT`            |        | Port SMTP (défaut : `587`) |
| `SMTP_USER`            |        | Adresse email d'envoi |
| `SMTP_PASS`            |        | Mot de passe ou clé d'application SMTP |
| `SMTP_FROM`            |        | Nom affiché (ex: `Rue 25 <contact@rue25.fr>`) |

> Les variables SMTP sont optionnelles : si absentes, les emails de confirmation sont simplement ignorés.

---

## Paiement Stripe (test)

Carte de test : `4242 4242 4242 4242` — date future — CVC quelconque

### Webhook en local

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
# Copiez le whsec_... affiché dans STRIPE_WEBHOOK_SECRET
```

---

## Routes API

### Authentification
| Méthode | Route                        | Auth     | Description |
|---------|------------------------------|----------|-------------|
| POST    | /api/auth/login              | —        | Connexion admin → JWT |
| POST    | /api/auth/register           | —        | Inscription client |
| POST    | /api/auth/customer/login     | —        | Connexion client |
| GET     | /api/auth/me                 | Client   | Profil connecté |
| GET     | /api/auth/my-orders          | Client   | Historique commandes |

> Les routes de connexion sont protégées par un rate limiter (10 tentatives / 15 min par IP).

### Produits
| Méthode | Route                     | Auth  | Description |
|---------|---------------------------|-------|-------------|
| GET     | /api/products             | —     | Liste (filtres : `category`, `search`) |
| GET     | /api/products/categories  | —     | Liste des catégories |
| GET     | /api/products/:id         | —     | Détail produit |
| POST    | /api/products             | Admin | Créer un produit |
| PUT     | /api/products/:id         | Admin | Modifier un produit |
| DELETE  | /api/products/:id         | Admin | Supprimer un produit |

### Commandes
| Méthode | Route                     | Auth    | Description |
|---------|---------------------------|---------|-------------|
| POST    | /api/orders               | —       | Passer une commande (email de confirmation envoyé) |
| GET     | /api/orders               | Admin   | Liste commandes |
| GET     | /api/orders/stats         | Admin   | Stats dashboard |
| PATCH   | /api/orders/:id/status    | Admin   | Changer le statut |

### Stripe
| Méthode | Route                        | Auth | Description |
|---------|------------------------------|------|-------------|
| POST    | /api/stripe/checkout         | —    | Créer session Checkout |
| GET     | /api/stripe/verify/:id       | —    | Vérifier paiement & créer commande (fallback) |
| POST    | /api/stripe/webhook          | —    | Webhook signé (création commande + email) |

### Sur Mesure
| Méthode | Route                          | Auth    | Description |
|---------|--------------------------------|---------|-------------|
| POST    | /api/custom-orders             | —       | Soumettre une demande (email de confirmation envoyé) |
| GET     | /api/custom-orders             | Admin   | Lister les demandes |
| GET     | /api/custom-orders/:id         | Admin   | Détail demande |
| PATCH   | /api/custom-orders/:id/status  | Admin   | Changer le statut |

---

## Structure du projet

```
Stage 4 - MVP/
├── docker-compose.yml
├── Dockerfile                 # Backend
├── .env.example
├── prisma/
│   ├── schema.prisma          # Modèles (User, Product, Order, CustomOrder, Address)
│   ├── migrations/
│   └── seed.js                # Données initiales (catégories, produits, admin)
├── src/
│   ├── index.js               # Point d'entrée Express
│   ├── lib/
│   │   ├── prisma.js          # Client Prisma singleton
│   │   ├── mailer.js          # Emails transactionnels (Nodemailer)
│   │   └── utils.js           # generateRef, orderToJSON
│   ├── middleware/
│   │   └── auth.js            # requireAuth / requireCustomer / optionalAuth
│   └── routes/
│       ├── auth.js            # Connexion admin + client (rate limited)
│       ├── products.js
│       ├── orders.js
│       ├── stripe.js          # Checkout + webhook signé
│       └── customOrders.js
└── frontend/
    ├── Dockerfile             # Build Vite → nginx
    ├── nginx.conf             # SPA + proxy /api → backend
    └── src/
        ├── lib/api.js         # Tous les appels HTTP
        ├── hooks/
        │   ├── useAuth.jsx         # Auth admin
        │   ├── useCustomerAuth.jsx  # Auth client
        │   └── useCart.jsx          # Panier (persisté en localStorage)
        ├── pages/
        │   ├── Storefront.jsx
        │   ├── SurMesurePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── AccountPage.jsx
        │   ├── OrderSuccess.jsx
        │   ├── AdminLogin.jsx
        │   └── AdminDashboard.jsx
        └── components/
            ├── ProductModal.jsx
            └── CartDrawer.jsx
```
