import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import * as api from '../lib/api.js';

const STATUS_STYLES = {
  nouveau:    { bg: 'bg-yellow-50', text: 'text-yellow-800',  label: 'Nouveau' },
  'en cours': { bg: 'bg-blue-50',   text: 'text-blue-800',    label: 'En cours' },
  livré:      { bg: 'bg-green-50',  text: 'text-green-800',   label: 'Livré' },
  annulé:     { bg: 'bg-red-50',    text: 'text-red-800',     label: 'Annulé' },
};

const CATEGORIES = ['Chemises', 'Robes', 'Vestes', 'Pantalons', 'Pulls', 'Jupes'];

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
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        <span className={`absolute top-2.5 right-2.5 text-[10px] px-2.5 py-0.5 uppercase tracking-widest ${product.in_stock ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {product.in_stock ? 'En stock' : 'Épuisé'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium">{product.name}</span>
          <span className="text-sm text-accent font-medium">{Number(product.price).toFixed(2)} €</span>
        </div>
        <p className="text-xs text-muted mb-4">{product.category}</p>
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
  const blank = { name: '', description: '', price: '', category: 'Chemises', image_url: '', in_stock: true, sizes: [], materials: [] };
  const [form, setForm]       = useState(product ? { ...product, price: product.price?.toString() } : blank);
  const [matInput, setMatInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function addTag(field, val, clear) { if (val.trim()) { set(field, [...(form[field] || []), val.trim()]); clear(''); } }
  function removeTag(field, i) { set(field, form[field].filter((_, idx) => idx !== i)); }

  async function save() {
    if (!form.name || !form.price) { setError('Nom et prix requis'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({ ...form, price: parseFloat(form.price) });
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Nom *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chemise Lin" className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Prix (€) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="89" className="w-full px-4 py-2.5" />
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

          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">URL de l'image</label>
            <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              placeholder="https://images.unsplash.com/…" className="w-full px-4 py-2.5" />
            {form.image_url && (
              <img src={form.image_url} alt="aperçu" className="mt-2 h-24 object-cover border border-stone"
                onError={e => e.target.style.display = 'none'} />
            )}
          </div>

          {[['Tailles', 'sizes', sizeInput, setSizeInput, 'S, M, L, 38…'], ['Matériaux', 'materials', matInput, setMatInput, 'Lin 100%…']].map(([label, field, val, setVal, ph]) => (
            <div key={field}>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">{label}</label>
              <div className="flex gap-2 mb-2">
                <input value={val} onChange={e => setVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field, val, setVal))}
                  placeholder={ph} className="flex-1 px-4 py-2" />
                <button onClick={() => addTag(field, val, setVal)}
                  className="border border-stone text-xs px-4 text-muted hover:border-dark">Ajouter</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form[field] || []).map((item, i) => (
                  <span key={i} className="text-xs border border-stone px-3 py-1 flex items-center gap-1.5">
                    {item}
                    <button onClick={() => removeTag(field, i)} className="text-muted hover:text-dark leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}

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
