// @ts-check
// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
    setShowSizes(true);
  }, [disabled, busy]);

  const pickSize = useCallback((size) => {
    if (disabled || busy) return;
    setBusy(true);
    setPicked(size);

    // cart hooks (badge/bump)
    try { window.dispatchEvent(new CustomEvent('cart:add', { detail: { size, qty: 1 } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('cart:bump')); } catch {}

    try { onAdd && onAdd(size); } catch {}

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
  onAddToCart, // (product, { size, qty }) => void
}) {
  // mark overlay open so CSS can fully hide the grid
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-overlay-open', '1');
    return () => root.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const handleAdd = useCallback((size) => {
    try { onAddToCart && onAddToCart(product, { size, qty: 1 }); } catch {}
  }, [onAddToCart, product]);

  return (
    <div className="product-hero-overlay" data-overlay>
      <div className="product-hero">
        {/* single explicit close; orb also acts as back */}
        <button className="product-hero-close" onClick={onClose} aria-label="Close">×</button>

        {product.image && (
          <Image
            src={product.image}
            alt={product.title}
            width={1000}
            height={900}
            priority
            className="product-hero-img"
          />
        )}

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{product.price}</div>

        <PlusSizesInline
          sizes={product.sizes || ['XS','S','M','L','XL']}
          onAdd={handleAdd}
        />
      </div>
    </div>
  );
}
