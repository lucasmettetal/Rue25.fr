import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="fade-up w-[380px] text-center">
        <div className="flex items-baseline gap-2 justify-center mb-1.5">
          <span className="font-serif text-2xl">Rue</span>
          <span className="font-serif text-[28px] italic text-accent">25</span>
        </div>
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase mb-12">Espace Administration</p>

        <form onSubmit={handleSubmit} className="bg-white border border-stone p-10">
          <p className="text-[12px] tracking-[0.15em] uppercase text-muted mb-6">Connexion</p>
          <div className="flex flex-col gap-3 mb-5">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" autoComplete="email" className="w-full px-4 py-2.5" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe" className={`w-full px-4 py-2.5 ${error ? 'border-red-400' : ''}`} />
          </div>
          {error && <p className="text-xs text-red-600 mb-4 text-left">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-dark text-white text-xs tracking-widest uppercase py-3 disabled:opacity-50">
            {loading ? '…' : 'Accéder →'}
          </button>
        </form>

        <a href="/" className="block mt-5 text-xs text-muted hover:text-dark">← Retour à la boutique</a>
      </div>
    </div>
  );
}
