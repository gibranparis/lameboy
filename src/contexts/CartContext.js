'use client';

import { createContext, useContext, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [count, setCount] = useState(0);
  const [bumpKey, setBumpKey] = useState(0); // to trigger bump animation

  const add = (qty = 1) => {
    setCount((c) => c + qty);
    setBumpKey((k) => k + 1);
  };

  const value = useMemo(() => ({ count, add, bumpKey }), [count, bumpKey]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
