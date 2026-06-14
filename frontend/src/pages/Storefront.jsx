import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../lib/api.js';
import { useCart } from '../hooks/useCart.jsx';
import { useCustomerAuth } from '../hooks/useCustomerAuth.jsx';
import ProductModal from '../components/ProductModal.jsx';
import CartDrawer from '../components/CartDrawer.jsx';

// ── Images de la page d'accueil — remplace les chemins ici ─────────────────
const IMG_HERO    = '/images/hero.jpg';
const IMG_ATELIER = '/images/atelier.jpg';
// ────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Tous', 'Chemises', 'Robes', 'Vestes', 'Pantalons', 'Pulls', 'Jupes'];

const BANNER_ITEMS = [
  '✦  Livraison offerte dès 150 €',
  '✦  Pièces confectionnées à la main',
  '✦  Matières naturelles & éthiques',
  '✦  Retours gratuits sous 30 jours',
];

export default function Storefront() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('Tous');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [cartOpen, setCartOpen]     = useState(false);
  const { count }  = useCart();
  const { user }   = useCustomerAuth();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'Tous') params.category = category;
      if (search) params.search = search;
      setProducts(await getProducts(params));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchProducts, search]);

  return (
    <div className="min-h-screen bg-cream">

      {/* Banner */}
      <div className="bg-dark text-white overflow-hidden h-9 flex items-center">
        <div className="flex banner-scroll whitespace-nowrap">
          {[...BANNER_ITEMS, ...BANNER_ITEMS].map((item, i) => (
            <span key={i} className="text-[11px] tracking-widest-xl uppercase px-10 text-white/80">{item}</span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </div>
          <nav className="hidden md:flex gap-8">
            {['Boutique', 'Notre Histoire', 'Contact'].map(n => (
              <a key={n} href="#" className="text-[12px] tracking-[0.12em] text-muted uppercase hover:text-dark transition-colors">{n}</a>
            ))}
            <Link to="/sur-mesure" className="text-[12px] tracking-[0.12em] text-muted uppercase hover:text-dark transition-colors">
              Sur Mesure
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setCartOpen(true)} className="flex items-center gap-2 text-dark">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {count > 0 && <span className="text-[11px] bg-accent text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">{count}</span>}
            </button>
            {user ? (
              <Link to="/mon-compte" className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
                {user.firstName || 'Mon compte'}
              </Link>
            ) : (
              <Link to="/connexion" className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
                Connexion
              </Link>
            )}
            <Link to="/admin" className="hidden md:inline-flex text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[78vh] overflow-hidden flex items-end">
        <img
          src={IMG_HERO}
          alt="Atelier couture fait main"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,24,21,0.82)] via-[rgba(26,24,21,0.18)] to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-10 pb-10 md:pb-16 w-full fade-up">
          <p className="text-[11px] tracking-[0.35em] uppercase text-accent mb-4">Collection Printemps — Été 2026</p>
          <h1 className="font-serif text-[42px] md:text-[68px] text-white leading-[1.08] max-w-xl mb-6 font-normal">
            Vêtements<br /><em>faits à la main</em>
          </h1>
          <p className="text-[14px] md:text-[15px] text-white/70 max-w-md leading-relaxed mb-9">
            Chaque pièce est unique, façonnée avec soin dans notre atelier. Des matières naturelles, un savoir-faire authentique.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#catalogue" className="bg-dark text-white text-[12px] tracking-[0.08em] uppercase px-7 py-3">Découvrir la collection</a>
            <Link to="/sur-mesure" className="text-[12px] tracking-[0.08em] uppercase px-7 py-3 bg-white/15 border border-white/40 text-white backdrop-blur-sm">Sur mesure →</Link>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="max-w-7xl mx-auto px-4 md:px-10 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`text-[11px] tracking-[0.1em] uppercase px-5 py-2 border transition-all ${
                  category === c ? 'bg-dark text-white border-dark' : 'border-stone text-muted hover:border-dark'
                }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un vêtement…"
              className="w-full pl-9 pr-4 py-2.5 text-[13px]" />
          </div>
        </div>

        <p className="text-[12px] text-muted mb-8">{products.length} article{products.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-stone mb-4" />
                <div className="h-4 bg-stone w-3/4 mb-2" />
                <div className="h-3 bg-stone w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <div className="font-serif text-3xl mb-2">Aucun résultat</div>
            <div className="text-sm">Essayez une autre catégorie.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onSelect={setSelected} />)}
          </div>
        )}
      </section>

      {/* About */}
      <section className="bg-white border-y border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-16 md:py-20 grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div className="aspect-[4/5] overflow-hidden">
            <img src={IMG_ATELIER}
              alt="Atelier couture" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.3em] text-accent uppercase mb-4">Notre atelier</p>
            <h3 className="font-serif text-[44px] font-normal leading-[1.2] mb-6">Rue 25,<br /><em>depuis 2019</em></h3>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Installés au 25 de la rue des Artisans, nous confectionnons chaque vêtement à la main. Nos techniques viennent du compagnonnage, nos matières de fournisseurs éthiques.
            </p>
            <p className="text-sm text-muted leading-relaxed mb-10">
              Pas de série, pas de machine. Chaque pièce porte la marque du geste et du temps qui l'a créée.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-stone">
              {[['100%', 'Fait main'], ['15h+', 'Par pièce'], ['2019', 'Fondation']].map(([v, l]) => (
                <div key={l}>
                  <div className="font-serif text-[28px] text-accent">{v}</div>
                  <div className="text-[11px] text-muted tracking-[0.1em] uppercase mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white px-4 md:px-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-xl">Rue</span>
                <span className="font-serif text-2xl italic text-accent">25</span>
              </div>
              <p className="text-xs text-white/45 leading-relaxed max-w-[200px]">Vêtements artisanaux façonnés avec passion et authenticité.</p>
            </div>
            {[['BOUTIQUE', ['Collections', 'Nouveautés', 'Sur mesure']], ['INFOS', ['À propos', 'Livraison', 'Retours']]].map(([title, links]) => (
              <div key={title}>
                <p className="text-[10px] tracking-[0.25em] text-white/30 mb-4">{title}</p>
                {links.map(l => <a key={l} href="#" className="block text-xs text-white/55 mb-2.5 hover:text-white transition-colors">{l}</a>)}
              </div>
            ))}
            <div>
              <p className="text-[10px] tracking-[0.25em] text-white/30 mb-4">NEWSLETTER</p>
              <div className="flex">
                <input placeholder="votre@email.fr" className="flex-1 bg-white/10 border border-white/15 text-white text-xs border-r-0 text-sm" />
                <button className="bg-accent px-4 text-white text-base flex-shrink-0">→</button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex justify-between text-[11px] text-white/30">
            <span>© 2026 Rue 25. Tous droits réservés.</span>
            <span>25 rue des Artisans, Montauban</span>
          </div>
        </div>
      </footer>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function ProductCard({ product, index, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="fade-up cursor-pointer" style={{ animationDelay: `${index * 55}ms` }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(product)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-stone mb-4">
        <img src={product.image_url} alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${hovered ? 'scale-105' : 'scale-100'}`} />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-cream/75 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[10px] tracking-[0.25em] uppercase border border-stone px-5 py-2 text-muted">Épuisé</span>
          </div>
        )}
        {hovered && product.in_stock && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark text-white text-[11px] tracking-[0.12em] uppercase px-7 py-2.5 whitespace-nowrap">
            Voir le produit
          </div>
        )}
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium">{product.name}</span>
        <span className="text-sm text-muted">{Number(product.price).toFixed(2)} €</span>
      </div>
      <div className="text-xs text-muted mt-1">{product.category}</div>
    </div>
  );
}
