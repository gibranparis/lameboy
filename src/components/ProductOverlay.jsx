// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function PlusSizesInline({ sizes = ['XS','S','M','L','XL'], onAdd, disabled=false, title='Add to cart' }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const clickPlus = () => !disabled && setOpen((v)=>!v);
  const pick = (sz) => { if (disabled) return; setPicked(sz); try{ onAdd?.(sz); }catch{} setTimeout(()=>setPicked(null),260); setOpen(false); };
  return (
    <div className="row-nowrap" style={{ justifyContent:'center', gap:10 }}>
      <button type="button" aria-label={title} className={['pill','plus-pill', open?'is-active':''].join(' ')} onClick={clickPlus}>+</button>
      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz)=>(
            <button key={sz} type="button" className={['pill','size-pill', picked===sz?'is-selected flash-green':''].join(' ')} onClick={()=>pick(sz)}>{sz}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductOverlay({ product, onClose, onAddToCart }) {
  const rootRef = useRef(null);
  const galleryRef = useRef(0); // index within product.images

  const images = useMemo(() => {
    const arr = Array.isArray(product?.images) && product.images.length ? product.images : [product?.image].filter(Boolean);
    return arr;
  }, [product]);

  // mark overlay open to hide grid clicks behind
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-overlay-open', '1');
    return () => r.removeAttribute('data-overlay-open');
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Orb = back (close overlay)
  useEffect(() => {
    const onZoom = () => onClose?.();
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [onClose]);

  // Scroll/trackpad to next/prev product in parent
  useEffect(() => {
    if (!rootRef.current) return;
    let acc = 0;
    const THRESH = 38;

    const onWheel = (e) => {
      // horizontal → gallery; vertical → product navigation
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > 0) stepImage(1);
        else if (e.deltaX < 0) stepImage(-1);
        return;
      }
      acc += e.deltaY;
      if (acc > THRESH) { acc = 0; emitNavigate('next'); }
      else if (acc < -THRESH) { acc = 0; emitNavigate('prev'); }
    };

    const onKey = (e) => {
      if (e.key === 'ArrowRight') stepImage(1);
      if (e.key === 'ArrowLeft')  stepImage(-1);
      if (e.key === 'PageDown')   emitNavigate('next');
      if (e.key === 'PageUp')     emitNavigate('prev');
    };

    rootRef.current.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      rootRef.current?.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const stepImage = (dir) => {
    if (images.length < 2) return;
    galleryRef.current = (galleryRef.current + dir + images.length) % images.length;
    // force a re-render by poking state via no-op setter pattern:
    setVersion((v)=>v+1);
  };
  const [_, setVersion] = useState(0);

  const emitNavigate = (dir) => {
    try { window.dispatchEvent(new CustomEvent('lb:overlay:navigate', { detail:{ dir } })); } catch {}
  };

  const handleAdd = useCallback((size) => {
    try {
      window.dispatchEvent(new CustomEvent('cart:add', { detail:{ size, count:1 } }));
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail:{ size, count:1 } }));
    } catch {}
    onAddToCart?.(product, { size, qty:1 });
  }, [onAddToCart, product]);

  if (!product) return null;

  return (
    <div className="product-hero-overlay" data-overlay ref={rootRef}>
      <div className="product-hero">
        {/* Close (hidden visually; still accessible) */}
        <button className="product-hero-close" onClick={onClose} aria-label="Close overlay">×</button>

        {/* Image / gallery */}
        <div style={{ width:'100%', display:'grid', placeItems:'center' }}>
          <Image
            key={images[galleryRef.current] || product.id}
            src={images[galleryRef.current] || product.image}
            alt={product.title}
            width={1200}
            height={1000}
            priority
            className="product-hero-img"
          />
        </div>

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">${(product.price/100).toFixed(2)}</div>

        <PlusSizesInline sizes={product.sizes || ['XS','S','M','L','XL']} onAdd={handleAdd} />
      </div>
    </div>
  );
}
