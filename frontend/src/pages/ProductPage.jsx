import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, assetUrl } from '../lib/api.js';
import { useCart } from '../hooks/useCart.jsx';
import ProductImage from '../components/ProductImage.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import Seo, { SITE_URL, SITE_NAME } from '../components/Seo.jsx';

/**
 * Fiche produit à son adresse propre : /produit/:slug
 *
 * Auparavant les produits n'existaient que dans une fenêtre modale ouverte
 * depuis l'accueil : aucune URL, donc rien d'indexable par Google ni de
 * partageable. Chaque pièce a désormais sa page, son titre, sa description et
 * ses données structurées.
 */
export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct]   = useState(null);
  const [status, setStatus]     = useState('loading'); // loading | ready | notfound | error
  const [size, setSize]         = useState('');
  const [added, setAdded]       = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { add, count } = useCart();

  // Recalculer à chaque rendu relancerait inutilement l'écriture des balises.
  const seo = useMemo(() => (product ? seoProps(product) : null), [product]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSize('');
    setAdded(false);
    getProduct(slug)
      .then(p => { if (!cancelled) { setProduct(p); setStatus('ready'); } })
      .catch(err => {
        if (cancelled) return;
        // Sans cela, passer d'une fiche valide à une fiche disparue laisserait
        // le titre et l'URL canonique de la précédente.
        setProduct(null);
        setStatus(/introuvable/i.test(err.message) ? 'notfound' : 'error');
      });
    return () => { cancelled = true; };
  }, [slug]);

  function handleAdd() {
    add(product, size);
    setAdded(true);
    setCartOpen(true);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {seo && <Seo {...seo} />}

      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/#catalogue" className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
              ← Boutique
            </Link>
            <button onClick={() => setCartOpen(true)} aria-label="Ouvrir le panier" className="flex items-center gap-2 text-dark">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {count > 0 && <span className="text-[11px] bg-accent text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-10 py-10 md:py-16">
        {status === 'loading' && <ProductSkeleton />}

        {status === 'notfound' && (
          <EmptyState
            title="Pièce introuvable"
            text="Cette pièce n'est plus disponible, ou son adresse a changé." />
        )}

        {status === 'error' && (
          <EmptyState
            title="Chargement impossible"
            text="La boutique est momentanément injoignable. Merci de réessayer dans un instant." />
        )}

        {status === 'ready' && product && (
          <>
            <nav aria-label="Fil d’Ariane" className="text-[11px] tracking-[0.1em] uppercase text-muted mb-8">
              <Link to="/" className="hover:text-dark transition-colors">Accueil</Link>
              <span className="mx-2 text-stone">/</span>
              <Link to="/#catalogue" className="hover:text-dark transition-colors">{product.category}</Link>
              <span className="mx-2 text-stone">/</span>
              <span className="text-dark">{product.name}</span>
            </nav>

            <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-start">
              <ProductImage
                src={product.image_url}
                alt={product.name}
                loading="eager"
                className="w-full aspect-[3/4] bg-stone" />

              <div>
                <p className="text-[10px] tracking-[0.25em] text-accent uppercase mb-3">{product.category}</p>
                <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight mb-4">{product.name}</h1>
                <p className="text-[26px] font-light mb-8">{Number(product.price).toFixed(2)} €</p>

                {product.description && (
                  <p className="text-sm text-muted leading-relaxed mb-8">{product.description}</p>
                )}

                {product.materials?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[11px] tracking-[0.1em] uppercase text-muted mb-3">Matières</p>
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map(m => (
                        <span key={m} className="text-xs border border-stone px-3 py-1 text-muted">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[11px] tracking-[0.1em] uppercase text-muted mb-3">Taille</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(s => (
                        <button key={s} onClick={() => setSize(s)}
                          aria-pressed={size === s}
                          className={`px-4 py-2 text-sm border transition-all ${
                            size === s ? 'bg-dark text-white border-dark' : 'border-stone hover:border-dark'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAdd}
                  disabled={!product.in_stock || (product.sizes?.length > 0 && !size)}
                  className="w-full py-3.5 bg-dark text-white text-[12px] tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark/90 transition-colors">
                  {product.in_stock ? (added ? 'Ajouté au panier ✓' : 'Ajouter au panier') : 'Épuisé'}
                </button>

                {product.sizes?.length > 0 && !size && product.in_stock && (
                  <p className="text-xs text-muted mt-2 text-center">Veuillez choisir une taille</p>
                )}

                <p className="text-xs text-muted leading-relaxed mt-8 pt-8 border-t border-stone">
                  Pièce confectionnée à la main dans notre atelier. Envie de la même
                  à vos mesures ? <Link to="/sur-mesure" className="text-dark underline underline-offset-4">Demandez du sur mesure</Link>.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-dark text-white px-4 md:px-10 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-3 text-[11px] text-white/30">
          <span>© 2026 {SITE_NAME}. Tous droits réservés.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link to="/mentions-legales" className="hover:text-white/60 transition-colors">Mentions légales</Link>
            <Link to="/politique-de-confidentialite" className="hover:text-white/60 transition-colors">Politique de confidentialité</Link>
            <Link to="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}

// Métadonnées + données structurées schema.org/Product : c'est ce qui permet à
// Google d'afficher le prix et la disponibilité sous le résultat de recherche.
function seoProps(p) {
  const image = p.image_url ? assetUrl(p.image_url) : undefined;
  const description = (p.description || `${p.name} — pièce artisanale confectionnée à la main par Rue 25.`)
    .slice(0, 155);

  return {
    title: p.name,
    description,
    path: `/produit/${p.slug}`,
    image,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description,
      image: image ? [image] : undefined,
      category: p.category || undefined,
      material: p.materials?.length ? p.materials.join(', ') : undefined,
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/produit/${p.slug}`,
        price: Number(p.price).toFixed(2),
        priceCurrency: 'EUR',
        availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  };
}

function ProductSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14 animate-pulse">
      <div className="aspect-[3/4] bg-stone" />
      <div className="space-y-4 pt-4">
        <div className="h-3 bg-stone w-24" />
        <div className="h-10 bg-stone w-3/4" />
        <div className="h-6 bg-stone w-28" />
        <div className="h-3 bg-stone w-full" />
        <div className="h-3 bg-stone w-5/6" />
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="text-center py-24">
      <p className="font-serif text-3xl mb-3">{title}</p>
      <p className="text-sm text-muted mb-8">{text}</p>
      <Link to="/#catalogue" className="inline-block bg-dark text-white text-[12px] tracking-[0.08em] uppercase px-7 py-3">
        Retour à la boutique
      </Link>
    </div>
  );
}
