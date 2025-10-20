'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/* --- demo products --- */
const PRODUCTS = [
  { id:'tee-black',  title:'LB Tee — Black',  price:3800, img:'/products/lb-tee-black.png'  },
  { id:'tee-white',  title:'LB Tee — White',  price:3800, img:'/products/lb-tee-white.png'  },
  { id:'cap-navy',   title:'Dad Cap — Navy',  price:3200, img:'/products/dad-cap-navy.png' },
  { id:'stick-pack', title:'Sticker Pack',    price:1200, img:'/products/stickers.png'     },
];
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

/* --- Unified “pill” look (restores the older style) --- */
function Pill({ children, onClick, active=false, disabled=false, ariaLabel, title }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:28, height:28, padding:'0 10px',
    borderRadius:10, background:'#fff', color:'#111',
    border:'1px solid rgba(0,0,0,.12)', boxShadow:'0 1px 0 rgba(0,0,0,.04)',
    fontWeight:700, fontSize:12, letterSpacing:'.02em',
    transition:'background .18s ease, color .18s ease, outline-color .18s ease',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
  };
  const focus = active ? { outline:'2px solid rgba(74,165,255,.9)', outlineOffset:2 } : {};
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} title={title} style={{...base, ...focus}}>
      {children}
    </button>
  );
}

export default function ShopGrid({ hideTopRow=false }) {
  const [cols, setCols] = useState(4);
  const [dir, setDir] = useState(1);               // ping-pong 1..5..1
  const [overlay, setOverlay] = useState(null);    // { id }
  const cssCols = useMemo(()=>String(cols),[cols]);

  // drive CSS var
  useEffect(() => { document.documentElement.style.setProperty('--grid-cols', cssCols); }, [cssCols]);

  // advertise overlay state for header orb (“back”)
  useEffect(() => { document.body.dataset.overlay = overlay ? '1' : '0'; }, [overlay]);

  // zoom handler (grid only; overlay intercepts)
  useEffect(() => {
    const onZoom = (e) => {
      if (overlay) return;
      const step = Number(e?.detail?.step ?? 1);
      setCols((c) => {
        let d = dir;
        let next = c + d * step;
        if (next > 5) { next = 4; d = -1; }
        if (next < 1) { next = 2; d =  1; }
        setDir(d);
        return next;
      });
    };
    const onCloseOverlay = () => setOverlay(null);

    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    window.addEventListener('lb:close-overlay', onCloseOverlay);
    document.addEventListener('lb:close-overlay', onCloseOverlay);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('lb:close-overlay', onCloseOverlay);
      document.removeEventListener('lb:close-overlay', onCloseOverlay);
    };
  }, [overlay, dir]);

  const open = useCallback((id) => setOverlay({ id }), []);
  const close = useCallback(() => setOverlay(null), []);

  return (
    <div className="shop-wrap">
      {/* grid (hidden behind overlay) */}
      {!overlay && (
        <div className="shop-grid">
          {PRODUCTS.map((p) => (
            <a key={p.id} className="product-tile lb-tile" href="#"
               onClick={(e)=>{ e.preventDefault(); open(p.id); }}>
              <div className="product-box">
                <img className="product-img" src={p.img} alt={p.title} />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </div>
      )}

      {overlay && (
        <ProductOverlay
          product={PRODUCTS.find(x=>x.id===overlay.id)}
          onClose={close}
        />
      )}
    </div>
  );
}

/* ---------------- Overlay (restores older look/flow) ---------------- */
function ProductOverlay({ product, onClose }) {
  const [mode, setMode] = useState('plus');     // "plus" | "sizes"
  const [adding, setAdding] = useState(false);
  const sizes = ['XS','S','M','L','XL'];

  // orb back support
  useEffect(() => {
    const onCloseEv = () => onClose();
    window.addEventListener('lb:close-overlay', onCloseEv);
    document.addEventListener('lb:close-overlay', onCloseEv);
    return () => {
      window.removeEventListener('lb:close-overlay', onCloseEv);
      document.removeEventListener('lb:close-overlay', onCloseEv);
    };
  }, [onClose]);

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <div className="product-hero">
        <img className="product-hero-img" src={product.img} alt={product.title} />
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{money(product.price)}</div>

        <div style={{ display:'grid', placeItems:'center', gap:10 }}>
          {mode === 'plus' ? (
            <Pill ariaLabel="Choose size" title="Choose size" onClick={()=>setMode('sizes')}>
              +
            </Pill>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              {sizes.map((sz) => (
                <Pill key={sz} onClick={async () => {
                  setAdding(true);
                  try {
                    const detail = { sku: product.id, size: sz };
                    try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail })); } catch {}
                    try { document.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail })); } catch {}
                    // brief green feedback on button itself (handled below via style)
                    await new Promise(r => setTimeout(r, 220));
                  } finally {
                    setAdding(false);
                    setMode('plus');
                  }
                }}>
                  <span style={{
                    padding:'0 2px',
                    borderRadius:6,
                    background: adding ? 'var(--hover-green, #0bf05f)' : '#fff',
                    border:'1px solid rgba(0,0,0,.12)',
                  }}>{sz}</span>
                </Pill>
              ))}
            </div>
          )}
        </div>

        {/* IMPORTANT: remove the grey “back arrow” button; the header orb is the only back control */}
        {/* (kept here as comment for reference)
        <button className="product-hero-close" onClick={onClose}>×</button>
        */}
      </div>
    </div>
  );
}
