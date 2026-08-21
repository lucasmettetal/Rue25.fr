import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import * as api from '../lib/api.js';
import ProductImage from '../components/ProductImage.jsx';
import {
  FIBRES, DETAILS_SUGGERES, SIZE_SCALES,
  detectScale, sortSizes, parseMaterials, totalPercent, toMaterialsList,
} from '../lib/materials.js';

const STATUS_STYLES = {
  nouveau:    { bg: 'bg-yellow-50', text: 'text-yellow-800',  label: 'Nouveau' },
  'en cours': { bg: 'bg-blue-50',   text: 'text-blue-800',    label: 'En cours' },
  livré:      { bg: 'bg-green-50',  text: 'text-green-800',   label: 'Livré' },
  annulé:     { bg: 'bg-red-50',    text: 'text-red-800',     label: 'Annulé' },
};

const CATEGORIES = ['Chemises', 'Robes', 'Vestes', 'Pantalons', 'Pulls', 'Jupes'];

// Doit rester aligné sur MAX_IMAGES côté API (src/routes/products.js).
const MAX_IMAGES = 5;

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  // Data
  const [stats, setStats]             = useState(null);
  const [orders, setOrders]           = useState([]);
  const [products, setProducts]       = useState([]);
  const [customOrders, setCustomOrders] = useState([]);

  // Product form
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    if (!admin) { navigate('/admin'); return; }
    loadAll();
  }, [admin]);

  async function loadAll() {
    const [s, o, p, c] = await Promise.all([
      api.getOrderStats().catch(() => null),
      api.getOrders().catch(() => []),
      api.getProducts().catch(() => []),
      api.getCustomOrders().catch(() => []),
    ]);
    setStats(s);
    setOrders(o);
    setProducts(p);
    setCustomOrders(c);
  }

  async function handleStatusChange(id, status) {
    await api.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggleStock(product) {
    const updated = await api.updateProduct(product.id, { ...product, in_stock: !product.in_stock });
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
  }

  async function handleCustomOrderStatus(id, status) {
    await api.updateCustomOrderStatus(id, status);
    setCustomOrders(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  const TABS = [
    { id: 'dashboard',     label: 'Tableau de bord', icon: '▦' },
    { id: 'orders',        label: 'Commandes',        icon: '⬡' },
    { id: 'products',      label: 'Produits',         icon: '◈' },
    { id: 'custom-orders', label: 'Sur Mesure',       icon: '✦' },
  ];

  return (
    <div className="min-h-screen flex bg-cream">

      {/* Sidebar */}
      <aside className="w-60 bg-dark text-white flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-8 border-b border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl">Rue</span>
            <span className="font-serif text-2xl italic text-accent">25</span>
          </div>
          <p className="text-[9px] tracking-[0.25em] text-white/30 uppercase mt-1">Administration</p>
        </div>

        <nav className="flex-1 p-3 pt-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 mb-1 rounded-md text-sm transition-all ${
                tab === t.id ? 'bg-white/12 text-white' : 'text-white/45 hover:text-white/70'
              }`}>
              <span className="opacity-60">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>

        <div className="px-6 pb-6">
          <p className="text-[10px] text-white/25 mb-3 truncate">{admin?.email}</p>
          <button onClick={() => { logout(); navigate('/admin'); }}
            className="w-full border border-white/12 text-white/35 text-xs uppercase tracking-widest py-2.5 hover:text-white/60">
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-10">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="fade-up">
            <h1 className="font-serif text-3xl font-normal mb-1">Tableau de bord</h1>
            <p className="text-sm text-muted mb-9">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="grid grid-cols-4 gap-5 mb-10">
              {[
                { label: "Chiffre d'affaires",  value: stats ? `${stats.revenue.toFixed(2)} €` : '—', sub: 'Commandes livrées' },
                { label: 'En attente',           value: stats?.pendingOrders ?? '—',                   sub: 'À traiter' },
                { label: 'Produits actifs',      value: products.filter(p => p.in_stock).length,        sub: 'En stock' },
                { label: 'Catalogue',            value: products.length,                                sub: 'Produits au total' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white border border-stone px-7 py-6">
                  <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{label}</p>
                  <p className="font-serif text-4xl font-normal mb-1">{value}</p>
                  <p className="text-[11px] text-muted">{sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-stone">
              <div className="px-7 py-4 border-b border-stone flex justify-between items-center">
                <span className="text-sm font-medium">Dernières commandes</span>
                <button onClick={() => setTab('orders')} className="text-xs text-accent">Voir tout →</button>
              </div>
              <OrderTable orders={orders.slice(0, 4)} onStatusChange={handleStatusChange} compact />
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="fade-up">
            <h1 className="font-serif text-3xl font-normal mb-1">Commandes</h1>
            <p className="text-sm text-muted mb-9">{orders.length} commandes au total</p>
            <div className="bg-white border border-stone">
              <OrderTable orders={orders} onStatusChange={handleStatusChange} />
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div className="fade-up">
            <div className="flex justify-between items-end mb-9">
              <div>
                <h1 className="font-serif text-3xl font-normal mb-1">Produits</h1>
                <p className="text-sm text-muted">{products.length} produits dans le catalogue</p>
              </div>
              <button onClick={() => { setEditTarget(null); setShowForm(true); }}
                className="bg-dark text-white text-xs tracking-widest uppercase px-7 py-3">
                + Ajouter un produit
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <AdminProductCard key={p.id} product={p}
                  onEdit={() => { setEditTarget(p); setShowForm(true); }}
                  onToggleStock={() => handleToggleStock(p)}
                  onDelete={() => handleDeleteProduct(p.id)} />
              ))}
            </div>
          </div>
        )}

        {/* SUR MESURE */}
        {tab === 'custom-orders' && (
          <div className="fade-up">
            <h1 className="font-serif text-3xl font-normal mb-1">Sur Mesure</h1>
            <p className="text-sm text-muted mb-9">{customOrders.length} demande{customOrders.length !== 1 ? 's' : ''}</p>
            <div className="bg-white border border-stone">
              {customOrders.length === 0 ? (
                <div className="text-center py-16 text-muted">
                  <p className="font-serif text-xl">Aucune demande pour l'instant</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-cream">
                      {['Référence', 'Date', 'Client', 'Vêtement', 'Budget', 'Statut'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest uppercase text-muted font-medium border-b border-stone">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customOrders.map((c, i) => (
                      <tr key={c.id} className={i < customOrders.length - 1 ? 'border-b border-stone' : ''}>
                        <td className="px-5 py-4 text-xs font-mono text-accent font-medium">{c.reference}</td>
                        <td className="px-5 py-4 text-xs text-muted">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted">{c.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm">{c.garment_type}</td>
                        <td className="px-5 py-4 text-xs text-muted">{c.budget || '—'}</td>
                        <td className="px-5 py-4">
                          <select value={c.status}
                            onChange={e => handleCustomOrderStatus(c.id, e.target.value)}
                            className="text-xs py-1 px-2 bg-cream border border-stone cursor-pointer">
                            {['nouveau','en étude','devis envoyé','accepté','en création','terminé','annulé'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <ProductForm
          product={editTarget}
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            if (editTarget) {
              const updated = await api.updateProduct(editTarget.id, data);
              setProducts(prev => prev.map(p => p.id === editTarget.id ? updated : p));
            } else {
              const created = await api.createProduct(data);
              setProducts(prev => [created, ...prev]);
            }
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function OrderTable({ orders, onStatusChange, compact }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-cream">
          {['Référence', 'Date', 'Client', 'Articles', 'Total', 'Statut'].map(h => (
            <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest uppercase text-muted font-medium border-b border-stone">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((o, i) => (
          <tr key={o.id} className={i < orders.length - 1 ? 'border-b border-stone' : ''}>
            <td className="px-5 py-4 text-xs font-mono text-accent font-medium">{o.reference}</td>
            <td className="px-5 py-4 text-xs text-muted">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
            <td className="px-5 py-4">
              <p className="text-sm font-medium">{o.customer_name}</p>
              {!compact && <p className="text-xs text-muted">{o.email}</p>}
            </td>
            <td className="px-5 py-4 text-xs text-muted max-w-[200px] truncate">
              {o.items?.map(i => i.name).join(', ')}
            </td>
            <td className="px-5 py-4 text-sm font-medium">{Number(o.total).toFixed(2)} €</td>
            <td className="px-5 py-4">
              <select value={o.status} onChange={e => onStatusChange(o.id, e.target.value)}
                className="text-xs py-1 px-2 bg-cream border border-stone w-auto cursor-pointer">
                {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdminProductCard({ product, onEdit, onToggleStock, onDelete }) {
  return (
    <div className="bg-white border border-stone">
      <div className="relative aspect-[3/4] overflow-hidden">
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full" />
        <span className={`absolute top-2.5 right-2.5 text-[10px] px-2.5 py-0.5 uppercase tracking-widest ${product.in_stock ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {product.in_stock ? 'En stock' : 'Épuisé'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium">{product.name}</span>
          <span className="text-sm text-accent font-medium">{Number(product.price).toFixed(2)} €</span>
        </div>
        <p className="text-xs text-muted mb-2">{product.category}</p>
        <p className="text-xs text-muted mb-4">Quantité disponible : {product.quantity ?? 0}</p>
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 border border-stone text-xs uppercase tracking-widest py-2 text-muted hover:border-dark">Modifier</button>
          <button onClick={onToggleStock} className="flex-1 border border-stone text-xs uppercase tracking-widest py-2 text-muted hover:border-dark">
            {product.in_stock ? 'Désactiver' : 'Activer'}
          </button>
          <button onClick={onDelete} className="bg-red-600 text-white text-xs px-3 py-2 hover:bg-red-700">✕</button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ product, onClose, onSave }) {
  const blank = { name: '', description: '', price: '', category: 'Chemises', image_url: '', video_url: '', in_stock: true, quantity: 0, sizes: [], materials: [] };
  const [form, setForm]       = useState(product ? { ...product, price: product.price?.toString(), quantity: product.quantity ?? 0 } : blank);

  // La composition est saisie ligne par ligne (pourcentage + fibre) puis
  // reconstruite en tableau de chaînes à l'enregistrement — voir lib/materials.js.
  const [composition, setComposition] = useState(() => parseMaterials(product?.materials).composition);
  const [details, setDetails]         = useState(() => parseMaterials(product?.materials).details);
  const [detailInput, setDetailInput] = useState('');
  const [scale, setScale]             = useState(() => detectScale(product?.sizes));
  const [extraSize, setExtraSize]     = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageUrlInput, setImageUrlInput]   = useState('');
  const fileRef  = useRef(null);
  const videoRef = useRef(null);

  // Les produits antérieurs à la galerie n'ont qu'un `image_url` : il devient
  // le premier visuel.
  const [images, setImages] = useState(() =>
    product?.images?.length ? [...product.images] : (product?.image_url ? [product.image_url] : []));

  const sizes = form.sizes || [];
  const scaleSizes = SIZE_SCALES[scale].sizes;
  // Tailles saisies à la main, hors de tout barème (« 42 long », « 3 ans »).
  const horsBareme = sizes.filter(s => !Object.values(SIZE_SCALES).some(sc => sc.sizes.includes(s)));
  const total = totalPercent(composition);
  const compositionIncomplete = composition.length > 0 && Math.round(total) !== 100;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleSize(size) {
    set('sizes', sortSizes(sizes.includes(size) ? sizes.filter(s => s !== size) : [...sizes, size]));
  }

  function addExtraSize() {
    const value = extraSize.trim();
    if (value && !sizes.includes(value)) set('sizes', sortSizes([...sizes, value]));
    setExtraSize('');
  }

  function addDetail() {
    const value = detailInput.trim();
    if (value && !details.includes(value)) setDetails(d => [...d, value]);
    setDetailInput('');
  }

  function addImage(url) {
    const value = String(url).trim();
    if (!value) return;
    setImages(list => (list.includes(value) || list.length >= MAX_IMAGES ? list : [...list, value]));
  }

  function addImageUrl() {
    addImage(imageUrlInput);
    setImageUrlInput('');
  }

  function removeImage(i) {
    setImages(list => list.filter((_, idx) => idx !== i));
  }

  // Réordonner sert à choisir la principale : c'est toujours la première.
  function moveImage(i, delta) {
    setImages(list => {
      const next = [...list];
      const j = i + delta;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleImageFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';               // permet de re-choisir le même fichier
    if (!files.length) return;

    const place = MAX_IMAGES - images.length;
    if (place <= 0) return;
    if (files.length > place) {
      setError(`Seuls les ${place} premiers fichiers ont été retenus (${MAX_IMAGES} visuels maximum).`);
    } else {
      setError('');
    }

    setUploading(true);
    try {
      for (const file of files.slice(0, place)) {
        addImage(await api.uploadImage(file));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    setError('');
    try {
      set('video_url', await api.uploadVideo(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingVideo(false);
    }
  }

  async function save() {
    if (!form.name || !form.price || form.quantity === '') { setError('Nom, prix et quantité requis'); return; }
    if (Number(form.quantity) < 0) { setError('Quantité invalide'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({
        ...form,
        price: parseFloat(form.price),
        quantity: Number(form.quantity),
        sizes: sortSizes(sizes),
        materials: toMaterialsList(composition, details),
        images,
        video_url: form.video_url || null,
      });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-dark/65 z-50 flex items-center justify-center p-6">
      <div onClick={e => e.stopPropagation()} className="fade-up bg-white w-[560px] max-h-[90vh] overflow-auto border border-stone">
        <div className="px-8 py-6 border-b border-stone flex justify-between items-center">
          <h2 className="font-serif text-xl">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          <button onClick={onClose} className="text-xl text-muted hover:text-dark">×</button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Nom *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chemise Lin" className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Prix (€) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="89" className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Quantité *</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="10" className="w-full px-4 py-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Catégorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-4 py-2.5">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Description du vêtement…" className="w-full px-4 py-2.5 resize-y" />
          </div>

          {/* Médias : jusqu'à 5 photos (la première sert de visuel principal
              partout : catalogue, panier, aperçu de partage) et une vidéo. */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-2">
              Photos <span className="normal-case tracking-normal">({images.length}/{MAX_IMAGES})</span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {images.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative border border-stone">
                    <ProductImage src={url} alt={`Visuel ${i + 1}`} className="w-full aspect-square" />

                    {i === 0 && (
                      <span className="absolute top-0 left-0 bg-dark text-white text-[8px] uppercase tracking-widest px-1.5 py-0.5">
                        Principale
                      </span>
                    )}

                    <button type="button" onClick={() => removeImage(i)}
                      aria-label={`Retirer le visuel ${i + 1}`}
                      className="absolute top-0 right-0 bg-white/90 text-muted hover:text-dark w-5 h-5 leading-none text-sm">
                      ×
                    </button>

                    <div className="flex border-t border-stone">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                        aria-label={`Déplacer le visuel ${i + 1} vers la gauche`}
                        className="flex-1 text-xs text-muted hover:text-dark disabled:opacity-25 py-0.5">‹</button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}
                        aria-label={`Déplacer le visuel ${i + 1} vers la droite`}
                        className="flex-1 text-xs text-muted hover:text-dark disabled:opacity-25 py-0.5 border-l border-stone">›</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                disabled={images.length >= MAX_IMAGES}
                placeholder={images.length >= MAX_IMAGES ? 'Maximum atteint' : 'Coller une adresse https://…'}
                className="flex-1 px-4 py-2 text-sm disabled:opacity-50" />
              <button type="button" onClick={addImageUrl} disabled={images.length >= MAX_IMAGES}
                className="border border-stone text-xs px-4 text-muted hover:border-dark disabled:opacity-50">Ajouter</button>
              <button type="button" onClick={() => fileRef.current?.click()}
                disabled={uploading || images.length >= MAX_IMAGES}
                className="border border-stone text-xs px-4 text-muted hover:border-dark whitespace-nowrap disabled:opacity-50">
                {uploading ? 'Envoi…' : 'Choisir des fichiers'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageFiles} />
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              JPEG, PNG, WebP ou AVIF — 5 Mo par photo. La première est celle qui s’affiche dans le catalogue.
            </p>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-2">Vidéo</label>

            {form.video_url ? (
              <div className="flex gap-3 items-start">
                <video src={api.assetUrl(form.video_url)} controls preload="metadata"
                  className="w-48 aspect-video bg-stone border border-stone object-cover" />
                <button type="button" onClick={() => set('video_url', '')}
                  className="border border-stone text-xs px-4 py-2 text-muted hover:border-dark">Retirer</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => videoRef.current?.click()} disabled={uploadingVideo}
                  className="border border-stone text-xs px-4 py-2 text-muted hover:border-dark disabled:opacity-50">
                  {uploadingVideo ? 'Envoi…' : 'Choisir une vidéo'}
                </button>
                <input ref={videoRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoFile} />
              </div>
            )}
            <p className="text-[11px] text-muted mt-1.5">
              MP4 ou WebM — 30 Mo maximum, une seule vidéo par pièce.
            </p>
          </div>

          {/* Tailles : on coche dans un barème plutôt que de retaper « S, M, L »
              à chaque produit — moins de fautes et un ordre toujours cohérent. */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-2">Tailles disponibles</label>

            <div className="flex gap-1 mb-3">
              {Object.entries(SIZE_SCALES).map(([key, { label }]) => (
                <button key={key} type="button" onClick={() => setScale(key)}
                  className={`text-[11px] px-3 py-1.5 border transition-colors ${
                    scale === key ? 'bg-dark text-white border-dark' : 'border-stone text-muted hover:border-dark'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {scaleSizes.map(size => {
                const checked = sizes.includes(size);
                return (
                  <label key={size}
                    className={`text-xs px-3.5 py-2 border cursor-pointer select-none transition-colors ${
                      checked ? 'bg-dark text-white border-dark' : 'border-stone text-muted hover:border-dark'
                    }`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleSize(size)} className="sr-only" />
                    {size}
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 mt-3">
              <input value={extraSize} onChange={e => setExtraSize(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExtraSize())}
                placeholder="Taille hors barème : 42 long, 3 ans…" className="flex-1 px-4 py-2 text-sm" />
              <button type="button" onClick={addExtraSize}
                className="border border-stone text-xs px-4 text-muted hover:border-dark">Ajouter</button>
            </div>

            {horsBareme.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {horsBareme.map(size => (
                  <span key={size} className="text-xs border border-stone px-3 py-1 flex items-center gap-1.5">
                    {size}
                    <button type="button" onClick={() => toggleSize(size)} className="text-muted hover:text-dark leading-none">×</button>
                  </span>
                ))}
              </div>
            )}

            {sizes.length === 0 && (
              <p className="text-[11px] text-muted mt-2">Aucune taille : la pièce sera vendue sans choix de taille.</p>
            )}
          </div>

          {/* Composition : le règlement (UE) 1007/2011 impose le pourcentage de
              chaque fibre, par ordre décroissant. Le tri est donc automatique. */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-2">Composition</label>

            <datalist id="fibres-textiles">
              {FIBRES.map(f => <option key={f} value={f} />)}
            </datalist>

            <div className="flex flex-col gap-2">
              {composition.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="number" min="0" max="100" value={row.percent}
                    onChange={e => setComposition(c => c.map((r, idx) => idx === i ? { ...r, percent: e.target.value } : r))}
                    placeholder="80" className="w-20 px-3 py-2 text-sm" />
                  <span className="text-muted text-sm">%</span>
                  <input list="fibres-textiles" value={row.fibre}
                    onChange={e => setComposition(c => c.map((r, idx) => idx === i ? { ...r, fibre: e.target.value } : r))}
                    placeholder="lin" className="flex-1 px-4 py-2 text-sm" />
                  <button type="button" onClick={() => setComposition(c => c.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-dark px-2 leading-none" aria-label="Retirer cette fibre">×</button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <button type="button" onClick={() => setComposition(c => [...c, { percent: '', fibre: '' }])}
                className="border border-stone text-xs px-4 py-2 text-muted hover:border-dark">+ Ajouter une fibre</button>
              {composition.length > 0 && (
                <span className={`text-xs ${compositionIncomplete ? 'text-amber-700' : 'text-green-700'}`}>
                  Total : {Math.round(total * 10) / 10} %
                </span>
              )}
            </div>

            {compositionIncomplete && (
              <p className="text-[11px] text-amber-700 mt-1.5">
                Le total devrait atteindre 100 % : c’est ce qu’impose l’étiquetage textile européen.
              </p>
            )}
          </div>

          {/* Tout ce qui n'est pas une fibre : boutons, doublure, finitions.
              Ces éléments ne comptent pas dans les 100 % de la composition. */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Détails & finitions</label>

            <datalist id="details-produit">
              {DETAILS_SUGGERES.map(d => <option key={d} value={d} />)}
            </datalist>

            <div className="flex gap-2 mb-2">
              <input list="details-produit" value={detailInput} onChange={e => setDetailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDetail())}
                placeholder="Boutons en nacre…" className="flex-1 px-4 py-2 text-sm" />
              <button type="button" onClick={addDetail}
                className="border border-stone text-xs px-4 text-muted hover:border-dark">Ajouter</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {details.map((item, i) => (
                <span key={i} className="text-xs border border-stone px-3 py-1 flex items-center gap-1.5">
                  {item}
                  <button type="button" onClick={() => setDetails(d => d.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-dark leading-none">×</button>
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)}
              className="w-4 h-4 accent-accent" />
            <span className="text-sm">En stock</span>
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-8 pb-7 flex gap-3 justify-end">
          <button onClick={onClose} className="border border-stone text-muted text-xs uppercase tracking-widest px-6 py-2.5 hover:border-dark">Annuler</button>
          <button onClick={save} disabled={loading} className="bg-accent text-white text-xs uppercase tracking-widest px-6 py-2.5 disabled:opacity-50">
            {loading ? '…' : product ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </div>
      </div>
    </div>
  );
}
