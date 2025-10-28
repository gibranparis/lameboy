// @ts-check
// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ============================= Utilities ============================= */
function formatPrice(val) {
  // Accept numbers (assume cents), strings (use as-is), or falsy (0.00)
  if (typeof val === 'number' && Number.isFinite(val)) {
    const dollars = (val / 100).toFixed(2);
    return `$${dollars}`;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    // If string already has $, return as-is; otherwise prefix
    return /^\$/.test(val) ? val : `$${val}`;
  }
  return '$0.00';
}

/* ------------------------------------------------------------------ */
/* Inline +/sizes control (NO new file)                               */
/* ------------------------------------------------------------------ */
function PlusSizesInline({
  sizes = ['XS', 'S', 'M', 'L', 'XL'],
  disabled = false,
  title = 'Add to cart',
  onAdd, // (size: string) => void
}) {
  const [showSizes, setShowSizes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState/** @type {string|null} */(null);

  const plusClass = useMemo(
    () => ['pill', 'plus-pill', showSizes ? 'is-active' : ''].filter(Boolean).join(' '),
    [showSizes]
  );

  const clickPlus = useCallback(() => {
    if (disabled || busy) return;
    setShowSizes((v) => !v);
  }, [disabled, busy]);

  const pickSize = useCallback((size) => {
    if (disabled || busy) return;
    setBusy(true);
    setPicked(size);
    try { onAdd?.(size); } catch {}

    // brief green flash then reset to just “+”
    setTimeout(() => {
      setShowSizes(false);
      setPicked(null);
      setBusy(false);
    }, 420);
  }, [disabled, busy, onAdd]);

  return (
    <div className="row-nowrap" style={{ justifyContent: 'center', gap: 10 }}>
      {/* “+” stays visible; turns grey while sizes are shown */}
      <button
        type="button"
        aria-label={title}
        title={title}
        className={plusClass}
        disabled={disabled}
        onClick={clickPlus}
      >
        +
      </button>

      {/* sizes appear while + is active */}
      {showSizes && (
        <div className="row-nowrap" style={{ gap: 8 }}>
          {sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={[
                'pill',
                'size-pill',
                picked === sz ? 'is-selected flash-green' : '',
              ].join(' ')}
              aria-pressed={picked === sz}
              disabled={busy}
              onClick={() => pickSize(sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product overlay                                                     */
/* ------------------------------------------------------------------ */
export default function ProductOverlay({
  product,
  onClose,
  onAddToCart, // (product, { size, count }) => void
}) {
  const closeBtnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);

  // Guard early
  if (!product) return null;

  // close on Escape + orb “back” (lb:zoom)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const onZoom = () => onClose?.();
    window.addEventListener('keydown', onKey);
    window.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('lb:zoom', onZoom);
    };
  }, [onClose]);

  // mark overlay open so CSS can dim / disable grid
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-overlay-open', '1');
    // focus close for a11y
    requestAnimationFrame(() => { try { closeBtnRef.current?.focus(); } catch {} });
    return () => root.removeAttribute('data-overlay-open');
  }, []);

  const sizes = useMemo(
    () => (Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ['XS','S','M','L','XL']),
    [product?.sizes]
  );

  const handleAdd = useCallback((size) => {
    const count = 1;
    const id = product?.id ?? null;

    // app-level event bus (new + legacy)
    try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { id, size, count } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('cart:add',       { detail: { size, count } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('cart:bump')); } catch {}

    // optional hook for store integration
    try { onAddToCart?.(product, { size, count }); } catch {}
  }, [onAddToCart, product]);

  const title = product?.title ?? 'LAMEBOY';
  const priceText = formatPrice(product?.price);

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true" aria-label={`${title} details`} data-overlay>
      <div className="product-hero">
        {/* single explicit close; orb also acts as back */}
        <button
          ref={closeBtnRef}
          className="product-hero-close"
          onClick={onClose}
          aria-label="Close product"
          title="Close"
        >
          ×
        </button>

        {!!product?.image && (
          <div style={{ width:'100%', display:'grid', placeItems:'center' }}>
            <Image
              src={product.image}
              alt={title}
              width={1000}
              height={900}
              priority
              className="product-hero-img"
            />
          </div>
        )}

        <div className="product-hero-title">{title}</div>
        <div className="product-hero-price">{priceText}</div>

        <PlusSizesInline sizes={sizes} onAdd={handleAdd} />
      </div>
    </div>
  );
}
