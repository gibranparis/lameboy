// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/** @typedef {{id:string,title:string,price:number,img:string,sizes:string[]}} Product */

const FALLBACK = [
  { id: 'tee-black',  title: 'LB Tee — Black',  price: 38, img:'/shop/tee-black.png',  sizes:['XS','S','M','L','XL'] },
  { id: 'tee-white',  title: 'LB Tee — White',  price: 38, img:'/shop/tee-white.png',  sizes:['XS','S','M','L','XL'] },
  { id: 'dad-navy',   title: 'Dad Cap — Navy',  price: 32, img:'/shop/dadcap-navy.png', sizes:['OS'] },
  { id: 'sticker',    title: 'Sticker Pack',    price: 8,  img:'/shop/stickers.png',    sizes:[] },
];

function pillStyle({ active=false, disabled=false } = {}){
  return {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    height:28, minWidth:28, padding:'0 10px',
    borderRadius:9999,
    fontSize:12, fontWeight:800, lineHeight:'1',
    border: active ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.12)',
    color: active ? '#000' : 'rgba(0,0,0,.80)',
    background: active ? '#0bf05f' : '#fff',
    boxShadow: active ? '0 0 0 1px rgba(0,0,0,.15) inset' : 'none',
    opacity: disabled ? .5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition:'background .18s ease, color .18s ease, box-shadow .18s ease',
  } as React.CSSProperties;
}

function Pill({ children, onClick, active=false, disabled=false, title, ariaLabel }){
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      style={pillStyle({ active, disabled })}
    >
      {children}
    </button>
  );
}

function ProductOverlay({ product, onClose }:{
  product: Product, onClose:()=>void
}){
  const [showSizes, setShowSizes] = useState(false);
  const [flashPlus, setFlashPlus] = useState(false);
  const [selected, setSelected] = useState/** @type {string|null} */(null);

  useEffect(() => {
    setShowSizes(false);
    setFlashPlus(false);
    setSelected(null);
  }, [product?.id]);

  const hasSizes = (product?.sizes || []).length > 0;

  const addToCart = useCallback((qty=1) => {
    try {
      window.dispatchEvent(new CustomEvent('cart:add', {
        detail: { qty, productId: product?.id, size: selected }
      }));
    } catch {}
  }, [product?.id, selected]);

  const handlePlus = () => {
    if (!hasSizes) {
      addToCart(1);
      setFlashPlus(true);
      setTimeout(() => setFlashPlus(false), 550);
      return;
    }
    setShowSizes(true);
    setSelected(null);
  };

  const handleChooseSize = (s:string) => {
    setSelected(s);
    addToCart(1);
    setShowSizes(false);
    setFlashPlus(true);
    const t = setTimeout(() => setFlashPlus(false), 550);
    return () => clearTimeout(t);
  };

  return (
    <div
      className="product-hero-overlay"
      aria-modal="true"
      role="dialog"
      onClick={(e)=>{ if (e.target === e.currentTarget) onClose(); }}
      style={{ background:'var(--panel, #fff)', color:'var(--text, #111)' }}
    >
      <div className="product-hero" style={{ alignItems:'center' }}>
        <img className="product-hero-img" src={product.img} alt="" />
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">${product.price.toFixed(2)}</div>

        <div style={{ display:'grid', placeItems:'center', gap:12, marginTop:10 }}>
          {!showSizes ? (
            <Pill onClick={handlePlus} active={flashPlus} title={hasSizes ? 'Choose size' : 'Add to cart'} ariaLabel="+">+</Pill>
          ) : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {product.sizes.map((s) => (
                <Pill key={s} onClick={() => handleChooseSize(s)} active={selected === s} title={`Size ${s}`}>{s}</Pill>
              ))}
            </div>
          )}
        </div>

        {/* ⛔ Removed the explicit close/back button to avoid clutter near the orb */}
      </div>
    </div>
  );
}

export default function ShopGrid({ products }:{products?: Product[]}) {
  const items = useMemo(() => Array.isArray(products) && products.length ? products : FALLBACK, [products]);

  // ===== Grid density ping-pong 1..5 (one step per click) ==================
  const [dir, setDir] = useState(1);
  useEffect(() => {
    const onZoom = () => {
      const root = document.documentElement;
      const cur = parseInt(getComputedStyle(root).getPropertyValue('--grid-cols'),10) || 4;
      let next = cur + dir;
      let nd = dir;
      if (next > 5) { next = 4; nd = -1; }
      if (next < 1) { next = 2; nd = 1; }
      root.style.setProperty('--grid-cols', String(next));
      setDir(nd);
    };
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => { window.removeEventListener('lb:zoom', onZoom); document.removeEventListener('lb:zoom', onZoom); };
  }, [dir]);

  // ===== Overlay state =====================================================
  const [open, setOpen] = useState/** @type {Product|null} */(null);

  return (
    <div className="shop-wrap">
      {!open && (
        <div className="shop-grid">
          {items.map((p) => (
            <a
              key={p.id}
              className="product-tile"
              role="button"
              tabIndex={0}
              onClick={(e)=>{ e.preventDefault(); setOpen(p); }}
              onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setOpen(p); }}}
            >
              <div className="product-box lb-tile">
                <img className="product-img" src={p.img} alt="" />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </div>
      )}

      {open && <ProductOverlay product={open} onClose={()=>setOpen(null)} />}
    </div>
  );
}
