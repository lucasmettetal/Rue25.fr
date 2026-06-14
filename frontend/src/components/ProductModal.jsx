import { useState } from 'react';
import { useCart } from '../hooks/useCart.jsx';

export default function ProductModal({ product, onClose }) {
  const [selectedSize, setSelectedSize] = useState('');
  const { add } = useCart();

  function handleAdd() {
    add(product, selectedSize);
    onClose();
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-dark/60 z-50 flex items-center justify-center p-6">
      <div onClick={e => e.stopPropagation()}
        className="fade-up bg-white max-w-3xl w-full max-h-[90vh] overflow-auto grid md:grid-cols-2">
        <img src={product.image_url} alt={product.name} className="w-full aspect-[3/4] object-cover" />
        <div className="p-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-accent uppercase mb-2">{product.category}</p>
                <h2 className="font-serif text-3xl font-normal">{product.name}</h2>
              </div>
              <button onClick={onClose} className="text-xl text-muted hover:text-dark">×</button>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-6">{product.description}</p>

            {product.materials?.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] tracking-[0.1em] uppercase text-muted mb-2">Matériaux</p>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map(m => (
                    <span key={m} className="text-xs border border-stone px-3 py-1 text-muted">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div>
                <p className="text-[11px] tracking-[0.1em] uppercase text-muted mb-2">Taille</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 text-sm border transition-all ${
                        selectedSize === s ? 'bg-dark text-white border-dark' : 'border-stone hover:border-dark'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="text-[26px] font-light mb-5">{Number(product.price).toFixed(2)} €</p>
            <button
              onClick={handleAdd}
              disabled={!product.in_stock || (product.sizes?.length > 0 && !selectedSize)}
              className="w-full py-3 bg-dark text-white text-[12px] tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark/90 transition-colors">
              {product.in_stock ? 'Ajouter au panier' : 'Épuisé'}
            </button>
            {product.sizes?.length > 0 && !selectedSize && product.in_stock && (
              <p className="text-xs text-muted mt-2 text-center">Veuillez choisir une taille</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
