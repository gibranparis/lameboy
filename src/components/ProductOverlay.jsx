// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

/** Inline + size picker */
function PlusSizesInline({ sizes = ['OS','S','M','L','XL'], onPick }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const clickPlus = () => setOpen((v) => !v);
  const doPick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } }));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail: { qty: 1 } }));
    } catch {}
    setTimeout(() => { setPicked(null); setOpen(false); }, 380);
    onPick?.(sz);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button type="button" className={`pill plus-pill ${open ? 'is-active':''}`} onClick={clickPlus} aria-label="Add">+</button>
      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pill size-pill ${picked===sz?'is-selected flash-green':''}`}
              onClick={() => doPick(sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small round nav pill used for ▲ / ▼ / × */
function NavPill({ children, label, onClick, style }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pill product-hero-nav"
      onClick={onClick}
      style={{
        width: 28, height: 28, padding: 0, lineHeight: 1,
        display:'grid', placeItems:'center',
        position:'absolute',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/**
 * ProductOverlay
 * - Horizontal (wheel/keys/swipe) = image prev/next
 * - Vertical   (wheel/keys/swipe) = product prev/next (infinite loop)
 * - If there is only one product, vertical navigation is disabled.
 */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const multi = products.length > 1;

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  /* ---------- helpers ---------- */
  const wrapIndex = useCallback((i, len) => {
    // Safe modulo for negatives
    return ((i % len) + len) % len;
  }, []);

  const gotoProduct = useCallback((delta) => {
    if (!multi) return;
    const next = wrapIndex(index + delta, products.length);
    onIndexChange?.(next);
  }, [index, products.length, wrapIndex, onIndexChange, multi]);

  const nextImage = useCallback(() => setImgIdx((i) => Math.min(i + 1, imgs.length - 1)), [imgs.length]);
  const prevImage = useCallback(() => setImgIdx((i) => Math.max(i - 1, 0)), [imgs.length]);

  /* ---------- close via orb zoom ---------- */
  useEffect(() => {
    const handler = () => onClose?.();
    const names = ['lb:zoom', 'lb:zoom/grid-density'];
    names.forEach((n) => {
      window.addEventListener(n, handler);
      document.addEventListener(n, handler);
    });
    return () => {
      names.forEach((n) => {
        window.removeEventListener(n, handler);
        document.removeEventListener(n, handler);
      });
    };
  }, [onClose]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return nextImage();
      if (e.key === 'ArrowLeft')  return prevImage();
      if (multi) {
        if (e.key === 'ArrowDown') return gotoProduct(+1);
        if (e.key === 'ArrowUp')   return gotoProduct(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [multi, gotoProduct, nextImage, prevImage, onClose]);

  /* ---------- wheel (desktop) with infinite loop ---------- */
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 160) return;
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        // Horizontal = image
        if (e.deltaX > 0) nextImage();
        else              prevImage();
      } else if (multi) {
        // Vertical = product (loop)
        if (e.deltaY > 0) gotoProduct(+1);
        else              gotoProduct(-1);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [multi, gotoProduct, nextImage, prevImage]);

  /* ---------- touch (mobile) ---------- */
  const touchStart = useRef({ x: 0, y: 0, t: 0 });
  useEffect(() => {
    const onTouchStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      touchStart.current = { x: t.clientX, y: t.clientY, t: performance.now() };
    };
    const onTouchEnd = (e) => {
      const t0 = touchStart.current;
      const t1 = performance.now();
      // basic swipe detection
      const dt = Math.max(1, t1 - t0.t);
      const touch = e.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.clientX - t0.x;
      const dy = touch.clientY - t0.y;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      const MIN = 28; // threshold

      if (ax < MIN && ay < MIN) return;

      if (ay > ax) {
        // vertical → product (loop)
        if (!multi) return;
        dy > 0 ? gotoProduct(+1) : gotoProduct(-1);
      } else {
        // horizontal → image
        dx < 0 ? nextImage() : prevImage();
      }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [multi, gotoProduct, nextImage, prevImage]);

  /* ---------- overlay state flag ---------- */
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = typeof product.price === 'number'
    ? `$${(product.price/100).toFixed(2)}`
    : String(product.price ?? '');

  const sizes = product.sizes?.length ? product.sizes : ['OS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" data-overlay>
      <div className="product-hero">
        {/* Close (kept for SR users though visually hidden by CSS) */}
        <button className="product-hero-close pill" onClick={onClose} aria-label="Close">×</button>

        {/* Up / Down nav pills (like close pill) */}
        {multi && (
          <>
            <NavPill
              label="Previous product"
              onClick={() => gotoProduct(-1)}
              style={{ right: 16, top: '42%' }}
            >
              ▲
            </NavPill>
            <NavPill
              label="Next product"
              onClick={() => gotoProduct(+1)}
              style={{ right: 16, top: '54%' }}
            >
              ▼
            </NavPill>
          </>
        )}

        {imgs[imgIdx] && (
          <Image
            src={imgs[imgIdx]}
            alt={product.title}
            width={1200}
            height={900}
            className="product-hero-img"
            priority
            unoptimized
          />
        )}

        {imgs.length > 1 && (
          <div className="row-nowrap" style={{ gap:8, marginTop:6 }}>
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i+1}`}
                className={`pill ${i===imgIdx ? 'size-pill is-selected' : ''}`}
                onClick={() => setImgIdx(i)}
                style={{ width:22, height:22, padding:0 }}
              />
            ))}
          </div>
        )}

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        <PlusSizesInline sizes={sizes} onPick={() => { /* dispatched above */ }} />
      </div>
    </div>
  );
}
