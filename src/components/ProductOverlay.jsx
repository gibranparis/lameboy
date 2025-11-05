// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/** Inline + size picker (unchanged) */
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

/** Round caret button that can “flash-green” like size pills */
function CaretButton({ label, active }) {
  const S = 28;
  return (
    <div
      className={`caret-btn ${active ? 'flash-green' : ''}`}
      aria-hidden
      style={{
        width: S, height: S,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(255,255,255,.9)',
        boxShadow: '0 2px 10px rgba(0,0,0,.08), inset 0 0 0 1px rgba(0,0,0,.08)',
        color: '#111',
        fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 14,
        fontWeight: 800,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      <span style={{ transform: 'translateY(-1px)' }}>{label}</span>
    </div>
  );
}

/**
 * ProductOverlay
 * - Horizontal: image carousel
 * - Vertical: prev/next product (wraps infinitely)
 * - Up/Down carets flash green on click OR on scroll direction
 */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  // caret flash state
  const [flashUp, setFlashUp] = useState(false);
  const [flashDown, setFlashDown] = useState(false);
  const setFlash = (dir) => {
    if (dir === 'up')  { setFlashUp(true);   setTimeout(() => setFlashUp(false), 260); }
    if (dir === 'down'){ setFlashDown(true); setTimeout(() => setFlashDown(false), 260); }
  };

  // Close overlay via orb zoom
  useEffect(() => {
    const handler = () => onClose?.();
    document.addEventListener('lb:zoom', handler);
    document.addEventListener('lb:zoom/grid-density', handler);
    return () => {
      document.removeEventListener('lb:zoom', handler);
      document.removeEventListener('lb:zoom/grid-density', handler);
    };
  }, [onClose]);

  const multi = products.length > 1;
  const wrap = (i, len) => ((i % len) + len) % len;

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === 'ArrowLeft')  return setImgIdx((i) => Math.max(i - 1, 0));
      if (multi) {
        if (e.key === 'ArrowDown') { setFlash('down'); return onIndexChange?.(wrap(index + 1, products.length)); }
        if (e.key === 'ArrowUp')   { setFlash('up');   return onIndexChange?.(wrap(index - 1, products.length)); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, multi, index, onIndexChange, onClose]);

  // Wheel with flash + wrap
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 160) return;
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
        else setImgIdx((i) => Math.max(i - 1, 0));
      } else if (multi) {
        if (e.deltaY > 0) { setFlash('down'); onIndexChange?.(wrap(index + 1, products.length)); }
        else              { setFlash('up');   onIndexChange?.(wrap(index - 1, products.length)); }
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, multi, index, onIndexChange]);

  // Touch swipe (mobile)
  useEffect(() => {
    let y0 = null;
    const onStart = (e) => { y0 = e.touches?.[0]?.clientY ?? null; };
    const onEnd = (e) => {
      if (!multi || y0 == null) return;
      const y1 = e.changedTouches?.[0]?.clientY ?? y0;
      const dy = y1 - y0;
      if (Math.abs(dy) < 24) return;
      if (dy < 0) { setFlash('down'); onIndexChange?.(wrap(index + 1, products.length)); }
      else        { setFlash('up');   onIndexChange?.(wrap(index - 1, products.length)); }
      y0 = null;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [multi, index, onIndexChange, products.length]);

  // mark overlay open (lets orb reverse)
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
        {/* Up/Down controls with green flash */}
        {products.length > 1 && (
          <div style={{
            position:'fixed',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            display:'grid',
            gap:8,
            zIndex: 110,
          }}>
            <button
              type="button"
              onClick={() => { setFlash('up'); onIndexChange?.(wrap(index - 1, products.length)); }}
              aria-label="Previous product"
              title="Previous product"
              style={{ padding:0, background:'transparent', border:'none' }}
            >
              <CaretButton label="^" active={flashUp} />
            </button>
            <button
              type="button"
              onClick={() => { setFlash('down'); onIndexChange?.(wrap(index + 1, products.length)); }}
              aria-label="Next product"
              title="Next product"
              style={{ padding:0, background:'transparent', border:'none' }}
            >
              <CaretButton label="v" active={flashDown} />
            </button>
          </div>
        )}

        {/* Image */}
        {imgs[imgIdx] && (
          <Image
            src={imgs[imgIdx]}
            alt={product.title}
            width={1600}
            height={1200}
            className="product-hero-img"
            priority
            unoptimized
          />
        )}

        {/* Dots */}
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
