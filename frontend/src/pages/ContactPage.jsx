import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendContact } from '../lib/api.js';
import Seo from '../components/Seo.jsx';

const INFOS = [
  { icon: '◈', label: 'Adresse', lines: ['25 rue des Artisans', '82000 Montauban'] },
  { icon: '✦', label: 'Email', lines: ['contact@rue25.fr'] },
  { icon: '⬡', label: 'Horaires atelier', lines: ['Lun – Ven : 9h – 18h', 'Sam : 10h – 13h (sur RDV)'] },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('loading');
    setError('');
    try {
      await sendContact(form);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Seo
        title="Contact"
        description="Une question sur une pièce ou un projet sur mesure ? Écrivez à l'atelier Rue 25, nous répondons sous 48 heures."
        path="/contact" />


      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link to="/" className="text-[12px] tracking-[0.12em] text-muted uppercase hover:text-dark transition-colors">Boutique</Link>
            <Link to="/contact" className="text-[12px] tracking-[0.12em] text-dark uppercase">Contact</Link>
            <Link to="/sur-mesure" className="text-[12px] tracking-[0.12em] text-muted uppercase hover:text-dark transition-colors">Sur Mesure</Link>
          </nav>
          <Link to="/" className="text-[10px] tracking-[0.15em] uppercase border border-stone text-muted px-3 py-1.5 hover:border-dark transition-colors">
            ← Boutique
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-10 py-16 md:py-20 grid md:grid-cols-2 gap-16 md:gap-24">

        {/* Infos */}
        <div className="fade-up">
          <p className="text-[10px] tracking-[0.3em] text-accent uppercase mb-6">Nous contacter</p>
          <h1 className="font-serif text-[42px] md:text-[52px] font-normal leading-[1.1] mb-8">
            Parlons de<br /><em>votre projet</em>
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-12">
            Une question sur une pièce, un projet sur-mesure, ou simplement l'envie de visiter l'atelier — nous sommes disponibles et répondons sous 48h.
          </p>

          <div className="space-y-8">
            {INFOS.map(info => (
              <div key={info.label} className="flex gap-5">
                <span className="text-accent text-lg mt-0.5 flex-shrink-0">{info.icon}</span>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">{info.label}</p>
                  {info.lines.map(l => <p key={l} className="text-sm text-dark">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-10 border-t border-stone">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4">Projet sur-mesure ?</p>
            <p className="text-sm text-muted mb-4">Pour un vêtement fait à vos mesures, utilisez notre formulaire dédié — il nous permet de préparer votre devis.</p>
            <Link to="/sur-mesure" className="text-[12px] tracking-widest uppercase border border-stone px-6 py-2.5 text-muted hover:border-dark transition-colors inline-block">
              Demande sur-mesure →
            </Link>
          </div>
        </div>

        {/* Formulaire */}
        <div className="fade-up" style={{ animationDelay: '80ms' }}>
          {status === 'success' ? (
            <div className="bg-white border border-stone p-10 text-center h-full flex flex-col items-center justify-center">
              <div className="text-4xl text-green-600 mb-6">✓</div>
              <h2 className="font-serif text-2xl mb-3">Message envoyé</h2>
              <p className="text-sm text-muted mb-8">Nous vous répondrons dans les 48h.</p>
              <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                className="text-[11px] tracking-widest uppercase border border-stone px-6 py-2.5 text-muted hover:border-dark transition-colors">
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white border border-stone p-8 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Nom *</label>
                  <input id="contact-name" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Marie Dupont" required className="w-full px-4 py-2.5" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Email *</label>
                  <input id="contact-email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="marie@email.fr" required className="w-full px-4 py-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Sujet</label>
                <input id="contact-subject" value={form.subject} onChange={e => set('subject', e.target.value)}
                  placeholder="Question sur une pièce, visite atelier…" className="w-full px-4 py-2.5" />
              </div>

              <div>
                <label htmlFor="contact-message" className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Message *</label>
                <textarea id="contact-message" value={form.message} onChange={e => set('message', e.target.value)}
                  rows={6} placeholder="Votre message…" required className="w-full px-4 py-2.5 resize-y" />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button type="submit" disabled={status === 'loading'}
                className="bg-dark text-white text-[12px] tracking-widest uppercase py-3 disabled:opacity-50 mt-2">
                {status === 'loading' ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="bg-dark text-white px-4 md:px-10 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-3 text-[11px] text-white/30">
          <span>© 2026 Rue 25. Tous droits réservés.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link to="/mentions-legales" className="hover:text-white/60 transition-colors">Mentions légales</Link>
            <Link to="/politique-de-confidentialite" className="hover:text-white/60 transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
