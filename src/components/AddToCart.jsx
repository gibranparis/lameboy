// src/components/AddToCart.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCartUI } from '@/contexts/CartUIContext';

export default function AddToCart({ product, quantity = 1 }) {
  const { addItem, updating } = useCart();
  const { openCart } = useCartUI();
  const selectRef = useRef(null);

  // Normalize Swell variants: sometimes at product.variants.results, sometimes product.variants
  const variants = useMemo(() => {
    const arr = product?.variants?.results || product?.variants || [];
    return Array.isArray(arr) ? arr : [];
  }, [product]);

  const hasVariants = variants.length > 0;

  // Auto-select the sole variant (less friction)
  const [variantId, setVariantId] = useState('');
  useEffect(() => {
    if (hasVariants && variants.length === 1 && !variantId) {
      setVariantId(variants[0].id);
    }
  }, [hasVariants, variants, variantId]);

  async function onAdd(e) {
    e?.preventDefault?.();

    // Require a variant when the product has variants
    if (hasVariants && !variantId) {
      selectRef.current?.focus();
      return;
    }

    try {
      const payload = {
        productId: product?.id,
        quantity: Math.max(1, Number(quantity) || 1),
      };
      if (variantId) payload.variantId = variantId;

      await addItem(product?.id, payload); // CartContext wraps swell.cart.addItem
      openCart();
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Could not add to cart. Please try again.');
    }
  }

  // Basic “out of stock” lock (optional, safe default)
  const outOfStock =
    product?.stock_status === 'out_of_stock' ||
    (hasVariants && variantId && variants.find(v => v.id === variantId)?.stock_status === 'out_of_stock');

  return (
    <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {hasVariants && (
        <>
          <label htmlFor="variant-select" style={{ position: 'absolute', left: -9999 }}>
            Choose a variant
          </label>
          <select
            id="variant-select"
            name="variant"
            ref={selectRef}
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={updating}
            aria-label="Choose a variant"
          >
            <option value="">Select an option</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.sku || 'Variant'}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        disabled={updating || outOfStock || (hasVariants && !variantId)}
      >
        {outOfStock ? 'Out of stock' : updating ? 'Adding…' : 'Add to cart'}
      </button>
    </form>
  );
}
