/**
 * Génère, après `vite build`, ce qu'une application monopage ne peut pas
 * produire seule :
 *
 *   1. dist/sitemap.xml       — la liste des URL à faire indexer par Google.
 *   2. dist/<route>/index.html — une copie de l'index avec les balises <title>,
 *      description et Open Graph déjà écrites en dur.
 *
 * Pourquoi le point 2 : les robots des réseaux sociaux (WhatsApp, Facebook,
 * LinkedIn, Discord) n'exécutent pas le JavaScript. Sans ces copies, partager
 * le lien d'une pièce afficherait toujours le titre et l'image de l'accueil.
 * Le composant <Seo> reste utile côté navigateur ; ici on écrit la même chose
 * à l'avance, à la compilation.
 *
 * Les fiches produits sont figées au moment du build : après avoir ajouté ou
 * modifié un produit dans l'admin, il faut redéployer le front pour que les
 * aperçus de partage et le sitemap soient à jour. Le contenu affiché à
 * l'utilisateur, lui, reste toujours chargé en direct depuis l'API.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const SITE = 'https://rue25.fr';
const API =
  process.env.SEO_API_URL ||
  process.env.VITE_API_URL ||
  'https://rue25fr-production.up.railway.app/api';

// Pages fixes. Les espaces privés (compte, admin, tunnel de commande) sont
// volontairement absents : ils n'ont rien à faire dans un moteur de recherche.
const STATIC_PAGES = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'weekly',
    // L'accueil garde les balises déjà présentes dans index.html.
    skipHtml: true,
  },
  {
    path: '/sur-mesure',
    priority: '0.8',
    changefreq: 'monthly',
    title: 'Sur mesure — Rue 25',
    description:
      "Faites confectionner un vêtement unique à vos mesures dans l'atelier Rue 25 : choix des matières, de la coupe et des finitions.",
  },
  {
    path: '/contact',
    priority: '0.6',
    changefreq: 'yearly',
    title: 'Contact — Rue 25',
    description:
      "Une question sur une pièce ou un projet sur mesure ? Écrivez à l'atelier Rue 25, nous répondons sous 48 heures.",
  },
  {
    path: '/mentions-legales',
    priority: '0.2',
    changefreq: 'yearly',
    title: 'Mentions légales — Rue 25',
    description:
      "Mentions légales du site rue25.fr : éditeur, directeur de publication, hébergeur et conditions d'utilisation.",
  },
  {
    path: '/politique-de-confidentialite',
    priority: '0.2',
    changefreq: 'yearly',
    title: 'Politique de confidentialité — Rue 25',
    description:
      'Comment Rue 25 collecte, utilise et protège vos données personnelles, conformément au RGPD.',
  },
];

async function fetchProducts() {
  try {
    const res = await fetch(`${API}/products`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    return Array.isArray(products) ? products.filter(p => p.slug) : [];
  } catch (err) {
    // Un build ne doit jamais échouer parce que l'API dort : on continue avec
    // les seules pages fixes, en le disant clairement.
    console.warn(`[seo] API injoignable (${API}) : ${err.message}`);
    console.warn('[seo] sitemap et aperçus générés pour les pages fixes uniquement.');
    return null;
  }
}

// ── Sitemap ──────────────────────────────────────────────────────────────────

function buildSitemap(entries) {
  const urls = entries
    .map(
      ({ path, priority, changefreq, lastmod }) => `  <url>
    <loc>${SITE}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// ── Pré-écriture des balises dans une copie de l'index ───────────────────────

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function withMeta(html, { title, description, url, image, type = 'website', jsonLd }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);

  let out = html;
  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = replaceTag(out, /<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${d}" />`);
  out = replaceTag(out, /<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${t}" />`);
  out = replaceTag(out, /<meta property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${d}" />`);
  out = replaceTag(out, /<meta property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`);
  out = replaceTag(out, /<meta property="og:type"[\s\S]*?\/>/, `<meta property="og:type" content="${type}" />`);
  out = replaceTag(out, /<meta name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${t}" />`);
  out = replaceTag(out, /<meta name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${d}" />`);
  out = replaceTag(out, /<link rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`);

  if (image) {
    out = replaceTag(out, /<meta property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${escapeAttr(image)}" />`);
    out = replaceTag(out, /<meta name="twitter:image"[\s\S]*?\/>/, `<meta name="twitter:image" content="${escapeAttr(image)}" />`);
  }

  if (jsonLd) {
    // </script> à l'intérieur d'un <script> fermerait la balise trop tôt.
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    out = out.replace('</head>', `  <script type="application/ld+json">${json}</script>\n</head>`);
  }

  return out;
}

async function writePage(path, html) {
  const dir = join(DIST, ...path.split('/').filter(Boolean));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}

function productMeta(p) {
  const url = `${SITE}/produit/${p.slug}`;
  const description = (
    p.description || `${p.name} — pièce artisanale confectionnée à la main par Rue 25.`
  ).slice(0, 155);
  // Les visuels téléversés sont servis par l'API sous /uploads : un aperçu de
  // partage exige une URL absolue.
  const image = !p.image_url
    ? undefined
    : /^https?:\/\//.test(p.image_url)
      ? p.image_url
      : `${API.replace(/\/api\/?$/, '')}${p.image_url}`;

  return {
    title: `${p.name} — Rue 25`,
    description,
    url,
    image,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description,
      image: image ? [image] : undefined,
      category: p.category || undefined,
      brand: { '@type': 'Brand', name: 'Rue 25' },
      offers: {
        '@type': 'Offer',
        url,
        price: Number(p.price).toFixed(2),
        priceCurrency: 'EUR',
        availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  };
}

// ── Exécution ────────────────────────────────────────────────────────────────

const index = await readFile(join(DIST, 'index.html'), 'utf8');
const products = await fetchProducts();
const entries = [];

for (const page of STATIC_PAGES) {
  entries.push({
    path: page.path,
    priority: page.priority,
    changefreq: page.changefreq,
  });
  if (page.skipHtml) continue;
  await writePage(page.path, withMeta(index, { ...page, url: `${SITE}${page.path}` }));
}

for (const p of products ?? []) {
  const path = `/produit/${p.slug}`;
  entries.push({
    path,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: p.updated_at ? String(p.updated_at).slice(0, 10) : undefined,
  });
  await writePage(path, withMeta(index, productMeta(p)));
}

await writeFile(join(DIST, 'sitemap.xml'), buildSitemap(entries), 'utf8');

const n = products?.length ?? 0;
console.log(
  `[seo] sitemap.xml : ${entries.length} URL ` +
    `(${STATIC_PAGES.length} pages fixes, ${n} produit${n > 1 ? 's' : ''})`,
);
