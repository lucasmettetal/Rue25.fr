import { useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'rue25_cookies_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(!localStorage.getItem(STORAGE_KEY));

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'essential');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark text-white px-4 md:px-10 py-5 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
          Ce site utilise uniquement des cookies <strong className="text-white">strictement nécessaires</strong> à son fonctionnement (authentification, panier). Aucun cookie publicitaire ou de traçage n'est utilisé.{' '}
          <Link to="/politique-de-confidentialite" className="underline text-white/60 hover:text-white transition-colors">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={decline}
            className="text-[11px] tracking-widest uppercase border border-white/20 text-white/50 px-5 py-2 hover:border-white/40 hover:text-white/70 transition-colors">
            Essentiels uniquement
          </button>
          <button onClick={accept}
            className="text-[11px] tracking-widest uppercase bg-accent text-white px-5 py-2 hover:bg-accent/90 transition-colors">
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
