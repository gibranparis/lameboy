// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* utils */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* arrow with pill look + neon feedback */
function ArrowControl({ dir='up', night, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir==='up'?'Previous product':'Next product'}
      title={dir==='up'?'Previous product':'Next product'}
      className="arrow-pill"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        {dir==='up'
          ? <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M6 10l6 6 6-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
      <style jsx>{`
        .arrow-pill{
          width:28px; height:28px; padding:0; border:0; border-radius:999px;
          display:grid; place-items:center; cursor:pointer;
          background:${night ? '#0f1115' : '#fff'};
          color:${night ? '#fff' : '#0f1115'};
          box-shadow:
            inset 0 0 0 1px ${night ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)'},
            0 2px 10px rgba(0,0,0,.12);
          transition: transform .08s ease, box-shadow .2s ease;
        }
        .arrow-pill:active{
          transform: translateY(.5px);
          box-shadow: 0 0 0 2px rgba(11,240,95,.32), 0 0 16px rgba(11,240,95,.35);
        }
      `}</style>
    </button>
  );
}

/* size chooser — smaller plus button (28px) */
function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }}));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail:{ qty:1 } }));
    } catch {}
    setTimeout(()=>setPicked(null), 280);
  };
  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button
        type="button"
        className={`pill plus-pill ${open ? 'is-active' : ''}`}
        onClick={()=>setOpen(v=>!v)}
        aria-label={open?'Close sizes':'Choose size'}
        title={open?'Close sizes':'Choose size'}
        style={{ width:28, height:28, fontSize:16, lineHeight:1 }}
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

/* ------- tempered swipe (multiple steps allowed, but never lightning-fast) ------- */
function useTemperedSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange }) {
  const st = useRef({
    active:false, startX:0, startY:0, lastX:0, lastY:0, startT:0,
    ax:0, ay:0, wheelX:0, wheelY:0, lastProdStep:0, lastImgStep:0
  });

  // Feel tuning: let multiple steps through, but throttle
  const STEP_Y_PX       = 56;  // distance per product step
  const STEP_X_PX       = 42;  // distance per image step
  const PROD_MIN_MS     = 180; // min time between product steps
  const IMG_MIN_MS      = 140; // min time between image steps
  const WHEEL_THRESH    = 120;

  const onDown = useCallback((e) => {
    const p = e.touches ? e.touches[0] : e;
    st.current.active = true;
    st.current.startX = st.current.lastX = p.clientX;
    st.current.startY = st.current.lastY = p.clientY;
    st.current.startT = performance.now();
    st.current.ax = st.current.ay = 0;
  }, []);

  const onMove = useCallback((e) => {
    if (!st.current.active) return;

    // prevent page scroll if the gesture is vertical-dominant
    if (e.cancelable) {
      const dx0 = (e.touches?.[0]?.clientX ?? st.current.lastX) - st.current.startX;
      const dy0 = (e.touches?.[0]?.clientY ?? st.current.lastY) - st.current.startY;
      if (Math.abs(dy0) > Math.abs(dx0) && Math.abs(dy0) > 8) e.preventDefault();
    }

    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - st.current.lastX;
    const dy = p.clientY - st.current.lastY;
    st.current.ax += dx;
    st.current.ay += dy;
    st.current.lastX = p.clientX;
    st.current.lastY = p.clientY;

    const now = performance.now();

    // Horizontal: images
    if (imgsLen > 1) {
      while (Math.abs(st.current.ax) >= STEP_X_PX && now - st.current.lastImgStep >= IMG_MIN_MS) {
        const dir = st.current.ax < 0 ? 1 : -1;
        setImgIdx(i => clamp(i + dir, 0, imgsLen - 1));
        st.current.lastImgStep = now;
        st.current.ax += dir * STEP_X_PX; // reduce accumulator
      }
    }

    // Vertical: products
    if (prodsLen > 1) {
      while (Math.abs(st.current.ay) >= STEP_Y_PX && now - st.current.lastProdStep >= PROD_MIN_MS) {
        const dir = st.current.ay < 0 ? 1 : -1; // swipe up -> next
        onIndexChange?.(wrap(index + dir, prodsLen));
        st.current.lastProdStep = now;
        st.current.ay += dir * STEP_Y_PX;
      }
    }
  }, [imgsLen, prodsLen, index, onIndexChange, setImgIdx]);

  const onUp = useCallback(() => { st.current.active = false; }, []);

  // Wheel/trackpad
  useEffect(() => {
    const onWheel = (e) => {
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      const now = performance.now();
      if (ax > ay && imgsLen > 1) {
        st.current.wheelX += Math.sign(e.deltaX) * Math.min(Math.abs(e.deltaX), 40);
        if (Math.abs(st.current.wheelX) >= WHEEL_THRESH && now - st.current.lastImgStep >= IMG_MIN_MS) {
          setImgIdx(i => clamp(i + (st.current.wheelX > 0 ? 1 : -1), 0, imgsLen-1));
          st.current.wheelX = 0; st.current.lastImgStep = now;
        }
      } else if (prodsLen > 1) {
        st.current.wheelY += Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 40);
        if (Math.abs(st.current.wheelY) >= WHEEL_THRESH && now - st.current.lastProdStep >= PROD_MIN_MS) {
          onIndexChange?.(wrap(index + (st.current.wheelY > 0 ? 1 : -1), prodsLen));
          st.current.wheelY = 0; st.current.lastProdStep = now;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive:false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgsLen, prodsLen, index, onIndexChange, setImgIdx]);

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

  /* tempered swipe */
  const swipe = useTemperedSwipe({
    imgsLen: imgs.length,
    prodsLen: products.length,
    index,
    setImgIdx,
    onIndexChange,
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
    <div
      className="product-hero-overlay"
      data-overlay
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} details`}
      style={{
        position:'fixed',
        inset:0,
        zIndex:480,                           // keep header clickable
        display:'grid',
        placeItems:'center',
        background:'rgba(0,0,0,.55)',
        overscrollBehavior:'contain',
        touchAction:'none',
        cursor:'default',
      }}
      onPointerDown={swipe.onDown}
      onPointerMove={swipe.onMove}
      onPointerUp={swipe.onUp}
      onPointerCancel={swipe.onUp}
      onClick={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="product-hero" style={{ pointerEvents:'auto', textAlign:'center' }}>
        {/* left arrows */}
        {products.length>1 && (
          <div style={{
            position:'fixed',
            left:`calc(12px + env(safe-area-inset-left,0px))`,
            top:'50%',
            transform:'translateY(-50%)',
            display:'grid',
            gap:8,
            zIndex:520
          }}>
            <ArrowControl dir="up"   night={night} onClick={()=>onIndexChange?.(wrap(index-1, products.length))} />
            <ArrowControl dir="down" night={night} onClick={()=>onIndexChange?.(wrap(index+1, products.length))} />
          </div>
        )}

        {/* main image */}
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
              draggable={false}
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
                    style={{ width:20, height:20, padding:0 }}
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

      {/* pills + neon behaviors kept consistent */}
      <style jsx>{`
        :root { --neon: #0bf05f; --pill-bg: #0f1115; --pill-fg: #eaeaea; --pill-fg-strong: #0b0c10; }

        .product-hero-overlay :global(.pill) {
          min-width: 28px; height: 28px; padding: 0 10px;
          border-radius: 999px; border: none;
          display: inline-grid; place-items: center;
          font-weight: 700; font-size: 13px;
          background: var(--pill-bg); color: var(--pill-fg);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
          transition: background .14s ease, color .14s ease, box-shadow .14s ease, transform .06s ease;
        }
        .product-hero-overlay :global(.size-pill.is-selected),
        .product-hero-overlay :global(.plus-pill.is-active),
        .product-hero-overlay :global(.dot-pill.is-active) {
          background: var(--neon); color: var(--pill-fg-strong);
          box-shadow: 0 0 0 2px rgba(11,240,95,.25), 0 0 18px rgba(11,240,95,.40);
        }
        .product-hero-overlay :global(.dot-pill){ border-radius:999px; padding:0; }
      `}</style>
    </div>
  );
}
