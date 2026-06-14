import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../lib/api.js';
import { useCart } from '../hooks/useCart.jsx';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) { setError('Session invalide'); return; }
    verifyPayment(sessionId)
      .then(data => { setOrder(data.order); clear(); })
      .catch(e => setError(e.message));
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <Link to="/" className="flex items-baseline gap-2 mb-12">
        <span className="font-serif text-[26px]">Rue</span>
        <span className="font-serif text-[30px] italic text-accent">25</span>
      </Link>

      {error ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-sm text-accent hover:underline">← Retour à la boutique</Link>
        </div>
      ) : !order ? (
        <p className="text-muted text-sm animate-pulse">Vérification du paiement…</p>
      ) : (
        <div className="w-full max-w-md text-center fade-up">
          <div className="text-5xl mb-6 text-green-600">✓</div>
          <h1 className="font-serif text-3xl mb-2">Merci pour votre commande !</h1>
          <p className="text-sm text-muted mb-1">Votre commande a bien été enregistrée.</p>
          <p className="text-accent font-mono text-sm font-medium tracking-widest mb-8">{order.reference}</p>

          <div className="bg-white border border-stone p-6 text-left mb-8">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-2.5 border-b border-stone last:border-0">
                <span className="text-dark">
                  {item.name}
                  {item.size ? <span className="text-muted"> — {item.size}</span> : ''}
                  {' '}× {item.quantity}
                </span>
                <span className="text-muted">{Number(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between font-serif text-xl mt-5 pt-4 border-t border-stone">
              <span>Total payé</span>
              <span>{Number(order.total).toFixed(2)} €</span>
            </div>
          </div>

          <Link to="/" className="bg-dark text-white text-[12px] tracking-widest uppercase px-10 py-3 inline-block hover:bg-dark/90 transition-colors">
            Continuer mes achats
          </Link>
        </div>
      )}
    </div>
  );
}
