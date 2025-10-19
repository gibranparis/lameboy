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
const clampCols = (n) => Math.max(1, Math.min(5, n));

/** @param {{ hideTopRow?: boolean }} props */
export default function ShopGrid({ hideTopRow = false }) {
  // Columns driven by CSS var + localStorage
  const [cols, setCols] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('lb:grid-cols') || '', 10);
      if (Number.isFinite(saved)) return clampCols(saved);
    } catch {}
    const css = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols') || '4', 10);
    return clampCols(Number.isFinite(css) ? css : 4);
  });

  // Apply to :root + persist
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-cols', String(cols));
    try { localStorage.setItem('lb:grid-cols', String(cols)); } catch {}
  }, [cols]);

  const [sel, setSel]   = useState/** @type {null | (typeof PRODUCTS)[number]} */(null);
  const [size, setSize] = useState/** @type {null | string} */(null);

  // Mark overlay state for page.js to detect
  useEffect(() => {
    const root = document.documentElement;
    if (sel) root.setAttribute('data-overlay', 'product');
    else root.removeAttribute('data-overlay');
  }, [sel]);

  // Listen for orb events (window only!)
  useEffect(() => {
    const onZoom = /** @param {CustomEvent<{step?:number}>} e */ (e) => {
      const step = Number(e?.detail?.step ?? 1) || 1;
      setCols((c) => {
        const next = c + step;
        return next > 5 ? 1 : (next < 1 ? 5 : next); // wrap 1..5
      });
    };
    const onClose = () => {
      setSel(null);
      setSize(null);
      document.body.style.overflow = '';
    };

    window.addEventListener('lb:zoom', onZoom);
    window.addEventListener('lb:close-overlay', onClose);
    // legacy fallback
    // @ts-ignore
    window.lbCloseOverlay = onClose;

    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('lb:close-overlay', onClose);
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
      {/* GRID — hidden entirely when an overlay is open */}
      {!sel && (
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
      )}

      {/* OVERLAY */}
      {sel && (
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
      )}
      {/* NOTE: Removed the gray “close” button entirely.
         Use the ORB in the header to exit, or dispatch window.dispatchEvent(new CustomEvent('lb:close-overlay')) from elsewhere if needed. */}
    </div>
  );
}
