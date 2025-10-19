// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Basic product sample fallback. If you already inject products from elsewhere,
 * you can pass `products` prop and ignore this.
 */
const FALLBACK = [
  { id: 'tee-black',  title: 'LB Tee — Black',  price: 38, img:'/shop/tee-black.png',  sizes:['XS','S','M','L','XL'] },
  { id: 'tee-white',  title: 'LB Tee — White',  price: 38, img:'/shop/tee-white.png',  sizes:['XS','S','M','L','XL'] },
  { id: 'dad-navy',   title: 'Dad Cap — Navy',  price: 32, img:'/shop/dadcap-navy.png', sizes:['OS'] },
  { id: 'sticker',    title: 'Sticker Pack',    price: 8,  img:'/shop/stickers.png',    sizes:[] },
];

/** @typedef {{id:string,title:string,price:number,img:string,sizes:string[]}} Product */

function cls(...xs){ return xs.filter(Boolean).join(' '); }

/** Tiny pill button (used for sizes and the + button) */
function Pill({ children, onClick, active, disabled, title, ariaLabel }){
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={cls(
        'inline-flex items-center justify-center rounded-full border text-[12px] font-[800]',
        'transition-colors',
        'h-[28px] min-w-[28px] px-[10px]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        active
          ? 'bg-[#0bf05f] border-transparent text-black shadow-[0_0_0_1px_rgba(0,0,0,.15)]'
          : 'bg-white border-black/12 text-black/80 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/30'
      )}
      style={{ lineHeight: '1' }}
    >
      {children}
    </button>
  );
}

/** Product overlay / hero */
function ProductOverlay({
  product, onClose
}){
  const [showSizes, setShowSizes] = useState(false);     // "+ only" vs "sizes"
  const [flashPlus, setFlashPlus] = useState(false);     // green flash on +
  const [selected, setSelected] = useState/** @type {string|null} */(null);

  // Reset UI when product changes
  useEffect(() => {
    setShowSizes(false);
    setFlashPlus(false);
    setSelected(null);
  }, [product?.id]);

  const hasSizes = (product?.sizes || []).length > 0;

  const handlePlus = () => {
    // Tap + → reveal sizes
    setShowSizes(true);
    setSelected(null);
  };

  const addToCart = useCallback((qty=1) => {
    try {
      window.dispatchEvent(new CustomEvent('cart:add', {
        detail: { qty, productId: product?.id, size: selected }
      }));
    } catch {}
  }, [product?.id, selected]);

  const handleChooseSize = (s /** @type {string} */) => {
    setSelected(s);
    // Perform add-to-cart immediately
    addToCart(1);
    // Hide sizes and show + with green flash briefly
    setShowSizes(false);
    setFlashPlus(true);
    const id = setTimeout(() => setFlashPlus(false), 550);
    return () => clearTimeout(id);
  };

  return (
    <div
      className="product-hero-overlay"
      aria-modal="true"
      role="dialog"
      onClick={(e)=>{ if (e.target === e.currentTarget) onClose(); }}
      style={{ background:'var(--panel, #fff)', color:'var(--text, #111)' }}
    >
      <div className="product-hero">
        <img className="product-hero-img" src={product.img} alt="" />
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">${product.price.toFixed(2)}</div>

        {/* Controls area */}
        <div style={{ display:'grid', placeItems:'center', gap:12, marginTop:10 }}>
          {/* Either the + pill OR the sizes */}
          {!showSizes ? (
            <Pill
              onClick={hasSizes ? handlePlus : () => { /* no sizes → add directly */ addToCart(1); setFlashPlus(true); setTimeout(()=>setFlashPlus(false), 550); }}
              active={flashPlus}
              title={hasSizes ? 'Choose size' : 'Add to cart'}
              ariaLabel="+"
            >
              +
            </Pill>
          ) : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {product.sizes.map((s) => (
                <Pill
                  key={s}
                  onClick={() => handleChooseSize(s)}
                  active={selected === s}
                  title={`Size ${s}`}
                >
                  {s}
                </Pill>
              ))}
            </div>
          )}
        </div>

        <button
          className="product-hero-close"
          onClick={onClose}
          aria-label="Close"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

/** Main grid */
export default function ShopGrid({ products }) {
  /** @type {Product[]} */
  const items = useMemo(() => Array.isArray(products) && products.length ? products : FALLBACK, [products]);

  // ===== Grid density ping-pong 1..5 ======================================
  const [cols, setCols] = useState(() => {
    const root = document.documentElement;
    const v = parseInt(getComputedStyle(root).getPropertyValue('--grid-cols'),10);
    return Number.isFinite(v) && v>0 ? v : 4;
  });
  const [dir, setDir] = useState(1); // 1 increasing, -1 decreasing

  const applyCols = useCallback((n) => {
    const m = Math.max(1, Math.min(5, n|0));
    setCols(m);
    try {
      document.documentElement.style.setProperty('--grid-cols', String(m));
    } catch {}
  }, []);

  useEffect(() => {
    const onZoom = (/** @type {CustomEvent<{step?:number}>} */ e) => {
      // Ignore provided step. We ping-pong 1↔5:
      setCols((prev) => {
        let next = prev + dir;
        let nd = dir;
        if (next > 5) { next = 4; nd = -1; }
        if (next < 1) { next = 2; nd = 1; }
        setDir(nd);
        const clamped = Math.max(1, Math.min(5, next));
        try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
        return clamped;
      });
    };
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [dir]);

  // ===== Overlay state =====================================================
  const [open, setOpen] = useState/** @type {Product|null} */(null);

  const onTile = (p /** @type {Product} */) => setOpen(p);
  const onClose = () => setOpen(null);

  return (
    <div className="shop-wrap">
      {/* When overlay is open, hide the grid (but keep header) */}
      {!open && (
        <div className="shop-grid">
          {items.map((p) => (
            <a
              key={p.id}
              className="product-tile"
              role="button"
              tabIndex={0}
              onClick={(e)=>{ e.preventDefault(); onTile(p); }}
              onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onTile(p); }}}
            >
              <div className="product-box lb-tile">
                <img className="product-img" src={p.img} alt="" />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </div>
      )}

      {open && (
        <ProductOverlay product={open} onClose={onClose} />
      )}
    </div>
  );
}
