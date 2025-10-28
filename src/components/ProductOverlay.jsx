// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Small + size picker used inside overlay */
function PlusSizesInline({ sizes = ['XS','S','M','L','XL'], onPick }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const clickPlus = () => setOpen((v) => !v);
  const doPick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } }));
    } catch {}
    try { onPick && onPick(sz); } catch {}
    setTimeout(() => { setPicked(null); setOpen(false); }, 380);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button type="button" className={`pill plus-pill ${open ? 'is-active':''}`} onClick={clickPlus} aria-label="Add">+</button>
      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz) => (
            <button key={sz} type="button" className={`pill size-pill ${picked===sz?'is-selected flash-green':''}`} onClick={() => doPick(sz)}>{sz}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ProductOverlay
 * Props:
 *  - products: array
 *  - index: number (current product)
 *  - onIndexChange: (nextIdx) => void
 *  - onClose: () => void
 */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  // close overlay via orb click
  useEffect(() => {
    const onZoom = () => onClose?.();
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  // keyboard: arrows for gallery, up/down for product
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === 'ArrowLeft')  return setImgIdx((i) => Math.max(i - 1, 0));
      if (e.key === 'ArrowDown')  return onIndexChange?.(Math.min(products.length - 1, index + 1));
      if (e.key === 'ArrowUp')    return onIndexChange?.(Math.max(0, index - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, index, onIndexChange, onClose]);

  // wheel: vertical = product prev/next, horizontal = gallery
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 220) return; // throttle
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
        else setImgIdx((i) => Math.max(i - 1, 0));
      } else {
        if (e.deltaY > 0) onIndexChange?.(Math.min(products.length - 1, index + 1));
        else onIndexChange?.(Math.max(0, index - 1));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, index, onIndexChange]);

  // mark overlay open so CSS can hide grid behind
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = typeof product.price === 'number'
    ? `$${(product.price/100).toFixed(2)}`
    : String(product.price ?? '');

  const sizes = product.sizes?.length ? product.sizes : ['XS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" data-overlay>
      <div className="product-hero">
        {/* explicit close so it's always available */}
        <button className="product-hero-close pill" onClick={onClose} aria-label="Close">×</button>

        {/* main image */}
        {imgs[imgIdx] && (
          <Image
            src={imgs[imgIdx]}
            alt={product.title}
            width={1200}
            height={900}
            className="product-hero-img"
            priority
            unoptimized
          />
        )}

        {/* gallery dots */}
        {imgs.length > 1 && (
          <div className="row-nowrap" style={{ gap:8, marginTop:6 }}>
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i+1}`}
                className={`pill ${i===imgIdx ? 'size-pill is-selected' : ''}`}
                onClick={() => setImgIdx(i)}
                style={{ width:22, height:22, padding:0 }}
              />
            ))}
          </div>
        )}

        {/* title / price */}
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        {/* add flow */}
        <PlusSizesInline
          sizes={sizes}
          onPick={(sz) => {
            try { window.dispatchEvent(new CustomEvent('cart:add', { detail: { qty: 1 } })); } catch {}
          }}
        />
      </div>
    </div>
  );
}
