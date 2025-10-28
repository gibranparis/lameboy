// src/context/CartContext.jsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [count, setCount] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);

  /** Increment cart count */
  const add = (qty = 1) => {
    setCount((c) => c + qty);
    setBumpKey((k) => k + 1);

    // Emit bump (so CartButton animates)
    try { window.dispatchEvent(new CustomEvent('cart:bump')); } catch {}
  };

  /** Reset cart count to zero */
  const reset = () => {
    setCount(0);
    setBumpKey((k) => k + 1);
  };

  /**
   * Listen for external events:
   * window.dispatchEvent(new CustomEvent('cart:add', { detail: { qty } }))
   */
  useEffect(() => {
    const onAdd = (e) => {
      const qty = Number(e?.detail?.qty ?? 1) || 1;
      add(qty);
    };

    window.addEventListener('cart:add', onAdd);
    document.addEventListener('cart:add', onAdd);
    return () => {
      window.removeEventListener('cart:add', onAdd);
      document.removeEventListener('cart:add', onAdd);
    };
  }, []);

  const value = useMemo(() => ({ count, add, reset, bumpKey }), [count, bumpKey]);

  return (
    <CartCtx.Provider value={value}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CCart);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
