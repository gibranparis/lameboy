// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Small + size picker used inside overlay */
function PlusSizesInline({ sizes = ['XS','S','M','L','XL'], onPick }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState/** @type {string|null} */(null);

  const clickPlus = () => setOpen(v => !v);

  const doPick = (sz) => {
    setPicked(sz);
    // cart hooks
    try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('cart:add',       { detail: { qty: 1 } })); } catch {}
    try { onPick && onPick(sz); } catch {}
    setTimeout(() => { setPicked(null); setOpen(false); }, 380);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button
        type="button"
        className={`pill plus-pill ${open ? 'is-active':''}`}
        onClick={clickPlus}
        aria-label="Add"
        title="Add"
      >
        +
      </button>
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

/**
 * ProductOverlay
 * Props:
 *  - products: array
 *  - index: number (current product)
 *  - onIndexChange: (nextIdx) => void
 *  - onClose: () => void
 */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products?.[index];
  const imgs = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length) return product.images;
    return product.image ? [product.image] : [];
  }, [product]);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => { setImgIdx(0); }, [index]);

  // Helper clamps
  const clampImg = useCallback((i) => Math.max(0, Math.min(i, Math.max(0, imgs.length - 1))), [imgs.length]);
  const clampProd = useCallback((i) => Math.max(0, Math.min(i, Math.max(0, (products?.length ?? 1) - 1))), [products?.length]);

  // Close overlay via orb click
  useEffect(() => {
    const onZoom = () => onClose?.();
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  // Lock page scroll & mark overlay-open for CSS
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.removeAttribute('data-overlay-open');
    };
  }, []);

  // Keyboard: arrows for gallery (←/→), products (↑/↓), Esc close
  useEffect(() => {
    const onKey = (e) => {
      if (!product) return;
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'ArrowRight') { setImgIdx(i => clampImg(i + 1)); return; }
      if (e.key === 'ArrowLeft')  { setImgIdx(i => clampImg(i - 1)); return; }
      if (e.key === 'ArrowDown')  { onIndexChange?.(clampProd(index + 1)); return; }
      if (e.key === 'ArrowUp')    { onIndexChange?.(clampProd(index - 1)); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, index, clampImg, clampProd, onIndexChange, onClose]);

  // Wheel: vertical = product prev/next, horizontal = gallery
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 220) { e.preventDefault(); return; } // throttle and stop page scroll
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx(i => clampImg(i + 1));
        else              setImgIdx(i => clampImg(i - 1));
      } else {
        if (e.deltaY > 0) onIndexChange?.(clampProd(index + 1));
        else              onIndexChange?.(clampProd(index - 1));
      }
      e.preventDefault(); // keep document from scrolling
    };
    // Non-passive to allow preventDefault
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [index, clampImg, clampProd, onIndexChange]);

  // Touch swipe: left/right = gallery, up/down = product
  const touch = useRef({ x: 0, y: 0, t: 0, used: false });
  useEffect(() => {
    const start = (e) => {
      const p = e.touches?.[0]; if (!p) return;
      touch.current = { x: p.clientX, y: p.clientY, t: performance.now(), used: false };
    };
    const move = (e) => {
      const p = e.touches?.[0]; if (!p) return;
      const dx = p.clientX - touch.current.x;
      const dy = p.clientY - touch.current.y;
      if (touch.current.used) { e.preventDefault(); return; }

      const absX = Math.abs(dx), absY = Math.abs(dy);
      const min = 24; // px threshold
      if (absX < min && absY < min) return;

      if (absX > absY) {
        // horizontal → gallery
        if (dx < 0) setImgIdx(i => clampImg(i + 1)); else setImgIdx(i => clampImg(i - 1));
      } else {
        // vertical → product
        if (dy < 0) onIndexChange?.(clampProd(index - 1)); else onIndexChange?.(clampProd(index + 1));
      }
      touch.current.used = true;
      e.preventDefault();
    };
    const end = () => { touch.current.used = false; };

    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove',  move,  { passive: false });
    window.addEventListener('touchend',   end,   { passive: true });
    window.addEventListener('touchcancel',end,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove',  move);
      window.removeEventListener('touchend',   end);
      window.removeEventListener('touchcancel',end);
    };
  }, [index, clampImg, clampProd, onIndexChange]);

  if (!product) return null;

  const priceText = typeof product.price === 'number'
    ? `$${(product.price / 100).toFixed(2)}`
    : String(product.price ?? '');

  const sizes = product.sizes?.length ? product.sizes : ['XS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" data-overlay role="dialog" aria-modal="true">
      <div className="product-hero">
        {/* explicit close; orb also acts as back */}
        <button className="product-hero-close pill" onClick={onClose} aria-label="Close">×</button>

        {/* main image */}
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

        {/* gallery dots */}
        {imgs.length > 1 && (
          <div className="row-nowrap" style={{ gap:8, marginTop:6 }}>
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                className={`pill ${i === imgIdx ? 'size-pill is-selected' : ''}`}
                onClick={() => setImgIdx(i)}
                style={{ width:22, height:22, padding:0 }}
              />
            ))}
          </div>
        )}

        {/* title / price */}
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        {/* add flow */}
        <PlusSizesInline
          sizes={sizes}
          onPick={() => { /* no-op hook here; events already fired */ }}
        />
      </div>
    </div>
  );
}
