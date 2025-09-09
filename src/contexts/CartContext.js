// src/contexts/CartContext.js
'use client';

import React from 'react';
import swell from '@/lib/swell';

// Cart state + actions
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

  const load = React.useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const cart = await swell.cart.get();
      setState((s) => ({ ...s, cart, loading: false }));
    } catch (err) {
      console.error('[cart] load failed', err);
      setState((s) => ({ ...s, error: err, loading: false }));
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const addItem = React.useCallback(async (productId, opts = {}) => {
    try {
      setState((s) => ({ ...s, updating: true, error: null }));
      const payload = { product_id: productId, quantity: Number(opts.quantity || 1) };
      if (opts.variant_id) payload.variant_id = opts.variant_id;
      if (opts.options) payload.options = opts.options;
      const cart = await swell.cart.addItem(payload);
      setState((s) => ({ ...s, cart, updating: false }));
      return cart;
    } catch (err) {
      console.error('[cart] addItem failed', err);
      setState((s) => ({ ...s, error: err, updating: false }));
      throw err;
    }
  }, []);

  const setItemQty = React.useCallback(async (itemId, qty) => {
   
