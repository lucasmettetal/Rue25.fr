import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../hooks/useCustomerAuth.jsx';
import { getMyOrders } from '../lib/api.js';

const STATUS = {
  nouveau:    { label: 'Nouveau',   cls: 'bg-yellow-50 text-yellow-800' },
  'en cours': { label: 'En cours',  cls: 'bg-blue-50 text-blue-800'   },
  livré:      { label: 'Livré',     cls: 'bg-green-50 text-green-800'  },
  annulé:     { label: 'Annulé',    cls: 'bg-red-50 text-red-800'      },
};

export default function AccountPage() {
  const { user, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-stone sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm text-muted">{user?.firstName || user?.email}</span>
            <button onClick={() => { logout(); navigate('/'); }}
              className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-10 py-14">
        <h1 className="font-serif text-3xl font-normal mb-1">Mon Compte</h1>
        <p className="text-sm text-muted mb-12">{user?.email}</p>

        <h2 className="font-serif text-xl mb-6">Mes commandes</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-white border border-stone animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone">
            <p className="font-serif text-xl mb-2 text-muted">Aucune commande</p>
            <p className="text-sm text-muted mb-8">Vous n'avez pas encore passé de commande.</p>
            <Link to="/" className="bg-dark text-white text-[12px] tracking-widest uppercase px-8 py-3">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const s = STATUS[order.status] || { label: order.status, cls: 'bg-stone text-muted' };
              return (
                <div key={order.id} className="bg-white border border-stone p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-mono text-accent font-medium tracking-widest">{order.reference}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-3 py-1 ${s.cls}`}>{s.label}</span>
                      <span className="font-serif text-lg">{Number(order.total).toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="border-t border-stone pt-3 flex flex-wrap gap-2">
                    {order.items.map(item => (
                      <span key={item.id} className="text-xs text-muted border border-stone px-3 py-1">
                        {item.name}{item.size ? ` — ${item.size}` : ''} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
