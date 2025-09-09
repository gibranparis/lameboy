// src/contexts/CartContext.js
'use client';

import React from 'react';
import swell from '@/lib/swell';

// Single source of truth for cart state + mutations
const initial = { cart: null, loading: true, updating: false, error: null };

const CartContext = React.createContext({
  ...initial,
  refresh: async () => {},
  addItem: async (_productIdOrPayload, _opts = {}) => {},
  setItemQty: async (_itemId, _qty) => {},
  removeItem: async (_itemId) => {},
  clear: async () => {},
  itemCount: 0,
  subtotal: 0,
  total: 0,
  currency: 'USD',
});

function normalizeCart(c) {
  if (!c) return null;
  // Swell uses 'item_quantity' and 'subtotal', sometimes camel depending on config
  const itemCount = Number(
    c.itemQuantity ??
    c.item_quantity ??
    (Array.isArray(c.items) ? c.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) : 0)
  );
  const subtotal = Number(c.subtotal ?? c.subTotal ?? 0);
  const total = Number(c.grandTotal ?? c.total ?? subtotal);
  const currency = c.currency || 'USD';
  return { ...c, itemQuantity: itemCount, subtotal, grandTotal: total, currency };
}

export function CartProvider({ children }) {
  const [state, setState] = React.useState(initial);
  const alive = React.useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  const load = React.useCallback(async () => {
    set({ loading: true, error: null });
    try {
      const cart = await swell.cart.get();
      if (alive.current) set({ cart: normalizeCart(cart), loading: false });
    } catch (err) {
      if (alive.current) set({ error: err?.message || 'Failed to load cart', loading: false });
    }
  }, []);

  // Initial load + refresh on focus and cross-tab updates
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

  function normalizeItemPayload(productOrId, opts) {
    if (typeof productOrId === 'object' && productOrId !== null) {
      // Caller passed full payload
      const p = { ...productOrId };
      if (p.productId && !p.product_id) { p.product_id = p.productId; delete p.productId; }
      if (p.variantId && !p.variant_id) { p.variant_id = p.variantId; delete p.variantId; }
      return p;
    }
    // Caller passed productId and maybe opts
    const p = { product_id: productOrId, ...(opts || {}) };
    if (p.productId && !p.product_id) { p.product_id = p.productId; delete p.productId; }
    if (p.variantId && !p.variant_id) { p.variant_id = p.variantId; delete p.variantId; }
    return p;
  }

  const addItem = React.useCallback(async (productOrId, opts = {}) => {
    set({ updating: true, error: null });
    try {
      const payload = normalizeItemPayload(productOrId, opts);
      await swell.cart.addItem(payload);
      const cart = await swell.cart.get();
      if (alive.current) set({ cart: normalizeCart(cart), updating: false });
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
      let cart;
      if (q <= 0) {
        await swell.cart.removeItem(itemId);
        cart = await swell.cart.get();
      } else {
        await swell.cart.updateItem(itemId, { quantity: q });
        cart = await swell.cart.get();
      }
      if (alive.current) set({ cart: normalizeCart(cart), updating: false });
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
      if (alive.current) set({ cart: normalizeCart(cart), updating: false });
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
      if (alive.current) set({ cart: normalizeCart(cart), updating: false });
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
