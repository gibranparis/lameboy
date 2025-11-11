// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';

const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* Force (+) pill to solid green briefly regardless of CSS cascade */
function pulsePlusEl(el){
  if (!el) return;
  // inline styles beat any stylesheet collisions
  const on = ()=> {
    el.classList.add('pulse-green','is-ready');
    el.style.background = 'var(--hover-green)';
    el.style.color = '#000';
    el.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.18)';
  };
  const off = ()=>{
    el.classList.remove('is-ready');
    if (el.textContent.trim() === '+') el.classList.remove('is-active');
    el.classList.remove('pulse-green');
    el.style.background = '';
    el.style.color = '';
    el.style.boxShadow = '';
  };
  on();
  setTimeout(off, 260);
}

/* ---------------------------- ArrowControl ----------------------------- */
function ArrowControl({ dir='up', night, onClick, onPulse }) {
  const [active, setActive] = useState(false);
  const baseBg = night ? '#0b0c10' : '#ffffff';
  const ring   = night ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const glyph  = night ? '#ffffff' : '#0f1115';

  const fire = (e)=>{
    setActive(true);
    onPulse?.();
    onClick?.(e);
    setTimeout(()=>setActive(false), 160);
  };

  return (
    <button type="button" onClick={fire} aria-label={dir==='up'?'Previous product':'Next product'} title={dir==='up'?'Previous product':'Next product'} style={{ padding:0, background:'transparent', border:'none' }}>
      <div aria-hidden style={{
        width:28, height:28, borderRadius:'50%', display:'grid', placeItems:'center',
        background: active ? 'var(--hover-green,#0bf05f)' : baseBg,
        boxShadow:`0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}`,
        transition:'background .12s ease',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          {dir==='up'
            ? <path d="M6 14l6-6 6 6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M6 10l6 6 6-6" stroke={glyph} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </div>
    </button>
  );
}

/* ---------------------------- Plus / Sizes UI --------------------------- */
const PlusSizesInline = forwardRef(function PlusSizesInline({ sizes=['OS','S','M','L','XL'] }, plusRef){
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const toggle = ()=>{
    setOpen(v=>{
      const next = !v;
      const el = plusRef?.current;
      if (el){
        if (next) el.classList.add('is-active'); else el.classList.remove('is-active');
        pulsePlusEl(el); // pulse on toggle, too
      }
      return next;
    });
  };

  const pick = (sz)=>{
    setPicked(sz);
    try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size:sz, count:1 }})); } catch {}
    setTimeout(()=>setPicked(null), 320);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:12 }}>
      <button
        ref={plusRef}
        type="button"
        className={`pill plus-pill ${open ? 'is-active' : ''}`}
        onClick={toggle}
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
              className={`pill size-pill ${picked===sz ? 'is-selected' : ''}`}
              onClick={()=>pick(sz)}
              aria-label={`Size ${sz}`}
              title={`Size ${sz}`}
            >{sz}</button>
          ))}
        </div>
      )}
    </div>
  );
});

/* -------------------------- Swipe Engine (mobile) ----------------------- */
function useSwipe({ imgsLen, prodsLen, index, setImgIdx, stepProductOnce, onPulse }) {
  const s = useRef({ down:false, x:0, y:0, stepped:false });
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;

  const STEP_X = coarse ? 90 : 50;
  const STEP_Y = coarse ? 120 : 70;

  const onDown = useCallback((e)=>{
    const p = e.touches ? e.touches[0] : e;
    s.current = { down:true, x:p.clientX, y:p.clientY, stepped:false };
  }, []);

  const onMove = useCallback((e)=>{
    if (!s.current.down) return;
    if (e.cancelable) e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - s.current.x;
    const dy = p.clientY - s.current.y;

    if (imgsLen){
      while (dx <= -STEP_X) { s.current.x -= STEP_X; setImgIdx(i=>clamp(i+1,0,imgsLen-1)); onPulse?.(); }
      while (dx >=  STEP_X) { s.current.x += STEP_X; setImgIdx(i=>clamp(i-1,0,imgsLen-1)); onPulse?.(); }
    }
    if (!s.current.stepped && prodsLen>1){
      if (dy <= -STEP_Y) { s.current.stepped = true; stepProductOnce(+1); onPulse?.(); }
      if (dy >=  STEP_Y) { s.current.stepped = true; stepProductOnce(-1); onPulse?.(); }
    }
  }, [imgsLen, prodsLen, setImgIdx, stepProductOnce, onPulse]);

  const onUp = useCallback(()=>{ s.current.down=false; }, []);
  return { onDown, onMove, onUp };
}

/* =============================== Component ============================== */
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

  const plusRef = useRef(null);
  const pulsePlus = useCallback(()=>pulsePlusEl(plusRef.current), []);

  /* Close overlay when orb zooms */
  useEffect(() => {
    const h = () => onClose?.();
    ['lb:zoom','lb:zoom/grid-density'].forEach(n=>{
      window.addEventListener(n,h); document.addEventListener(n,h);
    });
    return () => ['lb:zoom','lb:zoom/grid-density'].forEach(n=>{
      window.removeEventListener(n,h); document.removeEventListener(n,h);
    });
  }, [onClose]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key==='Escape') return onClose?.();
      if (imgs.length) {
        if (e.key==='ArrowRight') { setImgIdx(i=>clamp(i+1,0,imgs.length-1)); pulsePlus(); return; }
        if (e.key==='ArrowLeft')  { setImgIdx(i=>clamp(i-1,0,imgs.length-1)); pulsePlus(); return; }
      }
      if (products.length>1) {
        if (e.key==='ArrowDown') { onIndexChange?.(wrap(index+1, products.length)); pulsePlus(); return; }
        if (e.key==='ArrowUp')   { onIndexChange?.(wrap(index-1, products.length)); pulsePlus(); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, pulsePlus, onClose]);

  /* Wheel – pulse on every product/image step */
  const lastDirRef = useRef(0);
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgs.length) {
        const dir = e.deltaX>0?1:-1;
        if (now - lastTimeRef.current > 120 || dir !== lastDirRef.current){
          setImgIdx(i=>clamp(i + dir, 0, imgs.length-1));
          pulsePlus();
          lastTimeRef.current = now; lastDirRef.current = dir;
        }
      } else if (products.length>1) {
        const dir = e.deltaY>0?1:-1;
        if (now - lastTimeRef.current > 120 || dir !== lastDirRef.current){
          onIndexChange?.(wrap(index + dir, products.length));
          pulsePlus();
          lastTimeRef.current = now; lastDirRef.current = dir;
        }
      }
    };
    window.addEventListener('wheel', onWheel, { passive:true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange, pulsePlus]);

  /* Swipe – one product step per gesture */
  const swipe = useSwipe({
    imgsLen: imgs.length,
    prodsLen: products.length,
    index,
    setImgIdx,
    stepProductOnce: (dir)=>{ onIndexChange?.(wrap(index + (dir>0?1:-1), products.length)); },
    onPulse: pulsePlus,
  });

  /* Overlay flag for page styles */
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open','1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  /* SAFETY NET: pulse any time index prop actually changes */
  const prevIndex = useRef(index);
  useEffect(()=>{
    if (prevIndex.current !== index){ pulsePlus(); prevIndex.current = index; }
  }, [index, pulsePlus]);

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
        {/* click-out (header remains clickable) */}
        <div
          onClick={(e)=>{ e.stopPropagation(); onClose?.(); }}
          style={{ position:'fixed', left:0, right:0, bottom:0, top:'var(--header-ctrl,56px)', background:'transparent', pointerEvents:'auto' }}
        />

        <div className="product-hero" style={{ pointerEvents:'auto', textAlign:'center', zIndex:521 }}>
          {products.length>1 && (
            <div style={{ position:'fixed', left:`calc(12px + env(safe-area-inset-left,0px))`, top:'50%', transform:'translateY(-50%)', display:'grid', gap:8, zIndex:110 }}>
              <ArrowControl dir="up"   night={night} onPulse={pulsePlus} onClick={()=>onIndexChange?.(wrap(index-1, products.length))} />
              <ArrowControl dir="down" night={night} onPulse={pulsePlus} onClick={()=>onIndexChange?.(wrap(index+1, products.length))} />
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
                style={{ width:'100%', height:'auto', maxHeight:'70vh', objectFit:'contain' }}
              />
              {imgs.length>1 && (
                <div className="row-nowrap" style={{ gap:8, marginTop:6, justifyContent:'center', display:'flex' }}>
                  {imgs.map((_,i)=>(
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i+1}`}
                      className={`pill dot-pill ${i===clampedImgIdx ? 'is-active' : ''}`}
                      onClick={()=>{ setImgIdx(i); pulsePlus(); }}
                      style={{ width:18, height:18, padding:0 }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div className="product-hero-title">{product.title}</div>
          <div className="product-hero-price">{priceText}</div>

          <PlusSizesInline ref={plusRef} sizes={sizes} />
        </div>
      </div>
    </>
  );
}
