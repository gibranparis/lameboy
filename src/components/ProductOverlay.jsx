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

function NavPill({ children, label, onClick, style, pulse=false }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`pill product-hero-nav ${pulse ? 'pulse-soft' : ''}`}
      onClick={onClick}
      style={{
        width: 28, height: 28, padding: 0, lineHeight: 1,
        display:'grid', placeItems:'center',
        position:'absolute',
        ...style,
      }}
    >
      {children}
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
  const multi = products.length > 1;

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  const wrapIndex = useCallback((i, len) => ((i % len) + len) % len, []);
  const gotoProduct = useCallback((d) => {
    if (!multi) return;
    onIndexChange?.(wrapIndex(index + d, products.length));
  }, [index, products.length, onIndexChange, wrapIndex, multi]);

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
      if (multi) {
        if (e.key === 'ArrowDown') return gotoProduct(+1);
        if (e.key === 'ArrowUp')   return gotoProduct(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [multi, gotoProduct, nextImage, prevImage, onClose]);

  // Wheel (infinite loop vertically)
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 160) return;
      lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay) { e.deltaX > 0 ? nextImage() : prevImage(); }
      else if (multi) { e.deltaY > 0 ? gotoProduct(+1) : gotoProduct(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [multi, gotoProduct, nextImage, prevImage]);

  // Touch (mobile) – swipe up/down loops products, left/right images
  const touchStart = useRef({ x:0, y:0, t:0 });
  useEffect(() => {
    const onTouchStart = (e) => {
      const t = e.touches?.[0]; if (!t) return;
      touchStart.current = { x:t.clientX, y:t.clientY, t:performance.now() };
    };
    const onTouchEnd = (e) => {
      const t0 = touchStart.current, tch = e.changedTouches?.[0]; if (!tch) return;
      const dx = tch.clientX - t0.x, dy = tch.clientY - t0.y;
      const ax = Math.abs(dx), ay = Math.abs(dy); const MIN = 28;
      if (ax < MIN && ay < MIN) return;
      if (ay > ax) { if (!multi) return; dy > 0 ? gotoProduct(+1) : gotoProduct(-1); }
      else { dx < 0 ? nextImage() : prevImage(); }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [multi, gotoProduct, nextImage, prevImage]);

  // Mark overlay open (locks page scroll via CSS)
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = typeof product.price === 'number' ? `$${(product.price/100).toFixed(2)}` : String(product.price ?? '');
  const sizes = product.sizes?.length ? product.sizes : ['OS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" data-overlay>
      <div className="product-hero">
        {/* Up/Down cluster (no X button) — tight stack with soft pulse */}
        {multi && (
          <div style={{ position:'absolute', right:16, top:'48%', display:'grid', gap:6 }}>
            <NavPill label="Previous product" onClick={() => gotoProduct(-1)} pulse>^</NavPill>
            <NavPill label="Next product"     onClick={() => gotoProduct(+1)} pulse>v</NavPill>
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
