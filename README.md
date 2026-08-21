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

## Variables d'environnement

Copiez `.env.example` en `.env` et remplissez les valeurs.

| Variable               | Requis | Description |
|------------------------|--------|-------------|
| `DATABASE_URL`         | ✓      | URL PostgreSQL |
| `JWT_SECRET`           | ✓      | Clé secrète JWT (min 32 caractères) |
| `JWT_EXPIRES_IN`       |        | Durée de validité du token (défaut : `7d`) |
| `ADMIN_EMAIL`          | ✓      | Email admin créé au seed — **choisir une adresse non devinable** |
| `ADMIN_PASSWORD`       | ✓      | Mot de passe admin (**≥ 16 car. aléatoires** — le seed échoue si absent) |
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
| GET     | /api/products/:idOrSlug   | —     | Détail produit (identifiant **ou** slug) |
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
    ├── public/
    │   ├── _headers           # Cache et en-têtes de sécurité (Cloudflare)
    │   └── robots.txt
    ├── scripts/
    │   └── generate-seo.mjs   # sitemap.xml + aperçus de partage (post-build)
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
        │   ├── ProductPage.jsx      # Fiche produit /produit/:slug
        │   ├── ContactPage.jsx
        │   ├── LegalPage.jsx        # Mentions légales
        │   ├── PrivacyPage.jsx      # Politique de confidentialité
        │   ├── AdminLogin.jsx
        │   └── AdminDashboard.jsx
        └── components/
            ├── ProductImage.jsx    # Image produit + repli « Photo à venir »
            ├── Seo.jsx             # Titre / description / Open Graph / données structurées
            ├── CookieBanner.jsx
            └── CartDrawer.jsx
```

---

## Référencement (SEO)

Chaque pièce a son adresse propre : `/produit/:slug`. Le composant `Seo`
renseigne titre, description, URL canonique, Open Graph et données structurées
`schema.org/Product` — c'est ce qui permet à Google d'afficher le prix et la
disponibilité sous le résultat.

Une application monopage a toutefois une limite : les robots des réseaux
sociaux n'exécutent pas le JavaScript. `npm run build` lance donc, après Vite,
le script `frontend/scripts/generate-seo.mjs` qui écrit :

- `dist/sitemap.xml` — pages fixes + une entrée par produit ;
- `dist/<route>/index.html` — une copie de l'index avec les balises déjà
  écrites en dur, pour que le partage d'un lien affiche le bon aperçu.

Le script interroge l'API pour récupérer les produits (`SEO_API_URL` ou
`VITE_API_URL`, sinon l'API de production). Si elle est injoignable, le build
continue avec les seules pages fixes.

> Les fiches produits sont figées à la compilation : après avoir ajouté ou
> modifié un produit dans l'admin, redéployez le front pour rafraîchir le
> sitemap et les aperçus de partage. Le contenu affiché aux visiteurs, lui,
> vient toujours de l'API en direct.
