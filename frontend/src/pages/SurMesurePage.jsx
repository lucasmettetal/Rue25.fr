import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitCustomOrder } from '../lib/api.js';

const GARMENT_TYPES = ['Chemise', 'Robe', 'Veste', 'Manteau', 'Pantalon', 'Jupe', 'Pull', 'Autre'];
const BUDGETS = ['Moins de 200 €', '200 – 400 €', '400 – 700 €', '700 – 1 000 €', 'Plus de 1 000 €'];
const TIMELINES = ['1 mois', '2 – 3 mois', '3 – 6 mois', 'Pas de contrainte'];

const BLANK = {
  name: '', email: '', phone: '',
  garment_type: '', description: '',
  chest: '', waist: '', hips: '', height: '', inseam: '',
  materials: '', budget: '', timeline: '', notes: '',
};

export default function SurMesurePage() {
  const [form, setForm]       = useState(BLANK);
  const [step, setStep]       = useState('form'); // form | success
  const [reference, setRef]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.garment_type || !form.description) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await submitCustomOrder(form);
      setRef(data.reference);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] font-normal tracking-[0.08em]">Rue</span>
            <span className="font-serif text-[30px] italic text-accent">25</span>
          </Link>
          <Link to="/" className="text-[11px] tracking-[0.15em] uppercase text-muted hover:text-dark transition-colors">
            ← Boutique
          </Link>
        </div>
      </header>

      {step === 'success' ? (
        <SuccessView reference={reference} />
      ) : (
        <>
          {/* Hero */}
          <section className="max-w-4xl mx-auto px-4 md:px-10 pt-10 md:pt-16 pb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-4">Service exclusif</p>
            <h1 className="font-serif text-[36px] md:text-[52px] font-normal leading-[1.1] mb-6">
              Votre vêtement,<br /><em>sur mesure</em>
            </h1>
            <p className="text-[15px] text-muted leading-relaxed max-w-xl mb-3">
              Chaque pièce sur mesure est conçue en étroite collaboration avec vous. Nous prenons en compte votre morphologie, vos goûts et vos envies pour créer un vêtement unique.
            </p>
            <div className="flex gap-10 pt-8 border-t border-stone mt-8">
              {[['3–6 mois', 'Délai de création'], ['100%', 'Fait main'], ['Unique', 'Pièce exclusive']].map(([v, l]) => (
                <div key={l}>
                  <div className="font-serif text-2xl text-accent">{v}</div>
                  <div className="text-[11px] text-muted tracking-widest uppercase mt-1">{l}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Formulaire */}
          <section className="max-w-4xl mx-auto px-4 md:px-10 pb-20">
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-12 gap-y-10">

              {/* Bloc 1 — Coordonnées */}
              <div className="md:col-span-2">
                <SectionTitle num="01" label="Vos coordonnées" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Nom complet *" value={form.name} onChange={set('name')} placeholder="Marie Dupont" />
                  <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="marie@email.fr" />
                  <Field label="Téléphone" value={form.phone} onChange={set('phone')} placeholder="+33 6 00 00 00 00" />
                </div>
              </div>

              {/* Bloc 2 — Le projet */}
              <div className="md:col-span-2">
                <SectionTitle num="02" label="Votre projet" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Type de vêtement *</label>
                    <select value={form.garment_type} onChange={set('garment_type')}
                      className="w-full px-4 py-2.5 bg-white border border-stone">
                      <option value="">Choisir…</option>
                      {GARMENT_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <Field label="Matières souhaitées" value={form.materials} onChange={set('materials')} placeholder="Lin, coton bio, soie…" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Description du projet *</label>
                  <textarea value={form.description} onChange={set('description')} rows={5}
                    placeholder="Décrivez votre vêtement idéal : coupe, style, couleur, occasion, inspirations…"
                    className="w-full px-4 py-2.5 resize-y" />
                </div>
              </div>

              {/* Bloc 3 — Mensurations */}
              <div>
                <SectionTitle num="03" label="Vos mensurations" sub="En centimètres" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tour de poitrine" value={form.chest}  onChange={set('chest')}  placeholder="90 cm" />
                  <Field label="Tour de taille"   value={form.waist}  onChange={set('waist')}  placeholder="70 cm" />
                  <Field label="Tour de hanches"  value={form.hips}   onChange={set('hips')}   placeholder="96 cm" />
                  <Field label="Taille"           value={form.height} onChange={set('height')} placeholder="165 cm" />
                  <Field label="Entrejambe"       value={form.inseam} onChange={set('inseam')} placeholder="75 cm" />
                </div>
                <p className="text-[11px] text-muted mt-3 leading-relaxed">
                  Pas d'inquiétude si vous n'avez pas toutes les mesures. Nous organiserons une séance de prise de mesures à l'atelier.
                </p>
              </div>

              {/* Bloc 4 — Budget & délai */}
              <div>
                <SectionTitle num="04" label="Budget & délai" />
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Budget indicatif</label>
                    <select value={form.budget} onChange={set('budget')}
                      className="w-full px-4 py-2.5 bg-white border border-stone">
                      <option value="">Choisir…</option>
                      {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Délai souhaité</label>
                    <select value={form.timeline} onChange={set('timeline')}
                      className="w-full px-4 py-2.5 bg-white border border-stone">
                      <option value="">Choisir…</option>
                      {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">Notes complémentaires</label>
                    <textarea value={form.notes} onChange={set('notes')} rows={4}
                      placeholder="Toute information utile : événement, date précise, questions…"
                      className="w-full px-4 py-2.5 resize-y" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="md:col-span-2 border-t border-stone pt-8">
                {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted max-w-sm leading-relaxed">
                    Nous vous répondrons sous 48h avec une estimation et les prochaines étapes.
                  </p>
                  <button type="submit" disabled={loading}
                    className="bg-dark text-white text-[12px] tracking-widest uppercase px-10 py-4 disabled:opacity-50 hover:bg-dark/90 transition-colors">
                    {loading ? '…' : 'Envoyer ma demande →'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({ num, label, sub }) {
  return (
    <div className="flex items-baseline gap-3 mb-5 pb-3 border-b border-stone">
      <span className="font-serif text-[13px] text-accent">{num}</span>
      <span className="font-serif text-xl font-normal">{label}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-muted block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-2.5" />
    </div>
  );
}

function SuccessView({ reference }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center fade-up">
      <div className="text-5xl mb-6">✓</div>
      <h2 className="font-serif text-3xl mb-2">Demande envoyée !</h2>
      <p className="text-muted text-sm mb-1">Nous avons bien reçu votre demande sur mesure.</p>
      <p className="text-accent font-mono text-sm font-medium tracking-widest mb-3">{reference}</p>
      <p className="text-muted text-sm mb-10 max-w-sm">
        Notre équipe vous contactera sous 48h pour discuter de votre projet et vous envoyer un devis personnalisé.
      </p>
      <Link to="/" className="bg-dark text-white text-[12px] tracking-widest uppercase px-10 py-3">
        Retour à la boutique
      </Link>
    </div>
  );
}
