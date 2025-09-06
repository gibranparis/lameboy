// src/components/AddToCart.jsx
'use client';

import { useMemo, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCartUI } from '@/contexts/CartUIContext';

export default function AddToCart({ product }) {
  const { addItem, updating } = useCart();
  const { openCart } = useCartUI();
  const [variantId, setVariantId] = useState('');

  const hasVariants = (product?.variants?.results?.length || 0) > 0;
  const variants = useMemo(
    () => (product?.variants?.results || []).map(v => ({ id: v.id, name: v.name || v.sku || 'Variant' })),
    [product?.variants?.results]
  );

  async function onAdd(e) {
    e?.preventDefault?.();
    if (hasVariants && !variantId) return;
    await addItem(product.id, { quantity: 1, ...(variantId ? { variantId } : {}) });
    openCart();
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {hasVariants ? (
        <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          <option value="">Select variant</option>
          {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      ) : null}
      <button onClick={onAdd} disabled={updating}>Add to cart</button>
    </div>
  );
}
