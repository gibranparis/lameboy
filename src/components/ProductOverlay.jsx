// @ts-check
// src/components/ProductOverlay.jsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function ProductOverlay({
  product,
  onClose,
  onAddToCart, // (product, { size, qty }) => void
  // optional gallery array on product: product.gallery = [url1, url2, ...]
}) {
  // mark overlay open so CSS can fully hide the grid
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-overlay-open', '1');
    return () => root.removeAttribute('data-overlay-open');
  }, []);

  // Orb = back out
  useEffect(() => {
    const onZoom = () => onClose?.();
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  if (!product) return null;

  const sizes = product.sizes || ['XS','S','M','L','XL'];

  // ----- simple gallery handling -----
  const imgs = product.gallery && product.gallery.length ? product.gallery : [product.image];
  const [idx, setIdx] = useState(0);
  const clamp = (i) => (i + imgs.length) % imgs.length;

  // wheel navigation:
  //  - vertical wheel = previous/next product (delegate to parent by closing; grid will keep selection logic)
  //  - horizontal wheel = previous/next image
  useEffect(() => {
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // horizontal → gallery
        e.preventDefault();
        if (e.deltaX > 0) setIdx((i) => clamp(i + 1));
        else if (e.deltaX < 0) setIdx((i) => clamp(i - 1));
      } else {
        // vertical → exit overlay; parent may show next/prev selection if you add that later
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [onClose]);

  const handleAdd = useCallback((size) => {
    try { onAddToCart && onAddToCart(product, { size, qty: 1 }); } catch {}
  }, [onAddToCart, product]);

  return (
    <div className="product-hero-overlay" data-overlay>
      <div className="product-hero">
        {/* explicit close (Esc UX still handled by browser extension keys etc.) */}
        <button className="product-hero-close" onClick={onClose} aria-label="Close" style={{ position:'absolute', top:8, right:8 }}>×</button>

        {imgs[idx] && (
          <Image
            src={imgs[idx]}
            alt={product.title}
            width={1000}
            height={900}
            priority
            className="product-hero-img"
          />
        )}

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">${(product.price/100).toFixed(2)}</div>

        {/* + / size picker (inline minimal) */}
        <div style={{ display:'grid', justifyItems:'center', gap:10, marginTop:4 }}>
          <button
            type="button"
            className="pill plus-pill"
            aria-label="Add"
            onClick={(e)=>{ e.currentTarget.nextElementSibling?.classList.toggle('open'); }}
          >
            +
          </button>
          <div className="row-nowrap" style={{ gap:8, display:'none' }} onAnimationEnd={(e)=>{ /* noop */ }} />
          <div className="row-nowrap open" style={{ gap:8 }}>
            {sizes.map((sz) => (
              <button key={sz} className="pill size-pill" onClick={() => handleAdd(sz)}>{sz}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
