import { useState, useEffect } from 'react';

/**
 * Image de produit avec repli propre.
 *
 * Les visuels produits sont des URLs externes (Unsplash) ou uploadées : elles
 * peuvent disparaître ou être mal saisies. Plutôt que l'icône « image cassée »
 * du navigateur, on affiche un aplat discret aux couleurs de la marque.
 */
export default function ProductImage({ src, alt, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false);

  // Une nouvelle URL mérite une nouvelle tentative (ex. après édition en admin).
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`bg-stone flex items-center justify-center ${className}`}>
        <span className="text-[10px] uppercase tracking-widest text-muted">Photo à venir</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
