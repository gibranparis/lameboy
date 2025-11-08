// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* utils */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* arrow with green flash */
function ArrowControl({ dir='up', night, onClick }) {
  const [flash, setFlash] = useState(false);
  const fill  = night ? '#0b0c10' : '#ffffff';
  const ring  = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph = night ? '#ffffff' : '#0f1115';

  return (
    <button
      type="button"
      onClick={(e)=>{ setFlash(true); setTimeout(()=>setFlash(false), 280); onClick?.(e); }}
      aria-label={dir==='up'?'Previous product':'Next product'}
      title={dir==='up'?'Previous product':'Next product'}
      className={flash ? 'flash-green' : ''}
      style={{ padding:0, background:'transparent', border:'none' }}
    >
      <div
        aria-hidden
        style={{
          width:28, height:28, borderRadius:'50%',
          display:'grid', placeItems:'center',
          background:fill,
          boxShadow:`0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}`,
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

/* + / sizes */
function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }}));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail:{ qty:1 } }));
    } catch {}
    setTimeout(()=>setPicked(null), 340);
  };
  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button
        type="button"
        className={`pill plus-pill ${open ? 'is-active flash-green' : ''}`}
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
              className={`pill size-pill ${picked===sz?'is-selected flash-green':''}`}
              onClick={()=>pick(sz)}
            >{sz}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* FAST SWIPE (mobile) */
function useFastSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange }) {
  const st = useRef({ active:false, lastX:0, lastY:0, ax:0, ay:0, lastT:0, vx:0, vy:0 });
  const STEP_X = 34, STEP_Y = 40, FLICK_V_BONUS = 0.35;

  const onDown = useCallback((e) => {
    const p = e.touches ? e.touches[0] : e;
    Object.assign(st.current, { active:true, lastX:p.clientX, lastY:p.clientY, ax:0, ay:0, lastT:performance.now(), vx:0, vy:0 });
  }, []);

  const onMove = useCallback((e) => {
    if (!st.current.active) return;
    if (e.cancelable) e.preventDefault();

    const p = e.touches ? e.touches[0] : e;
    const now = performance.now();
    const dt  = Math.max(1, now - st.current.lastT);

    const dx = p.clientX - st.current.lastX;
    const dy = p.clientY - st.current.lastY;

    st.current.vx = dx/dt; st.current.vy = dy/dt;
    st.current.lastX = p.clientX; st.current.lastY = p.clientY; st.current.lastT = now;

    st.current.ax += dx + st.current.vx * FLICK_V_BONUS * 100;
    st.current.ay += dy + st.current.vy * FLICK_V_BONUS * 100;

    if (imgsLen) {
      while (st.current.ax <= -STEP_X) { st.current.ax += STEP_X; setImgIdx(i=>clamp(i+1,0,imgsLen-1)); }
      while (st.current.ax >=  STEP_X) { st.current.ax -= STEP_X; setImgIdx(i=>clamp(i-1,0,imgsLen-1)); }
    }
    if (prodsLen>1) {
      while (st.current.ay <= -STEP_Y) { st.current.ay += STEP_Y; onIndexChange?.(wrap(index+1, prodsLen)); }
      while (st.current.ay >=  STEP_Y) { st.current.ay -= STEP_Y; onIndexChange?.(wrap(index-1, prodsLen)); }
    }
  }, [imgsLen, prodsLen, index, setImgIdx, onIndexChange]);

  const onUp = useCallback(() => { Object.assign(st.current, { active:false, ax:0, ay:0 }); }, []);
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
        if (e.key==='ArrowDown') return onIndexChange?.(wrap(index+1, products.length));
        if (e.key==='ArrowUp')   return onIndexChange?.(wrap(index-1, products.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, onClose]);

  /* wheel (desktop) */
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now(); if (now - lastWheel.current < 90) return; lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgs.length) setImgIdx(i=>clamp(i + (e.deltaX>0?1:-1), 0, imgs.length-1));
      else if (products.length>1) onIndexChange?.(wrap(index + (e.deltaY>0?1:-1), products.length));
    };
    window.addEventListener('wheel', onWheel, { passive:true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  /* fast swipe (mobile) */
  const swipe = useFastSwipe({ imgsLen: imgs.length, prodsLen: products.length, index, setImgIdx, onIndexChange });

  /* overlay flag */
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
    <div
      className="product-hero-overlay"
      data-overlay
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} details`}
      style={{
        position:'fixed', inset:0, zIndex:520,
        display:'grid', placeItems:'center',
        backdropFilter:'blur(0px)',
        background:'rgba(0,0,0,.55)',
        overscrollBehavior: 'contain',
        touchAction: 'none',
      }}
      onPointerDown={swipe.onDown}
      onPointerMove={swipe.onMove}
      onPointerUp={swipe.onUp}
      onPointerCancel={swipe.onUp}
      onClick={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="product-hero" style={{ pointerEvents:'auto', textAlign:'center' }}>
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
                    className={`pill ${i===clampedImgIdx ? 'size-pill is-selected' : ''}`}
                    onClick={()=>setImgIdx(i)}
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

      {/* THEME-AWARE styles (light in day, dark in night) */}
      <style jsx>{`
        :root { --green: #0bf05f; }

        .product-hero-overlay :global(.pill) {
          min-width: 28px; height: 28px; padding: 0 10px;
          border-radius: 999px; border: none;
          display: inline-grid; place-items: center;
          font-weight: 700; font-size: 13px;
          background: ${night ? '#0f1115' : '#ffffff'};
          color: ${night ? '#ffffff' : '#0f1115'};
          box-shadow: inset 0 0 0 1px ${night ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.10)'};
        }
        .product-hero-overlay :global(.plus-pill) {
          width: 36px; height: 36px; font-size: 18px; line-height: 1;
          background: ${night ? '#0f1115' : '#ffffff'};
          color: ${night ? '#ffffff' : '#0f1115'};
        }
        .product-hero-overlay :global(.size-pill) {
          background: ${night ? '#0f1115' : '#ffffff'};
          color: ${night ? '#eaeaea' : '#0f1115'};
        }
        .product-hero-overlay :global(.size-pill.is-selected) {
          outline: 2px solid var(--green);
          color: ${night ? '#ffffff' : '#0f1115'};
        }

        @keyframes lb-flash-green {
          0%   { box-shadow: 0 0 0 0 rgba(11,240,95,0);   transform: translateZ(0) scale(1.0); }
          15%  { box-shadow: 0 0 0 6px rgba(11,240,95,.45); transform: translateZ(0) scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(11,240,95,0);   transform: translateZ(0) scale(1.0); }
        }
        :global(.flash-green) { animation: lb-flash-green .34s ease-out; }

        .product-hero-title { margin-top: 10px; font-weight: 800; }
        .product-hero-price { opacity: .85; margin-top: 2px; }

        @media (prefers-reduced-motion: reduce) {
          :global(.flash-green) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
