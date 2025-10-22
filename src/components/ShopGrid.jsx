// @ts-check
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

/** A tiny, local product overlay (no routing). */
function ProductOverlay({
  product,
  onClose,
  onAdd,
}) {
  const [showSizes, setShowSizes] = useState(false);
  const [size, setSize] = useState(null);

  // make Esc close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // close on orb (your header emits `lb:zoom`)
  useEffect(() => {
    const onZoom = () => onClose();
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [onClose]);

  // pill state → white (idle) → grey (active, sizes showing) → green (size chosen)
  const plusState = useMemo(() => {
    if (size) return 'ready';        // green
    if (showSizes) return 'active';  // grey
    return 'idle';                   // white
  }, [showSizes, size]);

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <button
        className="product-hero-close"
        aria-label="Close"
        onClick={onClose}
      >
        ←
      </button>

      <div className="product-hero">
        {/* image */}
        <img
          className="product-hero-img"
          src={product.image}
          alt={product.title}
          draggable="false"
        />

        {/* title + price */}
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{product.price}</div>

        {/* PLUS pill (always rendered). Click once → grey + reveal sizes.
            Pick a size → pill turns green and clicking it adds to cart. */}
        <div style={{ display:'grid', placeItems:'center', gap:10 }}>
          <button
            type="button"
            aria-label={size ? `Add ${product.title} (${size}) to cart` : 'Choose size'}
            className={[
              'pill','plus-pill',
              plusState === 'active' ? 'is-active' : '',
              plusState === 'ready'  ? 'is-ready'  : '',
            ].join(' ').trim()}
            onClick={() => {
              if (!showSizes && !size) { setShowSizes(true); return; }
              if (size) {
                onAdd({ product, size });
                // reset to idle state after add
                setShowSizes(false);
                setSize(null);
              }
            }}
          >
            +
          </button>

          {/* size pills (toggle visibility only; don’t resize container) */}
          <div
            className="sizes-row"
            aria-hidden={!showSizes}
            style={{
              display:'grid',
              gridAutoFlow:'column',
              gap:8,
              height: showSizes ? 32 : 0,
              opacity: showSizes ? 1 : 0,
              overflow:'hidden',
              transition:'opacity .18s ease, height .18s ease',
            }}
          >
            {['XS','S','M','L','XL'].map(s => (
              <button
                key={s}
                type="button"
                className={[
                  'pill','size-pill',
                  size === s ? 'is-selected' : ''
                ].join(' ')}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Grid */
export default function ShopGrid({ hideTopRow=false }) {
  const [overlayProduct, setOverlayProduct] = useState(null);

  // minimal catalogue (keep your actual data source)
  const products = useMemo(() => ([
    { id:'tee-black',  title:'LB Tee — Black', price:'$38.00', image:'/products/tee-black.png'  },
    { id:'tee-white',  title:'LB Tee — White', price:'$38.00', image:'/products/tee-white.png'  },
    { id:'dad-navy',   title:'Dad Cap — Navy', price:'$42.00', image:'/products/dad-navy.png'   },
    { id:'sticker',    title:'Sticker Pack',   price:'$10.00', image:'/products/stickers.png'   },
  ]), []);

  // mark the DOM so CSS can hide the grid entirely when overlay is open
  useEffect(() => {
    const r = document.documentElement;
    if (overlayProduct) r.setAttribute('data-overlay-open','');
    else r.removeAttribute('data-overlay-open');
    return () => r.removeAttribute('data-overlay-open');
  }, [overlayProduct]);

  // add-to-cart bridge (emit event your CartButton listens for)
  const emitAddToCart = (line) => {
    try {
      const evt = new CustomEvent('lb:add-to-cart', { detail: line });
      window.dispatchEvent(evt); document.dispatchEvent(evt);
    } catch {}
  };

  // also wire orb to step grid density when overlay NOT open
  useEffect(() => {
    if (overlayProduct) return; // overlay captures lb:zoom to close itself
    const onZoom = (e) => {
      const step = Number(e?.detail?.step ?? 1);
      const el = document.querySelector(':root');
      const cur = Number(getComputedStyle(el).getPropertyValue('--grid-cols') || '4') || 4;

      // loop 1..5 strictly one step at a time
      let next = cur + step;
      if (next > 5) next = 1;
      if (next < 1) next = 5;
      el.style.setProperty('--grid-cols', String(next));
    };
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [overlayProduct]);

  return (
    <div className="shop-wrap">
      {!hideTopRow && (
        <div style={{ height: 8 }} aria-hidden="true" />
      )}

      <div className="shop-grid">
        {products.map(p => (
          <a
            key={p.id}
            href="#"
            onClick={(e)=>{ e.preventDefault(); setOverlayProduct(p); }}
            className="product-tile"
          >
            <div className="product-box">
              <img className="product-img" src={p.image} alt={p.title} />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayProduct && (
        <ProductOverlay
          product={overlayProduct}
          onClose={() => setOverlayProduct(null)}
          onAdd={({ product, size }) => {
            emitAddToCart({ productId: product.id, title: product.title, price: product.price, size, qty: 1 });
            setOverlayProduct(null);
          }}
        />
      )}
    </div>
  );
}
