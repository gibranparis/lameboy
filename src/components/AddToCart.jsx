// src/components/AddToCart.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCartUI } from '@/contexts/CartUIContext';

export default function AddToCart({ product }) {
  const { addItem, updating } = useCart();
  const { openCart } = useCartUI();

  // Normalize variants from Swell
  const variants = useMemo(() => {
    // Swell can expose `variants.results` or just `variants`
    const arr = product?.variants?.results || product?.variants || [];
    return Array.isArray(arr) ? arr : [];
  }, [product]);

  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState('');

  // Auto-select the sole variant to reduce friction
  useEffect(() => {
    if (hasVariants && variants.length === 1 && !variantId) {
      setVariantId(variants[0].id);
    }
  }, [hasVariants, variants, variantId]);

  async function onAdd(e) {
    e?.preventDefault?.();
    try {
      const payload = { quantity: 1 };

      // Always include productId
      payload.productId = product?.id;

      if (hasVariants) {
        if (!variantId) return; // require a selection
        payload.variantId = variantId;
      }

      await addItem(product?.id, payload); // CartContext wraps swell.cart.addItem
      openCart();
    } catch (err) {
      // Optional: replace with a toast in your UI system
      console.error('Add to cart failed:', err);
      alert('Could not add to cart. Try again.');
    }
  }

  return (
    <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {hasVariants && (
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          aria-label="Choose a variant"
        >
          <option value="">Select an option</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name || v.sku || 'Variant'}
            </option>
          ))}
        </select>
      )}

      <button type="submit" disabled={updating || (hasVariants && !variantId)}>
        {updating ? 'Adding…' : 'Add to cart'}
      </button>
    </form>
  );
}
