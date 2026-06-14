import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'rue25_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  function add(product, size) {
    setCart(prev => {
      const key = `${product.id}-${size}`;
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, key, size, qty: 1 }];
    });
  }

  function remove(key) { setCart(prev => prev.filter(i => i.key !== key)); }

  function change(key, delta) {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }

  function clear() { setCart([]); }

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, add, remove, change, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
