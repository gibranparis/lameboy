// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* utils */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* arrow with subtle green feedback */
function ArrowControl({ dir='up', night, onClick }) {
  const [active, setActive] = useState(false);
  const fill  = night ? '#0b0c10' : '#ffffff';
  const ring  = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph = night ? '#ffffff' : '#0f1115';

  return (
    <button
      type="button"
      onClick={(e)=>{ setActive(true); setTimeout(()=>setActive(false), 220); onClick?.(e); }}
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
                    (active ? ', 0 0 14px rgba(11,240,95,.35)' : ''),
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

/* + / sizes (solid neon-green on active/selected) */
function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const pick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }}));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail:{ qty:1 } }));
    } catch {}
    setTimeout(()=>setPicked(null), 360);
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

/* ------ DISCRETE SWIPE (slower, intentional) ------ */
/* one product step per deliberate swipe + cooldown */
function useDiscreteSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange }) {
  const st = useRef({
    active:false, startX:0, startY:0, startT:0,
    lastX:0, lastY:0, ay:0, ax:0,
    lastProdStepT:0, lastImgStepT:0
  });

  // Tune these for feel
  const TOUCH_MIN_TRAVEL_Y = 64;   // px finger travel to count as product swipe
  const TOUCH_MIN_TRAVEL_X = 46;   // px travel for image swipe
  const MAX_GESTURE_MS     = 560;  // must finish within this time
  const STEP_COOLDOWN_MS   = 420;  // block repeated triggers
  const WHEEL_THRESHOLD    = 110;  // accumulated wheel delta to step

  const accum = useRef({ x:0, y:0 });

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

    // if user is moving primarily in Y, prevent page scroll
    if (e.cancelable) {
      const p0x = st.current.startX, p0y = st.current.startY;
      const p   = e.touches ? e.touches[0] : e;
      const dx  = p.clientX - p0x;
      const dy  = p.clientY - p0y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) e.preventDefault();
    }

    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - st.current.lastX;
    const dy = p.clientY - st.current.lastY;
    st.current.ax += dx;
    st.current.ay += dy;
    st.current.lastX = p.clientX;
    st.current.lastY = p.clientY;

    const now = performance.now();

    // Horizontal: images (discrete, at most one step per 320ms)
    if (imgsLen > 1) {
      const enoughX = Math.abs(st.current.ax) >= TOUCH_MIN_TRAVEL_X;
      const cooledX = now - st.current.lastImgStepT >= 320;
      if (enoughX && cooledX) {
        setImgIdx(i => clamp(i + (st.current.ax < 0 ? 1 : -1), 0, imgsLen-1));
        st.current.lastImgStepT = now;
        st.current.ax = 0; // reset so we don't chain
      }
    }

    // Vertical: products (discrete + slower)
    if (prodsLen > 1) {
      const travel   = st.current.ay;
      const dt       = now - st.current.startT;
      const enoughY  = Math.abs(travel) >= TOUCH_MIN_TRAVEL_Y && dt <= MAX_GESTURE_MS;
      const cooledY  = now - st.current.lastProdStepT >= STEP_COOLDOWN_MS;

      if (enoughY && cooledY) {
        onIndexChange?.(wrap(index + (travel < 0 ? 1 : -1), prodsLen));
        st.current.lastProdStepT = now;
        st.current.ay = 0;
      }
    }
  }, [imgsLen, prodsLen, index, onIndexChange, setImgIdx]);

  const onUp = useCallback(() => {
    st.current.active = false;
    st.current.ax = 0; st.current.ay = 0;
  }, []);

  // Wheel (desktop / trackpad) — deliberate only
  useEffect(() => {
    const onWheel = (e) => {
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgsLen > 1) {
        accum.current.x += Math.sign(e.deltaX) * Math.min(Math.abs(e.deltaX), 40);
        if (Math.abs(accum.current.x) >= WHEEL_THRESHOLD) {
          setImgIdx(i => clamp(i + (accum.current.x > 0 ? 1 : -1), 0, imgsLen-1));
          accum.current.x = 0;
        }
      } else if (prodsLen > 1) {
        accum.current.y += Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 40);
        if (Math.abs(accum.current.y) >= WHEEL_THRESHOLD && performance.now() - st.current.lastProdStepT >= 280) {
          onIndexChange?.(wrap(index + (accum.current.y > 0 ? 1 : -1), prodsLen));
          st.current.lastProdStepT = performance.now();
          accum.current.y = 0;
        }
      }
      // keep overlay from zipping the page
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

  /* discrete swipe on mobile via Pointer events */
  const swipe = useDiscreteSwipe({
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
        zIndex:480,                              // ↓ LOWER than header(500) so header stays clickable
        display:'grid',
        placeItems:'center',
        background:'rgba(0,0,0,.55)',           // dim backdrop
        overscrollBehavior: 'contain',
        touchAction: 'none',
        cursor:'default',
      }}
      onPointerDown={swipe.onDown}
      onPointerMove={swipe.onMove}
      onPointerUp={swipe.onUp}
      onPointerCancel={swipe.onUp}
      // Backdrop click closes; header is above overlay so won't trigger this.
      onClick={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="product-hero" style={{ pointerEvents:'auto', textAlign:'center' }}>
        {/* left arrows (sticky) */}
        {products.length>1 && (
          <div style={{
            position:'fixed',
            left:`calc(12px + env(safe-area-inset-left,0px))`,
            top:'50%',
            transform:'translateY(-50%)',
            display:'grid',
            gap:8,
            zIndex:520   // above backdrop & image
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

      {/* Styles: solid neon-green active with subtle outer glow */}
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

        .product-hero-overlay :global(.plus-pill) {
          width: 36px; height: 36px; font-size: 18px; line-height: 1;
        }
        .product-hero-overlay :global(.plus-pill.is-active) {
          background: var(--neon); color: var(--pill-fg-strong);
          box-shadow:
            0 0 0 2px rgba(11,240,95,.25),
            0 0 18px rgba(11,240,95,.45),
            0 0 36px rgba(11,240,95,.25);
        }

        .product-hero-overlay :global(.size-pill.is-selected) {
          background: var(--neon); color: var(--pill-fg-strong);
          box-shadow:
            0 0 0 2px rgba(11,240,95,.25),
            0 0 18px rgba(11,240,95,.45),
            0 0 36px rgba(11,240,95,.25);
        }

        .product-hero-overlay :global(.dot-pill) {
          border-radius: 999px; padding: 0; width: 22px; height: 22px;
        }
        .product-hero-overlay :global(.dot-pill.is-active) {
          background: var(--neon); color: var(--pill-fg-strong);
          box-shadow:
            0 0 0 2px rgba(11,240,95,.25),
            0 0 18px rgba(11,240,95,.45),
            0 0 36px rgba(11,240,95,.25);
        }

        /* Hover affordance (desktop only) */
        @media (hover:hover) {
          .product-hero-overlay :global(.pill:hover) {
            transform: translateZ(0) scale(1.02);
          }
        }

        .product-hero-title { margin-top: 10px; font-weight: 800; }
        .product-hero-price { opacity: .85; margin-top: 2px; }
      `}</style>
    </div>
  );
}
