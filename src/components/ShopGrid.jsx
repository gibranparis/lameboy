// @ts-check
'use client';

import { useEffect, useMemo, useState } from 'react';

/** Product overlay (no back arrow; orb closes it). */
function ProductOverlay({ product, onAdd, onClose }) {
  const [mode, setMode] = useState/** @type {'plus'|'sizes'} */('plus');
  const [hot, setHot] = useState/** @type<null|string> */(null); // flash selected size

  // Close overlay when the header orb emits lb:zoom.
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('lb:zoom', close);
    document.addEventListener('lb:zoom', close);
    return () => {
      window.removeEventListener('lb:zoom', close);
      document.removeEventListener('lb:zoom', close);
    };
  }, [onClose]);

  // Esc closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sizes = ['XS','S','M','L','XL'];

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <div className="product-hero">
        <img
          className="product-hero-img"
          src={product.image}
          alt={product.title}
          draggable="false"
        />
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{product.price}</div>

        {/* PLUS → SIZES flow */}
        <div style={{ display:'grid', placeItems:'center', gap:10 }}>
          {mode === 'plus' ? (
            <button
              type="button"
              aria-label="Choose size"
              className="pill plus-pill"
              onClick={() => setMode('sizes')}
            >
              +
            </button>
          ) : (
            <div
              className="sizes-row"
              style={{
                display:'grid',
                gridAutoFlow:'column',
                gap:8,
                height:32,
                opacity:1,
                overflow:'hidden'
              }}
            >
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={[
                    'pill','size-pill',
                    hot === s ? 'is-selected flash-green' : ''
                  ].join(' ')}
                  onClick={() => {
                    // flash the chosen size green, then add → reset to '+'
                    setHot(s);
                    // Add to cart after a short flash
                    setTimeout(() => {
                      onAdd({ product, size: s });
                      setHot(null);
                      setMode('plus');
                    }, 260);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopGrid({ hideTopRow=false }) {
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Your catalog (swap for real data)
  const products = useMemo(() => ([
    { id:'tee-black',  title:'LB Tee — Black', price:'$38.00', image:'/products/tee-black.png'  },
    { id:'tee-white',  title:'LB Tee — White', price:'$38.00', image:'/products/tee-white.png'  },
    { id:'dad-navy',   title:'Dad Cap — Navy', price:'$42.00', image:'/products/dad-navy.png'   },
    { id:'sticker',    title:'Sticker Pack',   price:'$10.00', image:'/products/stickers.png'   },
  ]), []);

  // Hide grid while overlay is open (prevents “double view”)
  useEffect(() => {
    const r = document.documentElement;
    if (overlayProduct) r.setAttribute('data-overlay-open','');
    else r.removeAttribute('data-overlay-open');
    return () => r.removeAttribute('data-overlay-open');
  }, [overlayProduct]);

  // Grid zoom: strictly 1 step at a time, loop 1..5
  useEffect(() => {
    if (overlayProduct) return; // when open, orb closes overlay instead
    const onZoom = (e) => {
      const step = Number(e?.detail?.step ?? 1);
      const root = document.documentElement;
      const cur = Number(getComputedStyle(root).getPropertyValue('--grid-cols') || '5') || 5;
      let next = cur + step;
      if (next > 5) next = 1;
      if (next < 1) next = 5;
      root.style.setProperty('--grid-cols', String(next));
    };
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [overlayProduct]);

  // Add-to-cart event bridge (badge + pulse handled by CartButton)
  const addToCart = ({ product, size }) => {
    try {
      const detail = { productId: product.id, title: product.title, price: product.price, size, qty: 1 };
      const evt = new CustomEvent('lb:add-to-cart', { detail });
      window.dispatchEvent(evt); document.dispatchEvent(evt);
    } catch {}
  };

  return (
    <div className="shop-wrap">
      {!hideTopRow && <div style={{ height: 8 }} aria-hidden="true" />}
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
          onAdd={(line) => { addToCart(line); setOverlayProduct(null); }}
          onClose={() => setOverlayProduct(null)}
        />
      )}
    </div>
  );
}
