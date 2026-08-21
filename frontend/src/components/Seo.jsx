import { useEffect } from 'react';

export const SITE_URL  = 'https://rue25.fr';
export const SITE_NAME = 'Rue 25';
const DEFAULT_IMAGE = `${SITE_URL}/images/hero.jpg`;

/**
 * Renseigne le titre et les métadonnées de la page courante.
 *
 * L'application est une SPA : un seul index.html sert toutes les routes. Sans
 * ce composant, chaque page hériterait du titre et de la description de
 * l'accueil — Google indexerait alors toutes les URL sous le même libellé.
 *
 * Limite assumée : les robots des réseaux sociaux (WhatsApp, Facebook,
 * LinkedIn) n'exécutent pas le JavaScript et ne verront donc pas ce qui est
 * écrit ici. C'est le rôle du script `scripts/generate-seo.mjs`, qui écrit à la
 * compilation un index.html par page avec les mêmes balises en dur.
 */
export default function Seo({ title, description, path = '/', image, type = 'website', jsonLd }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Vêtements artisanaux faits à la main`;
  const url       = `${SITE_URL}${path}`;
  const img       = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', img);

    setCanonical(url);
    setJsonLd(jsonLd);
  }, [fullTitle, description, url, type, img, jsonLd]);

  return null;
}

function setMeta(attr, key, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

// Données structurées schema.org : ce qui permet à Google d'afficher le prix et
// la disponibilité directement dans ses résultats.
function setJsonLd(data) {
  const existing = document.getElementById('seo-jsonld');
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing || Object.assign(document.createElement('script'), {
    type: 'application/ld+json',
    id: 'seo-jsonld',
  });
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}
