// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo } from 'react';

/* utils */
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const wrap  = (i,len)=>((i%len)+len)%len;

/* arrow with green flash */
function ArrowControl({ dir='up', night, onClick }) {
  const [flash, setFlash] = useState(false);
  const fill  = night ? '#0b0c10' : '#ffffff';              // black in night, white in day
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

/* + / sizes (kept from your version, uses .pill + flash-green) */
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

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const night = document.documentElement.dataset.theme === 'night' ||
                document.documentElement.classList.contains('dark');

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

  /* wheel */
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now(); if (now - lastWheel.current < 120) return; lastWheel.current = now;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay && imgs.length) setImgIdx(i=>clamp(i + (e.deltaX>0?1:-1), 0, imgs.length-1));
      else if (products.length>1) onIndexChange?.(wrap(index + (e.deltaY>0?1:-1), products.length));
    };
    window.addEventListener('wheel', onWheel, { passive:true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  /* touch: horizontal image, vertical product (continuous steps) */
  useEffect(() => {
    let accY=0, accX=0, active=false, lastY=0, lastX=0;
    const STEP_Y=48, STEP_X=36;
    const onStart = (e)=>{ const t=e.touches?.[0]; if(!t) return; active=true; lastY=t.clientY; lastX=t.clientX; accY=0; accX=0; };
    const onMove  = (e)=>{ if(!active) return; const t=e.touches?.[0]; if(!t) return;
      const dy=t.clientY-lastY; lastY=t.clientY; accY+=dy;
      const dx=t.clientX-lastX; lastX=t.clientX; accX+=dx;
      if (imgs.length){ while(accX<=-STEP_X){ accX+=STEP_X; setImgIdx(i=>clamp(i+1,0,imgs.length-1)); }
                        while(accX>= STEP_X){ accX-=STEP_X; setImgIdx(i=>clamp(i-1,0,imgs.length-1)); } }
      if (products.length>1){ while(accY<=-STEP_Y){ accY+=STEP_Y; onIndexChange?.(wrap(index+1,products.length)); }
                              while(accY>= STEP_Y){ accY-=STEP_Y; onIndexChange?.(wrap(index-1,products.length)); } }
    };
    const onEnd=()=>{ active=false; accY=0; accX=0; };
    window.addEventListener('touchstart', onStart, { passive:true });
    window.addEventListener('touchmove',  onMove,  { passive:true });
    window.addEventListener('touchend',   onEnd,   { passive:true });
    window.addEventListener('touchcancel',onEnd,   { passive:true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
      window.removeEventListener('touchcancel',onEnd);
    };
  }, [imgs.length, products.length, index, onIndexChange]);

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
    <div className="product-hero-overlay" data-overlay role="dialog" aria-modal="true" aria-label={`${product.title} details`}>
      <div className="product-hero">
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
              <div className="row-nowrap" style={{ gap:8, marginTop:6 }}>
                {imgs.map((_,i)=>(
                  <button
                    key={i}
                    type="button"
                    aria-label={`Image ${i+1}`}
                    className={`pill ${i===clampedImgIdx ? 'size-pill is-selected flash-green' : ''}`}
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
    </div>
  );
}
