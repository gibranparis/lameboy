// src/contexts/CartContext.js
'use client';

import React from 'react';
import swell from '@/lib/swell';

const initial = { cart: null, loading: true, updating: false, error: null };

const CartContext = React.createContext({
  ...initial,
  refresh: async () => {},
  addItem: async (_productId, _opts = {}) => {},
  setItemQty: async (_itemId, _qty) => {},
  removeItem: async (_itemId) => {},
  clear: async () => {},
  itemCount: 0,
  subtotal: 0,
  total: 0,
  currency: 'USD',
});

export function CartProvider({ children }) {
  const [state, setState] = React.useState(initial);
  const alive = React.useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  const load = React.useCallback(async () => {
    set({ loading: true, error: null });
    try {
      const cart = await swell.cart.get();
      if (alive.current) set({ cart, loading: false });
    } catch (err) {
      if (alive.current) set({ error: err?.message || 'Failed to load cart', loading: false });
    }
  }, []);

  React.useEffect(() => {
    (async () => { await load(); })();
    const onFocus = () => load();
    const onStorage = (e) => { if (e.key === 'cart:updated') load(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [load]);

  const broadcast = React.useCallback(() => {
    try { localStorage.setItem('cart:updated', String(Date.now())); } catch {}
  }, []);

  const addItem = React.useCallback(async (productId, opts = {}) => {
    set({ updating: true, error: null });
    try {
      await swell.cart.addItem({ productId, ...opts });
      const cart = await swell.cart.get();
      if (alive.current) set({ cart, updating: false });
      broadcast();
      return cart;
    } catch (err) {
      if (alive.current) set({ updating: false, error: err?.message || 'Failed to add item' });
      throw err;
    }
  }, [broadcast]);

  const setItemQty = React.useCallback(async (itemId, qty) => {
    set({ updating: true, error: null });
    try {
      const q = Math.max(0, Number(qty) || 0);
      if (q <= 0) await swell.cart.removeItem(itemId);
      else await swell.cart.updateItem(itemId, { quantity: q });
      const cart = await swell.cart.get();
      if (alive.current) set({ cart, updating: false });
      broadcast();
      return cart;
    } catch (err) {
      if (alive.current) set({ updating: false, error: err?.message || 'Failed to update quantity' });
      throw err;
    }
  }, [broadcast]);

  const removeItem = React.useCallback(async (itemId) => {
    set({ updating: true, error: null });
    try {
      await swell.cart.removeItem(itemId);
      const cart = await swell.cart.get();
      if (alive.current) set({ cart, updating: false });
      broadcast();
      return cart;
    } catch (err) {
      if (alive.current) set({ updating: false, error: err?.message || 'Failed to remove item' });
      throw err;
    }
  }, [broadcast]);

  const clear = React.useCallback(async () => {
    set({ updating: true, error: null });
    try {
      await swell.cart.setItems([]);
      const cart = await swell.cart.get();
      if (alive.current) set({ cart, updating: false });
      broadcast();
      return cart;
    } catch (err) {
      if (alive.current) set({ updating: false, error: err?.message || 'Failed to clear cart' });
      throw err;
    }
  }, [broadcast]);

  const value = React.useMemo(() => ({
    ...state,
    refresh: load,
    addItem,
    setItemQty,
    removeItem,
    clear,
    itemCount: Number(state.cart?.itemQuantity || 0),
    subtotal: Number(state.cart?.subtotal || 0),
    total: Number(state.cart?.grandTotal ?? state.cart?.total ?? 0),
    currency: state.cart?.currency || 'USD',
  }), [state, load, addItem, setItemQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return React.useContext(CartContext);
}
