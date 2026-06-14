import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer } from '../lib/api.js';
import { useCustomerAuth } from '../hooks/useCustomerAuth.jsx';

export default function RegisterPage() {
  const { saveSession } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await registerCustomer({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });
      saveSession(data.token, data.user);
      navigate('/mon-compte');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-[26px]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted mt-1">Créer un compte</p>
        </div>

        <div className="bg-white border border-stone p-10">
          <p className="text-[12px] tracking-[0.15em] uppercase text-muted mb-7 text-center">Inscription</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Prénom</label>
                <input value={form.firstName} onChange={set('firstName')} className="w-full px-4 py-2.5" placeholder="Marie" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Nom</label>
                <input value={form.lastName} onChange={set('lastName')} className="w-full px-4 py-2.5" placeholder="Dupont" />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full px-4 py-2.5" placeholder="votre@email.fr" required />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Mot de passe * (8 car. min.)</label>
              <input type="password" value={form.password} onChange={set('password')}
                className="w-full px-4 py-2.5" placeholder="••••••••" required minLength={8} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Confirmer *</label>
              <input type="password" value={form.confirm} onChange={set('confirm')}
                className="w-full px-4 py-2.5" placeholder="••••••••" required />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-dark text-white text-[12px] tracking-widest uppercase py-3 disabled:opacity-50 mt-2">
              {loading ? '…' : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-center text-sm text-muted mt-7">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-accent hover:underline">Se connecter</Link>
          </p>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-xs text-muted hover:text-dark">← Retour à la boutique</Link>
        </p>
      </div>
    </div>
  );
}
