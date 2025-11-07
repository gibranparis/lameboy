// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo } from 'react';

/* --------------------------------- Utils --------------------------------- */

function useTheme() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const read = () =>
      setNight(
        document.documentElement.classList.contains('dark') ||
        document.documentElement.dataset.theme === 'night'
      );
    read();
    const onTheme = (e) => {
      const t = e?.detail?.theme;
      setNight(t === 'night');
    };
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
      obs.disconnect();
    };
  }, []);
  return night;
}

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap  = (i, len) => ((i % len) + len) % len;

/* -------------------------- Inline + size picker ------------------------- */

function PlusSizesInline({ sizes = ['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const toggle = () => setOpen(v => !v);
  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } }));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail: { qty: 1 } }));
    } catch {}
    setTimeout(() => setPicked(null), 360);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button
        type="button"
        className={`pill plus-pill ${open ? 'is-active flash-green' : ''}`}
        onClick={toggle}
        aria-label={open ? 'Close sizes' : 'Choose size'}
        title={open ? 'Close sizes' : 'Choose size'}
      >
        {open ? '–' : '+'}
      </button>

      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pill size-pill ${picked===sz?'is-selected flash-green':''}`}
              onClick={() => pick(sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .pill {
          display:inline-flex; align-items:center; justify-content:center;
          height:28px; min-width:28px; padding:0 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff;
          font-weight:700; letter-spacing:.02em;
          transition:transform .12s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
        }
        .plus-pill.is-active {
          box-shadow: 0 0 10px rgba(34,197,94,.45), 0 0 2px rgba(34,197,94,.6) inset;
          border-color: rgba(34,197,94,.6);
          background: rgba(34,197,94,.08);
        }
        .size-pill.is-selected {
          box-shadow: 0 0 8px rgba(34,197,94,.45), inset 0 0 0 1px rgba(34,197,94,.4);
          border-color: rgba(34,197,94,.55);
        }
        @keyframes flashG { 0%{ filter:brightness(1.8) } 100%{ filter:brightness(1) } }
        .flash-green { animation: flashG .26s ease-out; }
      `}</style>
    </div>
  );
}

/* ------------------------------- Arrow Btn ------------------------------- */

function ArrowBtn({ dir = 'up', night }) {
  const fill  = night ? '#0b0c10' : '#ffffff';
  const ring  = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph = night ? '#ffffff' : '#0f1115';
  return (
    <div
      aria-hidden
      style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'grid', placeItems: 'center',
        background: fill,
        boxShadow: `0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}`,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        {dir === 'up'
          ? <path d="M6 14l6-6 6 6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M6 10l6 6 6-6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    </div>
  );
}

/* ------------------------------- Component ------------------------------- */

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const night = useTheme();
  const product = products[index];
  const imgs = useMemo(() => {
    const list = product?.images?.length ? product.images : [product?.image].filter(Boolean);
    return Array.isArray(list) && list.length ? list : [];
  }, [product]);

  const [imgIdx, setImgIdx] = useState(0);
  const clampedImgIdx = useMemo(
    () => clamp(imgIdx, 0, Math.max(0, imgs.length - 1)),
    [imgIdx, imgs.length]
  );

  // Close overlay via orb zoom
  useEffect(() => {
    const handler = () => onClose?.();
    ['lb:zoom', 'lb:zoom/grid-density'].forEach((n)=>{
      window.addEventListener(n, handler);
      document.addEventListener(n, handler);
    });
    return () => {
      ['lb:zoom', 'lb:zoom/grid-density'].forEach((n)=>{
        window.removeEventListener(n, handler);
        document.removeEventListener(n, handler);
      });
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (imgs.length) {
        if (e.key === 'ArrowRight') return setImgIdx((i) => clamp(i + 1, 0, imgs.length - 1));
        if (e.key === 'ArrowLeft')  return setImgIdx((i) => clamp(i - 1, 0, imgs.length - 1));
      }
      if (products.length > 1) {
        if (e.key === 'ArrowDown') return onIndexChange?.(wrap(index + 1, products.length));
        if (e.key === 'ArrowUp')   return onIndexChange?.(wrap(index - 1, products.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, onClose]);

  // Wheel: horizontal = image, vertical = product (continuous)
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 120) return; // debounce
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay && imgs.length) {
        if (e.deltaX > 0) setImgIdx((i) => clamp(i + 1, 0, imgs.length - 1));
        else setImgIdx((i) => clamp(i - 1, 0, imgs.length - 1));
      } else if (products.length > 1) {
        if (e.deltaY > 0) onIndexChange?.(wrap(index + 1, products.length));
        else              onIndexChange?.(wrap(index - 1, products.length));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  // Touch: horizontal = image, vertical = product (continuous multi-step)
  useEffect(() => {
    let accY = 0, accX = 0, active = false, lastY = 0, lastX = 0;
    const STEP_Y = 48; // px per product change
    const STEP_X = 36; // px per image change

    const onStart = (e) => {
      const t = e.touches?.[0]; if (!t) return;
      active = true; lastY = t.clientY; lastX = t.clientX; accY = 0; accX = 0;
    };
    const onMove = (e) => {
      if (!active) return;
      const t = e.touches?.[0]; if (!t) return;
      const dy = t.clientY - lastY; lastY = t.clientY; accY += dy;
      const dx = t.clientX - lastX; lastX = t.clientX; accX += dx;

      // images (left/right)
      if (imgs.length) {
        while (accX <= -STEP_X) { accX += STEP_X; setImgIdx((i)=>clamp(i+1,0,imgs.length-1)); }
        while (accX >=  STEP_X) { accX -= STEP_X; setImgIdx((i)=>clamp(i-1,0,imgs.length-1)); }
      }
      // products (up/down)
      if (products.length > 1) {
        while (accY <= -STEP_Y) { accY += STEP_Y; onIndexChange?.(wrap(index + 1, products.length)); }
        while (accY >=  STEP_Y) { accY -= STEP_Y; onIndexChange?.(wrap(index - 1, products.length)); }
      }
    };
    const onEnd = () => { active = false; accY = 0; accX = 0; };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    window.addEventListener('touchcancel',onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
      window.removeEventListener('touchcancel',onEnd);
    };
  }, [imgs.length, products.length, index, onIndexChange]);

  // mark overlay open (prevents background scrolling)
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = useMemo(() => {
    if (typeof product.price !== 'number') return String(product.price ?? '');
    const cents = product.price;
    return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
  }, [product.price]);

  const sizes = product.sizes?.length ? product.sizes : ['OS','S','M','L','XL'];

  // close when clicking backdrop (not inner content)
  const overlayRef = useRef(null);
  const onBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <div
      className="product-hero-overlay"
      data-overlay
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} details`}
      onMouseDown={onBackdrop}
      ref={overlayRef}
      style={{ padding: 'max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))' }}
    >
      <div className="product-hero">
        {/* Up/Down controls — LEFT side (safe-area aware) */}
        {products.length > 1 && (
          <div
            style={{
              position:'fixed',
              left: `calc(12px + env(safe-area-inset-left, 0px))`,
              top: '50%',
              transform: 'translateY(-50%)',
              display:'grid', gap:8, zIndex: 110,
            }}
          >
            <button type="button" onClick={() => onIndexChange?.(wrap(index - 1, products.length))} aria-label="Previous product" title="Previous product" style={{ padding:0, background:'transparent', border:'none' }}>
              <ArrowBtn dir="up" night={night} />
            </button>
            <button type="button" onClick={() => onIndexChange?.(wrap(index + 1, products.length))} aria-label="Next product" title="Next product" style={{ padding:0, background:'transparent', border:'none' }}>
              <ArrowBtn dir="down" night={night} />
            </button>
          </div>
        )}

        {/* HERO IMAGE — clamped index */}
        {!!imgs.length && (
          <>
            <Image
              src={imgs[clampedImgIdx]}
              alt={product.title}
              width={2048}
              height={1536}
              className="product-hero-img"
              priority
              fetchPriority="high"
              quality={95}
              sizes="(min-width:1536px) 60vw, (min-width:1024px) 72vw, 92vw"
              style={{
                width:'100%',
                height:'auto',
                maxHeight:'70vh',
                objectFit:'contain',
                imageRendering:'auto',
              }}
            />
            {imgs.length > 1 && (
              <div className="row-nowrap" style={{ gap:8, marginTop:6 }}>
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Image ${i+1}`}
                    className={`pill ${i===clampedImgIdx ? 'size-pill is-selected' : ''}`}
                    onClick={() => setImgIdx(i)}
                    style={{ width:22, height:22, padding:0 }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        <PlusSizesInline sizes={sizes} />
      </div>
    </div>
  );
}
