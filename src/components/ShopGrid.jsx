'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Dummy products. Replace with your data source.
const PRODUCTS = [
  { id:'tee-black',  title:'LB Tee — Black',  price:3800, img:'/products/lb-tee-black.png'  },
  { id:'tee-white',  title:'LB Tee — White',  price:3800, img:'/products/lb-tee-white.png'  },
  { id:'cap-navy',   title:'Dad Cap — Navy',  price:3200, img:'/products/dad-cap-navy.png' },
  { id:'stick-pack', title:'Sticker Pack',    price:1200, img:'/products/stickers.png'     },
];

const money = c => `$${(c/100).toFixed(2)}`;

function Pill({ children, onClick, active=false, disabled=false, ariaLabel, title }){
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      aria-label={ariaLabel} title={title}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        minWidth:28, height:28, padding:'0 10px', borderRadius:10,
        background:'#fff', color:'#111', border:'1px solid rgba(0,0,0,.1)',
        boxShadow:'0 1px 0 rgba(0,0,0,.04)',
        opacity: disabled ? .5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition:'background .18s ease, color .18s ease, box-shadow .18s ease',
        ...(active ? { outline:'2px solid rgba(74,165,255,.9)', outlineOffset:2 } : {})
      }}
    >{children}</button>
  );
}

export default function ShopGrid({ hideTopRow=false }){
  const [cols, setCols] = useState(4);
  const [dir,  setDir]  = useState(1); // ping-pong
  const [overlay, setOverlay] = useState/** @type {null|{id:string}} */(null);

  // keep CSS var in sync
  useEffect(()=>{ document.documentElement.style.setProperty('--grid-cols', String(cols)); },[cols]);

  // expose overlay state for header orb
  useEffect(()=>{
    document.body.dataset.overlay = overlay ? '1' : '0';
  },[overlay]);

  // zoom handler: cycle 1..5 ping-pong
  useEffect(()=>{
    const onZoom = (e)=>{
      const step = Number(e?.detail?.step ?? 1);
      if (overlay){ // while overlay is open, ignore zoom steps
        return;
      }
      setCols(c=>{
        let d = dir;
        let next = c + d*step;
        if (next>5){ next = 4; d = -1; }
        if (next<1){ next = 2; d = 1;  }
        setDir(d);
        return next;
      });
    };
    const onCloseOverlay = ()=> setOverlay(null);

    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    window.addEventListener('lb:close-overlay', onCloseOverlay);
    document.addEventListener('lb:close-overlay', onCloseOverlay);
    return ()=> {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('lb:close-overlay', onCloseOverlay);
      document.removeEventListener('lb:close-overlay', onCloseOverlay);
    };
  },[overlay,dir]);

  const open = useCallback((id)=> setOverlay({ id }),[]);
  const close = useCallback(()=> setOverlay(null),[]);

  return (
    <div className="shop-wrap">
      {/* GRID (hidden when overlay) */}
      {!overlay && (
        <div className="shop-grid">
          {PRODUCTS.map(p=>(
            <a key={p.id} className="product-tile lb-tile" href="#" onClick={(e)=>{ e.preventDefault(); open(p.id); }}>
              <div className="product-box">
                <img className="product-img" src={p.img} alt={p.title} />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </div>
      )}

      {/* OVERLAY */}
      {overlay && <ProductOverlay product={PRODUCTS.find(x=>x.id===overlay.id)!} onClose={close} />}
    </div>
  );
}

function ProductOverlay({ product, onClose }){
  const [mode, setMode] = useState<'plus'|'sizes'>('plus'); // plus pill first
  const [adding, setAdding] = useState(false);

  const sizes = ['XS','S','M','L','XL'];

  // Header orb -> back
  useEffect(()=>{
    const onClose = ()=> onClose();
    window.addEventListener('lb:close-overlay', onClose);
    document.addEventListener('lb:close-overlay', onClose);
    return ()=>{ window.removeEventListener('lb:close-overlay', onClose); document.removeEventListener('lb:close-overlay', onClose); };
  },[onClose]);

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <div className="product-hero">
        <img className="product-hero-img" src={product.img} alt={product.title}/>
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{money(product.price)}</div>

        {/* Interaction area */}
        <div style={{ display:'grid', placeItems:'center', gap:10 }}>
          {mode==='plus' ? (
            <Pill ariaLabel="Choose size" title="Choose size" onClick={()=>setMode('sizes')}>
              <span style={{
                width:16, height:16, borderRadius:999, background:'#fff', display:'grid', placeItems:'center',
                color:'#111', border:'1px solid rgba(0,0,0,.2)'
              }}>+</span>
            </Pill>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              {sizes.map(sz=>(
                <Pill
                  key={sz}
                  onClick={async ()=>{
                    // flash green on the size, add to cart, then return to plus mode
                    setAdding(true);
                    try{
                      // send add-to-cart
                      const detail = { sku:product.id, size:sz };
                      try { window.dispatchEvent(new CustomEvent('lb:add-to-cart',{ detail })); } catch {}
                      try { document.dispatchEvent(new CustomEvent('lb:add-to-cart',{ detail })); } catch {}
                      await new Promise(r=>setTimeout(r,240));
                    } finally {
                      setAdding(false);
                      setMode('plus');
                    }
                  }}
                >
                  <span style={{
                    padding:'0 2px',
                    borderRadius:6,
                    background: adding ? '#0bf05f' : '#fff',
                    border:'1px solid rgba(0,0,0,.12)'
                  }}>{sz}</span>
                </Pill>
              ))}
            </div>
          )}
        </div>

        {/* Close with ESC */}
        <button className="product-hero-close" aria-label="Close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
