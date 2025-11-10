'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* utils */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap  = (i, len) => ((i % len) + len) % len;

/* arrow with subtle green feedback */
function ArrowControl({ dir='up', night, onClick }) {
  const [active, setActive] = useState(false);
  const fill  = night ? '#0b0c10' : '#ffffff';
  const ring  = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph = night ? '#ffffff' : '#0f1115';

  return (
    <button
      type="button"
      onClick={(e)=>{ setActive(true); setTimeout(()=>setActive(false), 200); onClick?.(e); }}
      aria-label={dir==='up'?'Previous product':'Next product'}
      title={dir==='up'?'Previous product':'Next product'}
      style={{ padding:0, background:'transparent', border:'none' }}
    >
      <div
        aria-hidden
        style={{
          width:28, height:28, borderRadius:'50%',
          display:'grid', placeItems:'center',
          background:fill,
          boxShadow:`0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}` +
                    (active ? ', 0 0 10px rgba(11,240,95,.26)' : ''),
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          {dir==='up'
            ? <path d="M6 14l6-6 6 6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M6 10l6 6 6-6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </div>
    </button>
  );
}

/* + / sizes (compact gray; solid green when active/selected; no outer glow) */
function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }}));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail:{ qty:1 } }));
    } catch {}
    setTimeout(()=>setPicked(null), 320);
  };
  return (
    <div style={{ display:'grid', justifyItems:'center', gap:12 }}>
      <button
        type="button"
        className={`pill plus-pill ${open ? 'is-active' : ''}`}
        onClick={()=>setOpen(v=>!v)}
        aria-label={open?'Close sizes':'Choose size'}
        title={open?'Close sizes':'Choose size'}
      >
        {open ? '–' : '+'}
      </button>

      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz)=>(
            <button
              key={sz}
              type="button"
              className={`pill size-pill ${picked===sz?'is-selected':''}`}
              onClick={()=>pick(sz)}
            >{sz}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------ SWIPE ENGINE (mobile): slower + deliberate ------ */
function useSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange }) {
  const state = useRef({ active:false, lastX:0, lastY:0, ax:0, ay:0, lastT:0, vx:0, vy:0 });

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;

  const STEP_X = coarse ? 90 : 50;   // px per image step
  const STEP_Y = coarse ? 120 : 70;  // px per product step
  const FLICK_V_BONUS = coarse ? 0.2 : 0.35;

  const onDown = useCallback((e) => {
    const p = e.touches ? e.touches[0] : e;
    state.current.active = true;
    state.current.lastX = p.clientX;
    state.current.lastY = p.clientY;
    state.current.ax = 0; state.current.ay = 0;
    state.current.lastT = performance.now();
    state.current.vx = 0; state.current.vy = 0;
  }, []);

  const onMove = useCallback((e) => {
    if (!state.current.active) return;
    if (e.cancelable) e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const now = performance.now();
    const dt  = Math.max(1, now - state.current.lastT);
    const dx = p.clientX - state.current.lastX;
    const dy = p.clientY - state.current.lastY;
    state.current.vx = dx / dt;
    state.current.vy = dy / dt;
    state.current.lastX = p.clientX;
    state.current.lastY = p.clientY;
    state.current.lastT = now;
    state.current.ax += dx + state.current.vx * FLICK_V_BONUS * 80;
    state.current.ay += dy + state.current.vy * FLICK_V_BONUS * 80;

    if (imgsLen) {
      while (state.current.ax <= -STEP_X) { state.current.ax += STEP_X; setImgIdx(i => clamp(i+1, 0, imgsLen-1)); }
      while (state.current.ax >=  STEP_X) { state.current.ax -= STEP_X; setImgIdx(i => clamp(i-1, 0, imgsLen-1)); }
    }
    if (prodsLen > 1) {
      while (state.current.ay <= -STEP_Y) { state.current.ay += STEP_Y; onIndexChange?.(wrap(index+1, prodsLen)); }
      while (state.current.ay >=  STEP_Y) { state.current.ay -= STEP_Y; onIndexChange?.(wrap(index-1, prodsLen)); }
    }
  }, [imgsLen, prodsLen, index, setImgIdx, onIndexChange]);

  const onUp = useCallback(() => {
    state.current.active = false;
    state.current.ax = 0; state.current.ay = 0;
  }, []);

  return { onDown, onMove, onUp };
}

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const night =
    typeof document !== 'undefined' &&
    (document.documentElement.dataset.theme === 'night' ||
     document.documentElement.classList.contains('dark'));

  const product = products[index];
  const imgs = useMemo(() => {
    const list = product?.images?.length ? product.images : [product?.image].filter(Boolean);
    return Array.isArray(list) ? list : [];
  }, [product]);

  const [imgIdx, setImgIdx] = useState(0);
  const clampedImgIdx = useMemo(() => clamp(imgIdx, 0, Math.max(0, imgs.length - 1)), [imgIdx, imgs.length]);

  // Close when orb zooms
  useEffect(() => {
    const h = () => onClose?.();
    ['lb:zoom','lb:zoom/grid-density'].forEach(n => {
      window.addEventListener(n, h); document.addEventListener(n, h);
    });
    return () => ['lb:zoom','lb:zoom/grid-density'].forEach(n => {
      window.removeEventListener(n, h); document.removeEventListener(n, h);
    });
  }, [onClose]);

  // Keys
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (imgs.length) {
        if (e.key === 'ArrowRight') return setImgIdx(i => clamp(i + 1, 0, imgs.length - 1));
        if (e.key === 'ArrowLeft')  return setImgIdx(i => clamp(i - 1, 0, imgs.length - 1));
      }
      if (products.length > 1) {
        if (e.key === 'ArrowDown') return onIndexChange?.(wrap(index + 1, products.length));
        if (e.key === 'ArrowUp')   return onIndexChange?.(wrap(index - 1, products.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, onClose]);

  // Wheel (desktop)
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now(); if (now - lastWheel.current < 110) return; lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgs.length) setImgIdx(i => clamp(i + (e.deltaX > 0 ? 1 : -1), 0, imgs.length - 1));
      else if (products.length > 1) onIndexChange?.(wrap(index + (e.deltaY > 0 ? 1 : -1), products.length));
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  // Swipe
  const swipe = useSwipe({ imgsLen: imgs.length, prodsLen: products.length, index, setImgIdx, onIndexChange });

  // Overlay flag
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = useMemo(() => {
    if (typeof product.price !== 'number') return String(product.price ?? '');
    const c = product.price; return c % 100 === 0 ? `$${c / 100}` : `$${(c / 100).toFixed(2)}`;
  }, [product.price]);

  const sizes = product.sizes?.length ? product.sizes : ['OS', 'S', 'M', 'L', 'XL'];

  return (
    <>
      {/* Root overlay keeps header clickable and avoids “page-wide gray wash” */}
      <div
        className="product-hero-overlay"
        data-overlay
        role="dialog"
        aria-modal="true"
        aria-label={`${product.title} details`}
        style={{
          position: 'fixed', inset: 0, zIndex: 520,
          display: 'grid', placeItems: 'center',
          background: 'transparent',
          pointerEvents: 'none',
          overscrollBehavior: 'contain',
          touchAction: 'none',
          cursor: 'default',
        }}
        onPointerDown={swipe.onDown}
        onPointerMove={swipe.onMove}
        onPointerUp={swipe.onUp}
        onPointerCancel={swipe.onUp}
      >
        {/* Backdrop — subtle + only below header */}
        <div
          onClick={(e)=>{ e.stopPropagation(); onClose?.(); }}
          style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0, top: 'var(--header-ctrl,56px)',
            background: 'rgba(0,0,0,.18)', // toned WAY down
            pointerEvents: 'auto',
          }}
        />

        {/* Content */}
        <div className="product-hero" style={{ pointerEvents: 'auto', textAlign: 'center', zIndex: 521 }}>
          {products.length>1 && (
            <div style={{ position:'fixed', left:`calc(12px + env(safe-area-inset-left,0px))`, top:'50%', transform:'translateY(-50%)', display:'grid', gap:8, zIndex:110 }}>
              <ArrowControl dir="up"   night={night} onClick={()=>onIndexChange?.(wrap(index-1, products.length))} />
              <ArrowControl dir="down" night={night} onClick={()=>onIndexChange?.(wrap(index+1, products.length))} />
            </div>
          )}

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
                style={{ width:'100%', height:'auto', maxHeight:'70vh', objectFit:'contain', imageRendering:'auto' }}
              />
              {imgs.length>1 && (
                <div className="row-nowrap" style={{ gap:8, marginTop:6, justifyContent:'center', display:'flex' }}>
                  {imgs.map((_,i)=>(
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i+1}`}
                      className={`pill dot-pill ${i===clampedImgIdx ? 'is-active' : ''}`}
                      onClick={()=>setImgIdx(i)}
                      style={{ width:18, height:18, padding:0 }}
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

      {/* Pills: compact + solid green when active; no outer glow */}
      <style jsx>{`
        :root { --neon: #0bf05f; --pill-bg: #ececec; --pill-fg: #111; --pill-bg-night:#111; --pill-fg-night:#fff; }

        .product-hero-overlay :global(.pill) {
          min-width: 26px; height: 26px; padding: 0 10px;
          border-radius: 999px; border: none;
          display: inline-grid; place-items: center;
          font-weight: 800; font-size: 12px;
          background: var(--pill-bg); color: var(--pill-fg);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
          transition: background .14s ease, color .14s ease, transform .06s ease;
        }
        :global(:root[data-theme="night"]) .product-hero-overlay :global(.pill){
          background: var(--pill-bg-night); color: var(--pill-fg-night);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
        }
        .product-hero-overlay :global(.plus-pill){ width:32px; height:32px; font-size:18px; line-height:1; }
        .product-hero-overlay :global(.plus-pill.is-active),
        .product-hero-overlay :global(.plus-pill.is-ready){
          background: var(--neon); color:#000; box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
        }
        .product-hero-overlay :global(.size-pill.is-selected){
          background: var(--neon); color:#000; box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
        }
        .product-hero-overlay :global(.dot-pill){
          border-radius:999px; padding:0; width:18px; height:18px;
        }
        .product-hero-overlay :global(.dot-pill.is-active){
          background: var(--neon); color:#000; box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
        }
        @media (hover:hover){ .product-hero-overlay :global(.pill:hover){ transform: scale(1.02); } }
        .product-hero-title{ margin-top:10px; font-weight:800; }
        .product-hero-price{ opacity:.85; margin-top:2px; }
      `}</style>
    </>
  );
}
