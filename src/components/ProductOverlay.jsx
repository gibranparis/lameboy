// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

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

/** Tiny round caret button (perfectly centered glyph) */
function CaretButton({ label, onClick, title }) {
  const S = 28;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: S, height: S,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        lineHeight: `${S}px`,
        fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 14,
        fontWeight: 700,
        background: 'rgba(255,255,255,.85)',
        boxShadow: '0 2px 10px rgba(0,0,0,.08), inset 0 0 0 1px rgba(0,0,0,.08)',
        color: '#111',
        padding: 0,
        margin: 0,
      }}
    >
      <span style={{ transform: 'translateY(-1px)' }}>{label}</span>
    </button>
  );
}

/**
 * ProductOverlay
 * - Horizontal: image carousel
 * - Vertical: prev/next product (wraps infinitely)
 */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  // Close overlay via orb zoom (listen once on document to avoid dup fires)
  useEffect(() => {
    const handler = () => onClose?.();
    document.addEventListener('lb:zoom', handler);
    document.addEventListener('lb:zoom/grid-density', handler);
    return () => {
      document.removeEventListener('lb:zoom', handler);
      document.removeEventListener('lb:zoom/grid-density', handler);
    };
  }, [onClose]);

  // Keyboard
  const multi = products.length > 1;
  const wrap = (i, len) => ((i % len) + len) % len;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === 'ArrowLeft')  return setImgIdx((i) => Math.max(i - 1, 0));
      if (multi) {
        if (e.key === 'ArrowDown') return onIndexChange?.(wrap(index + 1, products.length));
        if (e.key === 'ArrowUp')   return onIndexChange?.(wrap(index - 1, products.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, multi, index, onIndexChange, onClose]);

  // Wheel (wrap infinitely); mobile scroll naturally translates
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 180) return;
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
        else setImgIdx((i) => Math.max(i - 1, 0));
      } else if (multi) {
        if (e.deltaY > 0) onIndexChange?.(wrap(index + 1, products.length));
        else              onIndexChange?.(wrap(index - 1, products.length));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, multi, index, onIndexChange]);

  // mark overlay open (locks page scroll via CSS & lets the orb reverse spin)
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
        {/* Up/Down control — tight stack, centered symbols */}
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
            <CaretButton label="^" title="Previous product" onClick={() => onIndexChange?.(wrap(index - 1, products.length))} />
            <CaretButton label="v" title="Next product"     onClick={() => onIndexChange?.(wrap(index + 1, products.length))} />
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
