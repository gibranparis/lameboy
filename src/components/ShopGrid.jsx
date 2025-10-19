// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

const PRODUCTS = [
  { id:'tee-black',  title:'LB Tee — Black',  price:3800, type:'tee',   img:'/shop/tee-black.png'  },
  { id:'tee-white',  title:'LB Tee — White',  price:3800, type:'tee',   img:'/shop/tee-white.png'  },
  { id:'cap-navy',   title:'Dad Cap — Navy',  price:3800, type:'cap',   img:'/shop/cap-navy.png'   },
  { id:'stickers',   title:'Sticker Pack',    price:1800, type:'other', img:'/shop/stickers.png'   },
];

const SIZES = ['XS','S','M','L','XL'];
const money = (c) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);

/** @param {{ hideTopRow?: boolean }} props */
export default function ShopGrid({ hideTopRow = false }) {
  // Columns via CSS var (kept here for consistency, but not required for the back behavior)
  const [cols, setCols] = useState(() => {
    const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols') || '4', 10);
    return Number.isFinite(v) ? v : 4;
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-cols', String(Math.max(1, Math.min(5, cols))));
  }, [cols]);

  const [sel, setSel]   = useState/** @type {null | (typeof PRODUCTS)[number]} */(null);
  const [size, setSize] = useState/** @type {null | string} */(null);

  // Root attribute so other components know overlay state (optional but nice)
  useEffect(() => {
    const root = document.documentElement;
    if (sel) root.setAttribute('data-overlay', 'product');
    else root.removeAttribute('data-overlay');
  }, [sel]);

  // Close handler (exported globally + listens to orb event)
  useEffect(() => {
    const close = () => {
      setSel(null);
      setSize(null);
      document.body.style.overflow = '';
    };

    // event listeners from the orb
    const onClose = () => close();
    window.addEventListener('lb:close-overlay', onClose);
    document.addEventListener('lb:close-overlay', onClose);

    // global fallback for older callers
    // @ts-ignore
    window.lbCloseOverlay = close;

    return () => {
      window.removeEventListener('lb:close-overlay', onClose);
      document.removeEventListener('lb:close-overlay', onClose);
      try { delete window.lbCloseOverlay; } catch {}
    };
  }, []);

  const items = useMemo(() => PRODUCTS, []);

  function openOverlay(p){
    setSel(p);
    setSize(null);
    document.body.style.overflow = 'hidden'; // lock scroll under overlay
  }

  return (
    <div className="shop-wrap">
      <div className="shop-grid">
        {items.map((p) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            href={`#${p.id}`}
            onClick={(e)=>{ e.preventDefault(); openOverlay(p); }}
            title={p.title}
          >
            <button className="product-box">
              <img className="product-img" alt={p.title} src={p.img} />
            </button>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {/* Overlay */}
      {sel && (
        <>
          <div className="product-hero-overlay" role="dialog" aria-modal="true">
            <div className="product-hero">
              <img className="product-hero-img" alt={sel.title} src={sel.img} />
              <div className="product-hero-title">{sel.title}</div>
              <div className="product-hero-price">{money(sel.price)}</div>

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
                  onClick={()=>{/* hook to cart */}}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="product-hero-close"
            aria-label="Close"
            onClick={()=>window.dispatchEvent(new CustomEvent('lb:close-overlay'))}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
