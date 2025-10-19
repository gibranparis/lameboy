// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Replace this with your real product data if you have it elsewhere.
 * The overlay UI will render title, price and simple size choices for "tee" type.
 */
const PRODUCTS = [
  { id:'tee-black',  title:'LB Tee – Black',  price:3800, type:'tee',   img:'/shop/tee-black.png'  },
  { id:'tee-white',  title:'LB Tee – White',  price:3800, type:'tee',   img:'/shop/tee-white.png'  },
  { id:'cap-navy',   title:'Dad Cap – Navy',  price:3800, type:'cap',   img:'/shop/cap-navy.png'   },
  { id:'stickers',   title:'Sticker Pack',    price:1800, type:'other', img:'/shop/stickers.png'   },
];

const SIZES = ['XS','S','M','L','XL'];

function formatUSD(cents){ return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(cents/100); }

/** @param {{ hideTopRow?: boolean }} props */
export default function ShopGrid({ hideTopRow = false }) {
  const [cols, setCols] = useState(() => {
    const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols') || '4', 10);
    return Number.isFinite(v) ? v : 4;
  });

  // Selected product => overlay
  const [sel, setSel] = useState/** @type {null | (typeof PRODUCTS)[number]} */(null);
  const [size, setSize] = useState/** @type {null | string} */(null);

  // Apply columns to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-cols', String(Math.max(1, Math.min(5, cols))));
  }, [cols]);

  // Listen for zoom step (+/- 1) and for overlay close
  useEffect(() => {
    /** @param {CustomEvent<{step:number}>} e */
    const onZoom = (e) => {
      const step = Number(e?.detail?.step ?? 0);
      if (!Number.isFinite(step) || step === 0) return;
      setCols((c) => Math.max(1, Math.min(5, c + step)));
    };
    const onClose = () => closeOverlay();

    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    window.addEventListener('lb:close-overlay', onClose);
    document.addEventListener('lb:close-overlay', onClose);

    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('lb:close-overlay', onClose);
      document.removeEventListener('lb:close-overlay', onClose);
    };
  }, []);

  // Root flag so the orb knows whether to act as "Back"
  useEffect(() => {
    const root = document.documentElement;
    if (sel) root.setAttribute('data-overlay', 'product');
    else root.removeAttribute('data-overlay');
  }, [sel]);

  const items = useMemo(() => PRODUCTS, []);

  function openOverlay(p){
    setSel(p);
    setSize(null);
    // optional: scroll lock
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(){
    setSel(null);
    setSize(null);
    document.body.style.overflow = '';
  }

  return (
    <div className="shop-wrap">
      <div className="shop-grid">
        {items.map((p) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            onClick={(e)=>{ e.preventDefault(); openOverlay(p); }}
            href={`#${p.id}`}
            title={p.title}
          >
            <button className="product-box">
              {/* You can swap to next/image if you prefer */}
              <img className="product-img" alt={p.title} src={p.img} />
            </button>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {/* ===== Overlay ===== */}
      {sel && (
        <>
          <div className="product-hero-overlay" role="dialog" aria-modal="true">
            <div className="product-hero">
              {/* Keep header visible; overlay sits beneath it due to z-indexes */}
              <img className="product-hero-img" alt={sel.title} src={sel.img} />
              <div className="product-hero-title">{sel.title}</div>
              <div className="product-hero-price">{formatUSD(sel.price)}</div>

              {sel.type === 'tee' && (
                <div style={{ width:'100%', maxWidth:680 }}>
                  <div style={{ fontWeight:700, opacity:.9, margin:'16px 0 8px' }}>Size</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={()=>setSize(s)}
                        style={{
                          padding:'8px 12px',
                          borderRadius:12,
                          border:'1px solid rgba(0,0,0,.18)',
                          background:size===s ? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.04)',
                          fontWeight:700,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ width:'100%', maxWidth:680, marginTop:18 }}>
                <button
                  type="button"
                  disabled={sel.type === 'tee' && !size}
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12,
                    border:'1px solid rgba(0,0,0,.18)',
                    background: (sel.type === 'tee' && !size) ? '#666' : '#111',
                    color:'#fff', fontWeight:800, opacity: (sel.type === 'tee' && !size) ? .65 : 1,
                    cursor: (sel.type === 'tee' && !size) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={()=>{/* hook up to cart here */}}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>

          {/* Close (back) button lives under the header; orb also closes it */}
          <button
            type="button"
            className="product-hero-close"
            aria-label="Close"
            onClick={closeOverlay}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
