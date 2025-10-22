// @ts-check
'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Very small product model for demo purposes.
 * If you already have products coming in via props,
 * you can keep the prop and ignore this fallback.
 */
const FALLBACK_PRODUCTS = Array.from({ length: 20 }).map((_, i) => ({
  id: `p${i + 1}`,
  title: `LAMEBOY ${i + 1}`,
  price: i % 2 === 0 ? '$120' : '$140',
  img: '/products/shoe.png',
  sizes: ['S', 'M', 'L', 'XL'],
}));

/** Emits a CustomEvent to increment the cart */
function emitCartAdd(n = 1) {
  const evt = new CustomEvent('cart:add', { detail: { count: n } });
  try { window.dispatchEvent(evt); } catch {}
  try { document.dispatchEvent(evt); } catch {}
}

export default function ShopGrid({
  products = FALLBACK_PRODUCTS,
  hideTopRow = false,
}) {
  const [selected, setSelected] = useState/** @type {null | string} */(null);
  const [showSizes, setShowSizes] = useState(false);
  const [flashSize, setFlashSize] = useState/** @type {null | string} */(null);

  // Keep the grid default at 5 columns (CSS var)
  useEffect(() => {
    const root = document.documentElement;
    // if someone else manipulated it, we still default back to 5 on mount
    const existing = getComputedStyle(root).getPropertyValue('--grid-cols');
    if (!existing) root.style.setProperty('--grid-cols', '5');
  }, []);

  // Overlay open/close → set a root flag so CSS can hide the grid behind it
  useEffect(() => {
    const root = document.documentElement;
    if (selected) root.setAttribute('data-overlay-open', '');
    else root.removeAttribute('data-overlay-open');
  }, [selected]);

  // Close overlay (used by header/orb externally if needed)
  useEffect(() => {
    const onBack = () => setSelected(null);
    window.addEventListener('lb:overlay:close', onBack);
    document.addEventListener('lb:overlay:close', onBack);
    return () => {
      window.removeEventListener('lb:overlay:close', onBack);
      document.removeEventListener('lb:overlay:close', onBack);
    };
  }, []);

  const product = useMemo(
    () => products.find((p) => p.id === selected) || null,
    [products, selected]
  );

  const openProduct = (id) => {
    setSelected(id);
    // when we enter the overlay, default to plus closed (white)
    setShowSizes(false);
    setFlashSize(null);
  };

  const closeOverlay = () => {
    setSelected(null);
    setShowSizes(false);
    setFlashSize(null);
  };

  const onPlus = () => {
    // “+” turns grey and reveals sizes (stays visible)
    setShowSizes((v) => !v);
    setFlashSize(null);
  };

  const onPickSize = (sz) => {
    // flash the selected size green
    setFlashSize(sz);
    // add to cart
    emitCartAdd(1);
    // reset controls after a tiny flash
    setTimeout(() => {
      setShowSizes(false);       // hide size pills
      setFlashSize(null);        // clear flash
      // plus goes back to default (white) because showSizes=false
    }, 220);
  };

  return (
    <div className="shop-wrap">
      {!hideTopRow && null}

      {/* GRID */}
      <div className="shop-grid">
        {products.map((p) => (
          <a
            key={p.id}
            href="#"
            className="product-tile lb-tile"
            onClick={(e) => { e.preventDefault(); openProduct(p.id); }}
            title={p.title}
          >
            <div className="product-box">
              <img className="product-img" src={p.img} alt="" />
            </div>
            <div className="product-meta">
              {p.title}
            </div>
          </a>
        ))}
      </div>

      {/* OVERLAY */}
      {product && (
        <div className="product-hero-overlay" role="dialog" aria-modal="true">
          <div className="product-hero">
            {/* keep header visible — orb will emit lb:overlay:close elsewhere */}
            <div style={{ width:'100%', display:'grid', placeItems:'center', gap:10 }}>
              <img className="product-hero-img" src={product.img} alt="" />
              <div className="product-hero-title">{product.title}</div>
              <div className="product-hero-price">{product.price}</div>

              {/* Controls row */}
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
                {/* PLUS pill — white by default, grey when active */}
                <button
                  type="button"
                  className={`pill plus-pill ${showSizes ? 'is-active' : ''}`}
                  onClick={onPlus}
                  aria-pressed={showSizes}
                  title="Show sizes"
                >
                  +
                </button>

                {/* Size pills — only visible when plus is active */}
                {showSizes && product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`pill size-pill ${flashSize === sz ? 'is-selected flash-green' : ''}`}
                    onClick={() => onPickSize(sz)}
                    title={`Select size ${sz}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Close overlay helper (hidden visually; orb handles back) */}
              <button
                type="button"
                onClick={closeOverlay}
                style={{ position:'absolute', inset:'0 auto auto 0', width:1, height:1, opacity:0, pointerEvents:'none' }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
