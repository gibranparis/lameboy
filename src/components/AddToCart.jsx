// src/components/AddToCart.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCartUI } from '@/contexts/CartUIContext';

export default function AddToCart({ product, quantity = 1 }) {
  const { addItem, updating } = useCart();
  const { openCart } = useCartUI();

  // Normalize variants: Swell may expose variants.results or variants directly
  const variants = useMemo(() => {
    const arr = product?.variants?.results ?? product?.variants ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [product]);

  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState('');

  // Auto-select the only variant if present
  useEffect(() => {
    if (hasVariants && variants.length === 1 && !variantId) {
      setVariantId(variants[0]?.id ?? '');
    }
  }, [hasVariants, variants, variantId]);

  const outOfStock =
    product?.stock_status === 'out_of_stock' ||
    (product?.stock_tracking && product?.stock_level === 0);

  async function onAdd(e) {
    e?.preventDefault?.();
    if (!product?.id || outOfStock) return;

    const payload = { productId: product.id, quantity: Number(quantity) || 1 };
    if (hasVariants) {
      if (!variantId) return; // require a selection
      payload.variantId = variantId;
    }

    try {
      await addItem(product.id, payload);
      openCart?.();
    } catch (err) {
      console.error('Add to cart failed', err);
      alert('Could not add to cart. Please try again.');
    }
  }

  return (
    <form onSubmit={onAdd} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {hasVariants && (
        <select
          name="variant"
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          aria-label="Choose an option"
        >
          <option value="">Select an option</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name || v.sku || 'Variant'}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={updating || outOfStock || (hasVariants && !variantId)}
        aria-disabled={updating || outOfStock || (hasVariants && !variantId)}
      >
        {outOfStock ? 'Out of stock' : updating ? 'Adding…' : 'Add to cart'}
      </button>
    </form>
  );
}
