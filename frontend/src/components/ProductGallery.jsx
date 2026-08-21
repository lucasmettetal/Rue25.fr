import { useState, useEffect } from 'react';
import { assetUrl } from '../lib/api.js';
import ProductImage from './ProductImage.jsx';

/**
 * Galerie d'une fiche produit : un visuel en grand, les autres en vignettes.
 *
 * La vidéo, quand il y en a une, occupe une vignette comme les photos. Elle
 * n'est jamais affichée d'entrée : c'est un fichier lourd, on ne le charge que
 * si le visiteur le demande (`preload="none"`).
 */
export default function ProductGallery({ images = [], video, alt }) {
  const [actif, setActif] = useState(0);

  // Changer de produit remet la galerie sur le premier visuel.
  useEffect(() => setActif(0), [images, video]);

  const vues = [
    ...images.map((url, i) => ({ type: 'image', url, cle: `img-${i}` })),
    ...(video ? [{ type: 'video', url: video, cle: 'video' }] : []),
  ];

  // Aucun média : le repli de ProductImage tient déjà le rôle.
  if (vues.length === 0) {
    return <ProductImage src={null} alt={alt} className="w-full aspect-[3/4]" />;
  }

  const vue = vues[Math.min(actif, vues.length - 1)];

  return (
    <div>
      {vue.type === 'video' ? (
        <video
          src={assetUrl(vue.url)}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="w-full aspect-[3/4] bg-dark object-cover"
        />
      ) : (
        <ProductImage src={vue.url} alt={alt} loading="eager" className="w-full aspect-[3/4] bg-stone" />
      )}

      {vues.length > 1 && (
        <div className="grid grid-cols-6 gap-2 mt-2">
          {vues.map((v, i) => (
            <button
              key={v.cle}
              type="button"
              onClick={() => setActif(i)}
              aria-label={v.type === 'video' ? 'Voir la vidéo' : `Voir le visuel ${i + 1}`}
              aria-current={i === actif}
              className={`relative border transition-colors ${
                i === actif ? 'border-dark' : 'border-transparent hover:border-stone'
              }`}>
              {v.type === 'video' ? (
                <span className="w-full aspect-square bg-dark text-white flex items-center justify-center text-[11px]">
                  ▶
                </span>
              ) : (
                <ProductImage src={v.url} alt="" className="w-full aspect-square" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
