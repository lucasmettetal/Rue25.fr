import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCustomer } from '../lib/api.js';
import { useCustomerAuth } from '../hooks/useCustomerAuth.jsx';

export default function LoginPage() {
  const { saveSession } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginCustomer(form.email, form.password);
      saveSession(data.token, data.user);
      navigate('/mon-compte');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-[26px]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted mt-1">Mon Compte</p>
        </div>

        <div className="bg-white border border-stone p-10">
          <p className="text-[12px] tracking-[0.15em] uppercase text-muted mb-7 text-center">Connexion</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5" placeholder="votre@email.fr" required />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Mot de passe</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5" placeholder="••••••••" required />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-dark text-white text-[12px] tracking-widest uppercase py-3 disabled:opacity-50 mt-2">
              {loading ? '…' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-sm text-muted mt-7">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-accent hover:underline">Créer un compte</Link>
          </p>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-xs text-muted hover:text-dark">← Retour à la boutique</Link>
        </p>
      </div>
    </div>
  );
}
