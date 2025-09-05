// src/components/AddToCart.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import swell from '@/lib/swell-client';
import { useCartUI } from '@/contexts/CartUIContext';

export default function AddToCart({ product }) {
  const { openCart } = useCartUI();

  const hasVariants = (product?.variants?.results?.length || 0) > 0;
  const variants = useMemo(() => {
    const list = product?.variants?.results || [];
    return list.map((v) => ({
      id: v.id,
      name: v.name || v.sku || 'Variant',
      price: v.sale_price ?? v.price ?? product?.price ?? 0,
    }));
  }, [product]);

  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(variants?.[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    setVariantId(variants?.[0]?.id ?? null);
    setQuantity(1);
    setDone(false);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function fmt(n, currency = product?.currency || 'USD') {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
    } catch {
      return `$${Number(n).toFixed(2)}`;
    }
  }

  async function add(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    e?.nativeEvent?.stopImmediatePropagation?.();

    try {
      setBusy(true);
      setDone(false);

      if (!swell?.cart?.addItem) {
        throw new Error('Swell client not initialized');
      }
      if (!product?.id) {
        throw new Error('Missing product id');
      }

      const payload = {
        product_id: product.id,
        quantity: Math.max(1, Number(quantity) || 1),
        ...(hasVariants && variantId ? { variant_id: variantId } : {}),
      };

      await swell.cart.addItem(payload);

      try { localStorage.setItem('cart:updated', String(Date.now())); } catch {}
      setDone(true);
    } catch (err) {
      console.error('[cart] addItem failed:', err);
      alert(
        err?.message?.includes('Swell client not initialized')
          ? 'Store config missing. Set NEXT_PUBLIC_SWELL_* in Vercel and redeploy.'
          : 'Could not add to cart. Please try again.'
      );
    } finally {
      setBusy(false);
      openCart();
      try { window.dispatchEvent(new Event('menu:close')); } catch {}
    }
  }

  // auto-hide confirmation after 3s
  useEffect(() => {
    if (!done) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setDone(false);
      hideTimer.current = null;
    }, 3000);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [done]);

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      {hasVariants && (
        <label style={{ display: 'grid', gap: 6 }}>
          <span className="muted" style={{ fontSize: 13 }}>Variant</span>
          <select
            value={variantId || ''}
            onChange={(e) => setVariantId(e.target.value)}
            style={{
              height: 40,
              borderRadius: 8,
              border: '1px solid var(--input-bd)',
              padding: '0 10px',
              background: 'var(--input-bg)',
              color: 'var(--input-fg)',
            }}
            disabled={busy}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {fmt(v.price)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: 'grid', gap: 6, maxWidth: 120 }}>
        <span className="muted" style={{ fontSize: 13 }}>Quantity</span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{
            height: 40,
            borderRadius: 8,
            border: '1px solid var(--input-bd)',
            padding: '0 10px',
            background: 'var(--input-bg)',
            color: 'var(--input-fg)',
          }}
          disabled={busy}
        />
      </label>

      <button className="btn" type="button" onClick={add} disabled={busy}>
        {busy ? 'Adding…' : 'Add to Cart'}
      </button>

      <div role="status" aria-live="polite" style={{ minHeight: 18 }}>
        {done && (
          <div className="muted" style={{ fontSize: 13, color: 'green' }}>
            ✓ Added —{' '}
            <button
              type="button"
              onClick={openCart}
              style={{ background: 'transparent', border: 0, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            >
              open cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
