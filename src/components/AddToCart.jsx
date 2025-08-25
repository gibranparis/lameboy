'use client';
import { useState } from 'react';
import swell from '@/lib/swell';

export default function AddToCart({ productId, variantId }) {
  const [loading, setLoading] = useState(false);
  async function add() {
    try {
      setLoading(true);
      await swell.cart.addItem({ product_id: productId, variant_id: variantId, quantity: 1 });
      setLoading(false);
      window.location.href = '/cart';
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('Failed to add to cart.');
    }
  }
  return (
    <button className="btn" disabled={loading} onClick={add}>
      {loading ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
