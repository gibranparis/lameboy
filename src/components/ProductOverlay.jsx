// src/components/ProductOverlay.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

function PlusSizesInline({ sizes = ['OS','S','M','L','XL'], onPick }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const clickPlus = () => setOpen((v) => !v);
  const doPick = (sz) => {
    setPicked(sz);
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } }));
      window.dispatchEvent(new CustomEvent('cart:add',       { detail: { qty: 1 } }));
    } catch {}
    setTimeout(() => { setPicked(null); setOpen(false); }, 380);
    onPick?.(sz);
  };

  return (
    <div style={{ display:'grid', justifyItems:'center', gap:10 }}>
      <button type="button" className={`pill plus-pill ${open ? 'is-active':''}`} onClick={clickPlus} aria-label="Add">+</button>
      {open && (
        <div className="row-nowrap" style={{ gap:8 }}>
          {sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pill size-pill ${picked===sz?'is-selected flash-green':''}`}
              onClick={() => doPick(sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const product = products[index];
  const imgs = product?.images?.length ? product.images : [product?.image].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [index]);

  // Close overlay via orb zoom event (listen on both window and document; support legacy name too)
  useEffect(() => {
    const handler = () => onClose?.();
    const names = ['lb:zoom', 'lb:zoom/grid-density'];
    names.forEach((n) => {
      window.addEventListener(n, handler);
      document.addEventListener(n, handler);
    });
    return () => {
      names.forEach((n) => {
        window.removeEventListener(n, handler);
        document.removeEventListener(n, handler);
      });
    };
  }, [onClose]);

  // Keyboard
  const multi = products.length > 1;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight') return setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === 'ArrowLeft')  return setImgIdx((i) => Math.max(i - 1, 0));
      if (multi) {
        if (e.key === 'ArrowDown') return onIndexChange?.((index + 1) % products.length);
        if (e.key === 'ArrowUp')   return onIndexChange?.((index - 1 + products.length) % products.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgs.length, products.length, multi, index, onIndexChange, onClose]);

  // Wheel (desktop): loop infinitely
  const lastWheel = useRef(0);
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lastWheel.current < 220) return;
      lastWheel.current = now;

      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (ax > ay) {
        if (e.deltaX > 0) setImgIdx((i) => Math.min(i + 1, imgs.length - 1));
        else setImgIdx((i) => Math.max(i - 1, 0));
      } else if (multi) {
        if (e.deltaY > 0) onIndexChange?.((index + 1) % products.length);
        else              onIndexChange?.((index - 1 + products.length) % products.length);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [imgs.length, products.length, multi, index, onIndexChange]);

  // mark overlay open (locks page scroll via CSS)
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1');
    return () => document.documentElement.removeAttribute('data-overlay-open');
  }, []);

  if (!product) return null;

  const priceText = typeof product.price === 'number'
    ? `$${(product.price/100).toFixed(2)}`
    : String(product.price ?? '');

  const sizes = product.sizes?.length ? product.sizes : ['OS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" data-overlay>
      {/* right-side up/down cluster */}
      {multi && (
        <div
          aria-hidden
          style={{
            position:'fixed',
            right:20,
            top:'50%',
            transform:'translateY(-50%)',
            display:'grid',
            gap:10,
            zIndex: 501,
          }}
        >
          <button
            type="button"
            aria-label="Previous product"
            onClick={() => onIndexChange?.((index - 1 + products.length) % products.length)}
            style={{
              width:28, height:28, borderRadius:9999, padding:0, margin:0,
              display:'grid', placeItems:'center',
              background:'#fff', boxShadow:'0 0 0 1px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.08)',
              fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight:700, fontSize:14, lineHeight:1, userSelect:'none'
            }}
          >
            ^
          </button>
          <button
            type="button"
            aria-label="Next product"
            onClick={() => onIndexChange?.((index + 1) % products.length)}
            style={{
              width:28, height:28, borderRadius:9999, padding:0, margin:0,
              display:'grid', placeItems:'center',
              background:'#fff', boxShadow:'0 0 0 1px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.08)',
              fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight:700, fontSize:14, lineHeight:1, userSelect:'none'
            }}
          >
            v
          </button>
        </div>
      )}

      <div className="product-hero">
        {/* hidden visually by CSS but available to SRs */}
        <button className="product-hero-close pill" onClick={onClose} aria-label="Close">×</button>

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

        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        <PlusSizesInline sizes={sizes} onPick={() => {}} />
      </div>
    </div>
  );
}
