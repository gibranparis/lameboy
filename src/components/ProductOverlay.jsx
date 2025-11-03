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

function NavPill({ label, rotate180=false, onClick, pulse=false }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`pill product-hero-nav ${pulse ? 'pulse-soft' : ''}`}
      onClick={onClick}
      style={{
        width: 28, height: 28, padding: 0, lineHeight: 1,
        display:'grid', placeItems:'center',
        transform: rotate180 ? 'rotate(180deg)' : 'none'
      }}
    >
      {/* Always the caret ^ ; down is rotated version */}
      ^
      <style jsx global>{`
        @keyframes lbPulseSoft {
          0%   { box-shadow: 0 0 0 0 rgba(50,255,199,0.22); }
          70%  { box-shadow: 0 0 0 8px rgba(50,255,199,0.00); }
          100% { box-shadow: 0 0 0 0 rgba(50,255,199,0.00); }
        }
        .pulse-soft { animation: lbPulseSoft 1.8s ease-out infinite; }
      `}</style>
    </button>
  );
}

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  const wrap = useCallback((i, n) => ((i % n) + n) % n, []);
  const goto = useCallback((d) => {
    if (!products?.length) return;
    onIndexChange?.(wrap(index + d, products.length));
  }, [index, products, onIndexChange, wrap]);

  const nextImage = useCallback(() => setImgIdx((i) => Math.min(i + 1, imgs.length - 1)), [imgs.length]);
  const prevImage = useCallback(() => setImgIdx((i) => Math.max(i - 1, 0)), [imgs.length]);

  // Close via orb zoom
  useEffect(() => {
    const handler = () => onClose?.();
    const names = ['lb:zoom', 'lb:zoom/grid-density'];
    names.forEach((n) => { window.addEventListener(n, handler); document.addEventListener(n, handler); });
    return () => names.forEach((n) => { window.removeEventListener(n, handler); document.removeEventListener(n, handler); });
  }, [onClose]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return nextImage();
      if (e.key === 'ArrowLeft')  return prevImage();
      if (e.key === 'ArrowDown')  return goto(+1);
      if (e.key === 'ArrowUp')    return goto(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goto, nextImage, prevImage, onClose]);

  // Wheel loop
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 160) return;
      lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay) { e.deltaX > 0 ? nextImage() : prevImage(); }
      else         { e.deltaY > 0 ? goto(+1) : goto(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [goto, nextImage, prevImage]);

  // Touch swipe
  const t0 = useRef({ x:0, y:0 });
  useEffect(() => {
    const start = (e) => { const t = e.touches?.[0]; if (t) t0.current = { x:t.clientX, y:t.clientY }; };
    const end = (e) => {
      const t = e.changedTouches?.[0]; if (!t) return;
      const dx = t.clientX - t0.current.x, dy = t.clientY - t0.current.y;
      const ax = Math.abs(dx), ay = Math.abs(dy), MIN = 28;
      if (ax < MIN && ay < MIN) return;
      if (ay > ax) { dy > 0 ? goto(+1) : goto(-1); } else { dx < 0 ? nextImage() : prevImage(); }
    };
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => { document.removeEventListener('touchstart', start); document.removeEventListener('touchend', end); };
  }, [goto, nextImage, prevImage]);

  // mark overlay open
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
        {/* caret cluster centered on right edge */}
        <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', display:'grid', gap:6 }}>
          <NavPill label="Previous product" onClick={() => goto(-1)} pulse />
          <NavPill label="Next product" rotate180 onClick={() => goto(+1)} pulse />
        </div>

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
