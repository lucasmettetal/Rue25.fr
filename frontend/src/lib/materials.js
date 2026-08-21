/**
 * Tailles et composition : les règles métier, au même endroit pour l'admin
 * (saisie) et la fiche produit (affichage).
 *
 * La composition d'un vêtement n'est pas du texte libre. Le règlement (UE)
 * n° 1007/2011 impose, pour tout textile vendu dans l'Union :
 *   - des dénominations de fibres normalisées (annexe I) ;
 *   - le pourcentage en masse de chaque fibre ;
 *   - un classement par ordre décroissant.
 * Les parties non textiles (boutons, doublure, fermeture) n'entrent pas dans
 * ce calcul : elles sont indiquées à part.
 *
 * Le champ `materials` reste un simple tableau de chaînes en base — aucune
 * migration nécessaire. Ce module traduit dans les deux sens entre ce tableau
 * et la saisie structurée : « 80 % lin » ↔ { percent: 80, fibre: 'lin' }.
 */

// Dénominations officielles les plus courantes pour un atelier de confection.
// La liste n'est pas exhaustive : l'admin peut saisir une fibre absente.
export const FIBRES = [
  'coton', 'lin', 'laine', 'laine mérinos', 'soie', 'cachemire', 'alpaga', 'mohair',
  'chanvre', 'ramie', 'jute',
  'viscose', 'lyocell', 'modal', 'cupro', 'acétate',
  'polyester', 'polyamide', 'acrylique', 'élasthanne',
];

// Éléments non textiles : ils ne comptent pas dans les 100 %.
export const DETAILS_SUGGERES = [
  'Boutons en nacre',
  'Boutons en corozo',
  'Doublure en cupro',
  'Fermeture éclair laiton',
  'Teinture végétale',
  'Coutures à la main',
];

// Barèmes de tailles. En France les deux cohabitent selon la pièce, et
// certaines créations n'ont pas de taille du tout.
export const SIZE_SCALES = {
  lettres: { label: 'Lettres', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  numerique: { label: 'Numérique (FR)', sizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50'] },
  unique: { label: 'Taille unique', sizes: ['Taille unique'] },
};

const ALL_SIZES = Object.values(SIZE_SCALES).flatMap(s => s.sizes);

/** Devine le barème d'un produit existant, pour rouvrir le formulaire au bon onglet. */
export function detectScale(sizes = []) {
  for (const [key, { sizes: known }] of Object.entries(SIZE_SCALES)) {
    if (sizes.some(s => known.includes(s))) return key;
  }
  return 'lettres';
}

/** Remet les tailles dans l'ordre du barème, quel que soit l'ordre de saisie. */
export function sortSizes(sizes = []) {
  return [...sizes].sort((a, b) => {
    const ia = ALL_SIZES.indexOf(a);
    const ib = ALL_SIZES.indexOf(b);
    // Les tailles hors barème (« 42 long », « 3 ans ») passent à la fin.
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
}

const PERCENT = /(\d+(?:[.,]\d+)?)\s*%/;

/**
 * Sépare un tableau `materials` en composition chiffrée et détails non textiles.
 * Accepte les deux écritures rencontrées en base : « 80 % lin » et « Lin 80% ».
 */
export function parseMaterials(list = []) {
  const composition = [];
  const details = [];

  for (const raw of list) {
    const value = String(raw ?? '').trim();
    if (!value) continue;

    const match = value.match(PERCENT);
    const percent = match ? Number(match[1].replace(',', '.')) : NaN;
    const fibre = match ? value.replace(match[0], '').replace(/[-–—:,]/g, ' ').trim() : '';

    if (!fibre || !Number.isFinite(percent)) {
      details.push(value);
      continue;
    }
    composition.push({ percent, fibre });
  }

  return { composition: sortComposition(composition), details };
}

/** Ordre décroissant : exigé par le règlement, pas seulement esthétique. */
export function sortComposition(composition = []) {
  return [...composition].sort((a, b) => b.percent - a.percent);
}

export function totalPercent(composition = []) {
  return composition.reduce((sum, c) => sum + (Number(c.percent) || 0), 0);
}

function formatPercent(value) {
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

export function formatFibre({ percent, fibre }) {
  return `${formatPercent(percent)} % ${canonicalFibre(fibre)}`;
}

// Une fibre connue s'écrit toujours pareil, quelle que soit la casse tapée en
// admin (« Lin », « LIN » → « lin »). Une fibre absente de la liste est
// laissée telle quelle : on ne déforme pas ce qu'on ne connaît pas.
function canonicalFibre(fibre) {
  const value = String(fibre).trim();
  return FIBRES.find(f => f.toLowerCase() === value.toLowerCase()) || value;
}

/** Reconstruit le tableau stocké en base à partir de la saisie structurée. */
export function toMaterialsList(composition = [], details = []) {
  return [
    ...sortComposition(composition.filter(c => c.fibre?.trim() && Number(c.percent) > 0)).map(formatFibre),
    ...details.map(d => String(d).trim()).filter(Boolean),
  ];
}
