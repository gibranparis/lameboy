// src/contexts/CartContext.js
'use client';

import React from 'react';
import swell from '@/lib/swell';

// Minimal normalized shape so consumers have stable keys
const initialCart = {
  id: null,
  items: [],
  itemCount: 0,
  subTotal: 0,
  currency: 'USD',
};

const CartContext = React.createContext({
  cart: initialCart,
  loading: true,
  refresh: async () => {},
  addItem: async (_productOrId, _opts = {}) => {},
  setItemQty: async (_itemId, _qty) => {},
  removeItem: async (_itemId) => {},
  clear: async () => {},
  subtotal: 0,
  itemCount: 0,
});

function normalizeCart(c) {
  if (!c) return initialCart;
  const subtotal = c.subtotal ?? c.subTotal ?? 0;
  const itemCount =
    c.item_quantity ??
    c.itemCount ??
    (Array.isArray(c.items) ? c.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);
  return { ...c, subTotal: subtotal, itemCount };
}

export function CartProvider({ children }) {
  const [cart, setCart] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const c = await swell.cart.get();
      setCart(normalizeCart(c));
    } catch (err) {
      console.error('[cart] get failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = React.useCallback(async (productOrId, opts = {}) => {
    try {
      setLoading(true);
      const product_id =
        typeof productOrId === 'string' ? productOrId : productOrId?.id;
      const c = await swell.cart.addItem({ product_id, ...opts });
      setCart(normalizeCart(c));
    } catch (err) {
      console.error('[cart] addItem failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setItemQty = React.useCallback(async (itemId, qty) => {
    try {
      setLoading(true);
      const c = await swell.cart.updateItem(itemId, {
        quantity: Math.max(0, Number(qty) || 0),
      });
      setCart(normalizeCart(c));
    } catch (err) {
      console.error('[cart] setItemQty failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = React.useCallback(async (itemId) => {
    try {
      setLoading(true);
      const c = await swell.cart.removeItem(itemId);
      setCart(normalizeCart(c));
    } catch (err) {
      console.error('[cart] removeItem failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = React.useCallback(async () => {
    try {
      setLoading(true);
      const c = await swell.cart.setItems([]);
      setCart(normalizeCart(c));
    } catch (err) {
      console.error('[cart] clear failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      cart: cart ?? initialCart,
      loading,
      refresh,
      addItem,
      setItemQty,
      removeItem,
      clear,
      itemCount: (cart ?? initialCart).itemCount,
      subtotal: (cart ?? initialCart).subTotal,
    }),
    [cart, loading, refresh, addItem, setItemQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}

export default CartContext;
