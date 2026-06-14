import { useState } from 'react';
import { useCart } from '../hooks/useCart.jsx';
import { useCustomerAuth } from '../hooks/useCustomerAuth.jsx';
import { placeOrder, createCheckout } from '../lib/api.js';

const BLANK = { firstName: '', lastName: '', email: '', address: '', city: '', postalCode: '' };

export default function CartDrawer({ onClose }) {
  const { cart, remove, change, total, count, clear } = useCart();
  const { user } = useCustomerAuth();

  const [step, setStep]       = useState('cart');  // cart | form | success
  const [form, setForm]       = useState({
    ...BLANK,
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [orderRef, setOrderRef] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const items = cart.map(i => ({ product_id: i.id, size: i.size, quantity: i.qty }));
  const customerName = `${form.firstName} ${form.lastName}`.trim() || form.email;

  // ── Commande directe (sans paiement) ─────────────────────────────────────
  async function handleDirectOrder() {
    setLoading(true);
    setError('');
    try {
      const data = await placeOrder({ customer_name: customerName, email: form.email, items });
      setOrderRef(data.reference);
      clear();
      setStep('success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Paiement Stripe ───────────────────────────────────────────────────────
  async function handleStripePayment() {
    setLoading(true);
    setError('');
    try {
      const shipping = [form.address, form.postalCode, form.city].filter(Boolean).join(', ');
      const data = await createCheckout({ items, customer_name: customerName, email: form.email, shipping });
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  const formValid = form.firstName && form.lastName && form.email;

  return (
    <div className="fixed inset-0 z-50">
      <div onClick={onClose} className="absolute inset-0 bg-dark/50" />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white flex flex-col slide-right">

        {/* Header */}
        <div className="px-7 py-5 border-b border-stone flex justify-between items-center flex-shrink-0">
          <h2 className="font-serif text-xl">
            {step === 'success' ? 'Commande confirmée' : step === 'form' ? 'Finaliser' : 'Mon Panier'}
            {step === 'cart' && count > 0 && <span className="text-sm font-sans text-muted ml-2">({count})</span>}
          </h2>
          <button onClick={onClose} className="text-xl text-muted hover:text-dark leading-none">×</button>
        </div>

        {/* ── Succès ── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
            <div className="text-4xl mb-4 text-green-600">✓</div>
            <p className="font-serif text-2xl mb-2">Merci !</p>
            <p className="text-sm text-muted mb-1">Commande enregistrée.</p>
            <p className="text-xs text-accent font-medium tracking-widest mb-8">{orderRef}</p>
            <button onClick={onClose} className="bg-dark text-white text-xs tracking-widest uppercase px-8 py-3">Fermer</button>
          </div>
        )}

        {/* ── Panier ── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-7 py-5">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted">
                  <p className="font-serif text-xl mb-2">Panier vide</p>
                  <p className="text-sm">Ajoutez des vêtements pour commencer.</p>
                </div>
              ) : cart.map(item => (
                <div key={item.key} className="flex gap-4 mb-6 pb-6 border-b border-stone last:border-0 last:mb-0 last:pb-0">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-[70px] h-[90px] object-cover flex-shrink-0" />
                    : <div className="w-[70px] h-[90px] bg-stone flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-0.5">{item.name}</p>
                    {item.size && <p className="text-xs text-muted mb-1">Taille : {item.size}</p>}
                    <p className="text-xs text-muted mb-3">{Number(item.price).toFixed(2)} €</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => change(item.key, -1)} className="border border-stone w-7 h-7 flex items-center justify-center hover:border-dark">−</button>
                      <span className="text-sm w-5 text-center">{item.qty}</span>
                      <button onClick={() => change(item.key,  1)} className="border border-stone w-7 h-7 flex items-center justify-center hover:border-dark">+</button>
                      <button onClick={() => remove(item.key)} className="ml-auto text-[11px] text-muted uppercase tracking-widest hover:text-dark">Retirer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="px-7 py-5 border-t border-stone flex-shrink-0">
                <div className="flex justify-between mb-5">
                  <span className="text-sm text-muted">Total</span>
                  <span className="font-serif text-xl">{total.toFixed(2)} €</span>
                </div>
                <button onClick={() => setStep('form')} className="w-full bg-dark text-white text-xs tracking-widest uppercase py-3">
                  Commander
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Formulaire ── */}
        {step === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Prénom *</label>
                  <input value={form.firstName} onChange={set('firstName')} placeholder="Marie" className="w-full px-3 py-2" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Nom *</label>
                  <input value={form.lastName} onChange={set('lastName')} placeholder="Dupont" className="w-full px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="marie@email.fr" className="w-full px-3 py-2" />
              </div>

              <div className="border-t border-stone pt-4">
                <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Adresse de livraison</p>
                <div className="flex flex-col gap-3">
                  <input value={form.address} onChange={set('address')} placeholder="Adresse" className="w-full px-3 py-2" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.city} onChange={set('city')} placeholder="Ville" className="w-full px-3 py-2" />
                    <input value={form.postalCode} onChange={set('postalCode')} placeholder="Code postal" className="w-full px-3 py-2" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone pt-4 flex justify-between items-baseline">
                <span className="text-sm text-muted">Total</span>
                <span className="font-serif text-xl">{total.toFixed(2)} €</span>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="px-7 py-5 border-t border-stone flex-shrink-0 flex flex-col gap-2">
              <button onClick={handleStripePayment} disabled={loading || !formValid}
                className="w-full bg-accent text-white text-xs tracking-widest uppercase py-3 disabled:opacity-40">
                {loading ? '…' : '💳 Payer par carte'}
              </button>
              <button onClick={handleDirectOrder} disabled={loading || !formValid}
                className="w-full border border-stone text-muted text-xs tracking-widest uppercase py-3 hover:border-dark disabled:opacity-40">
                {loading ? '…' : 'Commander sans paiement'}
              </button>
              <button onClick={() => setStep('cart')} className="text-xs text-muted text-center pt-1 hover:text-dark">
                ← Retour au panier
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
