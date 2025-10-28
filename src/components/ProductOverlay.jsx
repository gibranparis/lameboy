// @ts-check
// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Normalize images to a non-empty array */
function useImages(product) {
  return useMemo(() => {
    const imgs =
      (Array.isArray(product?.images) && product.images.length ? product.images :
      (product?.image ? [product.image] : []))
      .filter(Boolean);
    return imgs.length ? imgs : ['/placeholder.png'];
  }, [product]);
}

/** Clamp helper */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** Wheel throttle so we move one step per gesture */
function useWheelNavigator({ onPrevProduct, onNextProduct, onPrevImage, onNextImage }) {
  const cool = useRef(false);
  const COOLDOWN_MS = 380;     // feel-good pacing
  const THRESH = 40;           // min delta to count as navigation

  const handle = useCallback((e) => {
    // prevent page scroll while overlay is open
    e.preventDefault();

    if (cool.current) return;
    const dx = e.deltaX;
    const dy = e.deltaY;

    // Horizontal wins for image nav if it's the dominant intent
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESH) {
      if (dx > 0) onNextImage?.();
      else onPrevImage?.();
    } else if (Math.abs(dy) > THRESH) {
      if (dy > 0) onNextProduct?.();
      else onPrevProduct?.();
    } else {
      return; // ignore micro-scroll
    }

    cool.current = true;
    setTimeout(() => { cool.current = false; }, COOLDOWN_MS);
  }, [onPrevProduct, onNextProduct, onPrevImage, onNextImage]);

  return handle;
}

/** Touch/swipe navigation (vertical = product, horizontal = image) */
function useTouchNavigator({ onPrevProduct, onNextProduct, onPrevImage, onNextImage }) {
  const start = useRef({ x: 0, y: 0, t: 0 });
  const SWIPE_PX = 32;
  const SWIPE_MS = 700;

  const onTouchStart = useCallback((e) => {
    const t = e.touches?.[0];
    if (!t) return;
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const t = start.current;
    const dx = (e.changedTouches?.[0]?.clientX ?? t.x) - t.x;
    const dy = (e.changedTouches?.[0]?.clientY ?? t.y) - t.y;
    const dt = Date.now() - t.t;
    if (dt > SWIPE_MS) return;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_PX) {
      if (dx < 0) onNextImage?.(); else onPrevImage?.();
    } else if (Math.abs(dy) > SWIPE_PX) {
      if (dy < 0) onNextProduct?.(); else onPrevProduct?.();
    }
  }, [onPrevProduct, onNextProduct, onPrevImage, onNextImage]);

  return { onTouchStart, onTouchEnd };
}

/* ------------------------------------------------------------------ */
/* Inline +/sizes control                                              */
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

  const clickPlus = useCallback(() => {
    if (disabled || busy) return;
    setShowSizes((v) => !v);
  }, [disabled, busy]);

  const pickSize = useCallback((size) => {
    if (disabled || busy) return;
    setBusy(true);
    setPicked(size);

    // cart hooks (badge/bump)
    try { window.dispatchEvent(new CustomEvent('cart:add',  { detail: { qty: 1, size } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('cart:bump', { detail: { size } })); } catch {}

    try { onAdd && onAdd(size); } catch {}

    setTimeout(() => {
      setShowSizes(false);
      setPicked(null);
      setBusy(false);
    }, 420);
  }, [disabled, busy, onAdd]);

  return (
    <div className="row-nowrap" style={{ justifyContent: 'center', gap: 10 }}>
      <button
        type="button"
        aria-label={title}
        title={title}
        className={['pill', 'plus-pill', showSizes ? 'is-active' : ''].join(' ')}
        disabled={disabled}
        onClick={clickPlus}
      >
        +
      </button>

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
  onAddToCart,            // (product, { size, qty }) => void
  onPrevProduct,          // () => void
  onNextProduct,          // () => void
}) {
  const images = useImages(product);
  const [idx, setIdx] = useState(0);

  // mark overlay open so CSS can fully hide the grid & lock scroll
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-overlay-open', '1');
    return () => root.removeAttribute('data-overlay-open');
  }, []);

  // keep idx in range if product changes
  useEffect(() => { setIdx(0); }, [product?.id]);

  const priceText = useMemo(() => {
    const p = product?.price;
    if (typeof p === 'number') return `$${(p / 100).toFixed(2)}`;
    if (typeof p === 'string') return p;
    return '';
  }, [product]);

  const prevImg = useCallback(() => setIdx((i) => clamp(i - 1, 0, images.length - 1)), [images.length]);
  const nextImg = useCallback(() => setIdx((i) => clamp(i + 1, 0, images.length - 1)), [images.length]);

  // Mouse wheel navigation (product ↕, image ↔)
  const onWheel = useWheelNavigator({
    onPrevProduct, onNextProduct, onPrevImage: prevImg, onNextImage: nextImg
  });

  // Touch navigation
  const touch = useTouchNavigator({
    onPrevProduct, onNextProduct, onPrevImage: prevImg, onNextImage: nextImg
  });

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowUp')    { e.preventDefault(); onPrevProduct?.(); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); onNextProduct?.(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevImg(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextImg(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrevProduct, onNextProduct, prevImg, nextImg]);

  // orb acts as back while overlay is open
  useEffect(() => {
    const onZoom = () => onClose?.();
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  const handleAdd = useCallback((size) => {
    try { onAddToCart && onAddToCart(product, { size, qty: 1 }); } catch {}
  }, [onAddToCart, product]);

  if (!product) return null;

  return (
    <div
      className="product-hero-overlay"
      data-overlay
      onWheel={onWheel}
      onTouchStart={touch.onTouchStart}
      onTouchEnd={touch.onTouchEnd}
    >
      <div className="product-hero">
        {/* explicit close (hidden by CSS if you prefer orb-only) */}
        <button className="product-hero-close" onClick={onClose} aria-label="Close">×</button>

        {/* image */}
        <div style={{ width:'100%', display:'grid', placeItems:'center' }}>
          <Image
            src={images[idx]}
            alt={product.title}
            width={1200}
            height={1000}
            className="product-hero-img"
            priority
          />
        </div>

        {/* simple pager dots (optional tiny control) */}
        {images.length > 1 && (
          <div className="row-nowrap" style={{ gap:6, marginTop:4 }}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i+1}`}
                onClick={() => setIdx(i)}
                className="pill"
                style={{ width:10, height:10, padding:0, borderRadius:9999, opacity:i===idx?1:.45 }}
              />
            ))}
          </div>
        )}

        {/* title & price */}
        <div className="product-hero-title">{product.title}</div>
        {priceText && <div className="product-hero-price">{priceText}</div>}

        {/* + / sizes */}
        <PlusSizesInline
          sizes={product.sizes || ['XS','S','M','L','XL']}
          onAdd={handleAdd}
        />
      </div>
    </div>
  );
}
