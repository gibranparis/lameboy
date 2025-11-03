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

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  // Close overlay via orb zoom event
  useEffect(() => {
    const handler = () => onClose?.();
    const names = ['lb:zoom', 'lb:zoom/grid-density'];
    names.forEach((n) => document.addEventListener(n, handler));
    return () => names.forEach((n) => document.removeEventListener(n, handler));
  }, [onClose]);

  // Keyboard (wrap around infinitely)
  const N = products.length;
  const wrap = (i) => (i + N) % N;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === 'ArrowLeft')  return setImgIdx((i) => Math.max(i - 1, 0));
      if (N > 1) {
        if (e.key === 'ArrowDown') return onIndexChange?.(wrap(index + 1));
        if (e.key === 'ArrowUp')   return onIndexChange?.(wrap(index - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, N, index, onIndexChange, onClose]);

  // Wheel: wrap infinitely; mobile scroll fix (passive true is OK here)
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 200) return;
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
        else setImgIdx((i) => Math.max(i - 1, 0));
      } else if (N > 1) {
        if (e.deltaY > 0) onIndexChange?.(wrap(index + 1));
        else              onIndexChange?.(wrap(index - 1));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, N, index, onIndexChange]);

  // mark overlay open (locks page scroll via CSS)
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
        {/* Up/Down controls (caret style, perfectly centered) */}
        {N > 1 && (
          <div style={{
            position:'fixed', right:'24px', top:'calc(50vh - 28px)',
            display:'grid', gap:'8px', zIndex:1000
          }}>
            <button
              type="button"
              aria-label="Prev product"
              onClick={() => onIndexChange?.(wrap(index - 1))}
              className="pill"
              style={caretBtnStyle}
            >
              <span style={caretSymbol}>^</span>
            </button>
            <button
              type="button"
              aria-label="Next product"
              onClick={() => onIndexChange?.(wrap(index + 1))}
              className="pill"
              style={caretBtnStyle}
            >
              <span style={caretSymbol}>v</span>
            </button>
          </div>
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

const caretBtnStyle = {
  width: 28, height: 28, padding: 0,
  display: 'grid', placeItems: 'center',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontWeight: 800, fontSize: 16, lineHeight: '1',
};

const caretSymbol = {
  display: 'grid', placeItems: 'center',
  transform: 'translateY(-1px)', // micro-optical centering
};
