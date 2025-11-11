// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* --------------------------------- Utils --------------------------------- */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* small helper: one–shot “flash” class toggler */
function flash(el, klass='is-hot', ms=220){
  if (!el) return;
  el.classList.remove(klass);
  // reflow to restart animation
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.classList.add(klass);
  window.setTimeout(()=>el.classList.remove(klass), ms);
}

/* ---------------------------- Arrow controller --------------------------- */
function ArrowControl({ dir='up', night, onClick, dataUi }) {
  const baseBg = night ? '#0b0c10' : '#ffffff';
  const ring   = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph  = night ? '#ffffff' : '#0f1115';

  return (
    <button
      type="button"
      onClick={onClick}
      data-ui={dataUi}
      className="arrow-pill"
      aria-label={dir==='up'?'Previous product':'Next product'}
      title={dir==='up'?'Previous product':'Next product'}
      style={{ padding:0, background:'transparent', border:'none' }}
    >
      <div
        aria-hidden
        style={{
          width:28, height:28, borderRadius:'50%',
          display:'grid', placeItems:'center',
          background: baseBg,
          boxShadow:`0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}`,
          transition:'background .12s ease',
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

/* -------------------------- Sizes + (+/–) toggle ------------------------- */
/* Behavior:
   - Default: shows "+" (neutral)
   - Click "+": sizes open, icon becomes "–"
   - Click size: closes sizes, pulses + in green for ~600ms, dispatches lb:add-to-cart
*/
function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef(null);

  const onToggle = () => {
    // prevent immediate re-open while confirmation pulse is active
    if (confirming) return;
    setOpen(v => !v);
  };

  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }}));
    } catch {}
    // collapse + pulse green for satisfaction
    setOpen(false);
    setConfirming(true);
    // clear any prior timer
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = window.setTimeout(() => {
      setConfirming(false);
    }, 640); // a hair over 600ms feels better with CSS ease
  };

  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  const glyph = open ? '–' : '+';

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:12 }}>
      <button
        type="button"
        data-ui="size-toggle"
        className={`pill plus-pill ${open ? 'is-ready' : ''} ${confirming ? 'is-confirmed' : ''}`}
        onClick={onToggle}
        aria-label={open?'Close sizes':'Choose size'}
        title={open?'Close sizes':'Choose size'}
      >
        {glyph}
      </button>

      {/* Keep panel in DOM for smooth height animation; control via [hidden] + max-height */}
      <div
        className={`row-nowrap size-panel ${open ? 'is-open' : ''}`}
        data-ui="size-panel"
        hidden={!open}
        style={{ gap:8 }}
      >
        {sizes.map((sz)=>(
          <button
            key={sz}
            type="button"
            className={`pill size-pill ${picked===sz?'is-selected':''}`}
            data-size={sz}
            onClick={()=>pick(sz)}
            aria-label={`Size ${sz}`}
            title={`Size ${sz}`}
          >{sz}</button>
        ))}
      </div>
    </div>
  );
}

/* ------ SWIPE ENGINE (mobile) : slower + more deliberate ------ */
function useSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash }) {
  const state = useRef({
    active:false, lastX:0, lastY:0, ax:0, ay:0, lastT:0, vx:0, vy:0,
  });

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;

  const STEP_X = coarse ? 90 : 50;
  const STEP_Y = coarse ? 120 : 70;
  const FLICK_V_BONUS = coarse ? 0.2 : 0.35;

  const onDown = useCallback((e) => {
    const p = e.touches ? e.touches[0] : e;
    state.current.active = true;
    state.current.lastX  = p.clientX;
    state.current.lastY  = p.clientY;
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
    if (prodsLen>1) {
      while (state.current.ay <= -STEP_Y) { state.current.ay += STEP_Y; onIndexChange?.(wrap(index+1, prodsLen)); onDirFlash?.('down'); }
      while (state.current.ay >=  STEP_Y) { state.current.ay -= STEP_Y; onIndexChange?.(wrap(index-1, prodsLen)); onDirFlash?.('up'); }
    }
  }, [imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash]);

  const onUp = useCallback(() => {
    state.current.active = false;
    state.current.ax = 0; state.current.ay = 0;
  }, []);

  return { onDown, onMove, onUp };
}

/* -------------------------------- Component ------------------------------ */
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
  const clampedImgIdx = useMemo(()=>clamp(imgIdx, 0, Math.max(0, imgs.length-1)), [imgIdx, imgs.length]);

  /* close on orb zoom */
  useEffect(() => {
    const h = () => onClose?.();
    ['lb:zoom','lb:zoom/grid-density'].forEach(n=>{
      window.addEventListener(n,h); document.addEventListener(n,h);
    });
    return () => ['lb:zoom','lb:zoom/grid-density'].forEach(n=>{
      window.removeEventListener(n,h); document.removeEventListener(n,h);
    });
  }, [onClose]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key==='Escape') return onClose?.();
      if (imgs.length) {
        if (e.key==='ArrowRight') return setImgIdx(i=>clamp(i+1,0,imgs.length-1));
        if (e.key==='ArrowLeft')  return setImgIdx(i=>clamp(i-1,0,imgs.length-1));
      }
      if (products.length>1) {
        if (e.key==='ArrowDown'){ document.querySelector('[data-ui="img-down"]') && flash(document.querySelector('[data-ui="img-down"]')); return onIndexChange?.(wrap(index+1, products.length)); }
        if (e.key==='ArrowUp'){   document.querySelector('[data-ui="img-up"]') && flash(document.querySelector('[data-ui="img-up"]'));   return onIndexChange?.(wrap(index-1, products.length)); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, onClose]);

  /* wheel (desktop) — flash arrows according to scroll dir */
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now(); if (now - lastWheel.current < 110) return; lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgs.length) setImgIdx(i=>clamp(i + (e.deltaX>0?1:-1), 0, imgs.length-1));
      else if (products.length>1) {
        const dirDown = e.deltaY>0;
        flash(document.querySelector(dirDown ? '[data-ui="img-down"]' : '[data-ui="img-up"]'));
        onIndexChange?.(wrap(index + (dirDown?1:-1), products.length));
      }
    };
    window.addEventListener('wheel', onWheel, { passive:true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  const onDirFlash = useCallback((dir)=> {
    flash(document.querySelector(dir==='down' ? '[data-ui="img-down"]' : '[data-ui="img-up"]'));
  }, []);

  /* swipe */
  const swipe = useSwipe({
    imgsLen: imgs.length,
    prodsLen: products.length,
    index,
    setImgIdx,
    onIndexChange,
    onDirFlash,
  });

  /* overlay flag for page styles */
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open','1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = useMemo(() => {
    if (typeof product.price !== 'number') return String(product.price ?? '');
    const c = product.price; return c%100===0 ? `$${c/100}` : `$${(c/100).toFixed(2)}`;
  }, [product.price]);

  const sizes = product.sizes?.length ? product.sizes : ['OS','S','M','L','XL'];

  return (
    <>
      <div
        className="product-hero-overlay"
        data-overlay
        role="dialog"
        aria-modal="true"
        aria-label={`${product.title} details`}
        style={{
          position:'fixed', inset:0, zIndex:520,
          display:'grid', placeItems:'center',
          background:'transparent',
          pointerEvents:'none',
          overscrollBehavior:'contain',
          touchAction:'none',
          cursor:'default',
        }}
        onPointerDown={swipe.onDown}
        onPointerMove={swipe.onMove}
        onPointerUp={swipe.onUp}
        onPointerCancel={swipe.onUp}
      >
        {/* transparent click-catcher (no visual dim) */}
        <div
          onClick={(e)=>{ e.stopPropagation(); onClose?.(); }}
          style={{
            position:'fixed',
            left:0, right:0, bottom:0, top:'var(--header-ctrl,64px)',
            background:'transparent',
            pointerEvents:'auto',
          }}
        />

        {/* content */}
        <div className="product-hero" style={{ pointerEvents:'auto', textAlign:'center', zIndex:521 }}>
          {/* left arrows */}
          {products.length>1 && (
            <div style={{ position:'fixed', left:`calc(12px + env(safe-area-inset-left,0px))`, top:'50%', transform:'translateY(-50%)', display:'grid', gap:8, zIndex:110 }}>
              <ArrowControl dir="up"   night={night} dataUi="img-up"   onClick={()=>{ onIndexChange?.(wrap(index-1, products.length)); onDirFlash('up'); }} />
              <ArrowControl dir="down" night={night} dataUi="img-down" onClick={()=>{ onIndexChange?.(wrap(index+1, products.length)); onDirFlash('down'); }} />
            </div>
          )}

          {/* main image */}
          {!!imgs.length && (
            <>
              <div data-ui="product-viewport" style={{ width:'100%' }}>
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
              </div>
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

      {/* local styles for pills/arrow flash */}
      <style jsx>{`
        :root{
          --neon: var(--hover-green, #0bf05f);
          --pill-bg: var(--panel, #1e1e1e);
          --pill-fg: var(--text, #ffffff);
          --pill-ring: rgba(255,255,255,.12);
          --pill-bg-day: #ffffff;
          --pill-fg-day: #0f1115;
          --pill-ring-day: rgba(0,0,0,.08);
        }

        .arrow-pill.is-hot > div{
          background: var(--neon) !important;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.18), 0 2px 10px rgba(0,0,0,.12);
        }

        /* --- pills --- */
        .pill{
          font: 600 13px/1 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;
          letter-spacing:.2px;
          padding:10px 14px;
          border-radius:999px;
          border:none;
          cursor:pointer;
          transition: transform .18s ease, box-shadow .18s ease, color .2s ease, background .2s ease;
          user-select:none;
          outline:none;
        }

        .plus-pill{
          min-width:42px; height:42px; display:grid; place-items:center;
          background: var(--pill-bg);
          color: var(--pill-fg);
          box-shadow: 0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px var(--pill-ring);
        }
        /* open state: calm emphasis */
        .plus-pill.is-ready{
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0,0,0,.18), inset 0 0 0 1px var(--pill-ring);
        }
        /* confirmation pulse (keeps the '+' glyph) */
        .plus-pill.is-confirmed{
          color: var(--neon);
          transform: scale(1.12);
          box-shadow:
            0 0 0 0 rgba(11,240,95,.42),
            inset 0 0 0 1px rgba(11,240,95,.55);
          animation: lbPulse 640ms ease;
        }
        @keyframes lbPulse{
          0%   { box-shadow: 0 0 0 0 rgba(11,240,95,.42), inset 0 0 0 1px rgba(11,240,95,.55); }
          70%  { box-shadow: 0 0 0 10px rgba(11,240,95,0), inset 0 0 0 1px rgba(11,240,95,.35); }
          100% { box-shadow: 0 0 0 12px rgba(11,240,95,0), inset 0 0 0 1px rgba(11,240,95,.2); }
        }

        .size-panel{
          overflow:hidden;
          max-height:0;
          transition:max-height .28s ease;
          display:flex;
          flex-wrap:nowrap;
          justify-content:center;
        }
        .size-panel.is-open{
          max-height:68px; /* enough for one row of pills */
        }

        .size-pill{
          background: var(--pill-bg);
          color: var(--pill-fg);
          box-shadow: 0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px var(--pill-ring);
          min-width:42px;
        }
        .size-pill:hover{ transform: translateY(-1px); }
        .size-pill.is-selected{
          color: var(--neon);
          box-shadow: 0 0 0 0 rgba(11,240,95,.12), inset 0 0 0 1px rgba(11,240,95,.5);
        }

        /* Dots */
        .dot-pill{
          border-radius:50%;
          background: var(--pill-bg);
          box-shadow: inset 0 0 0 1px var(--pill-ring);
        }
        .dot-pill.is-active{
          background: var(--neon);
          box-shadow: inset 0 0 0 0 rgba(0,0,0,0);
        }
      `}</style>
    </>
  );
}
