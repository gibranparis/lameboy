// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/** Demo catalog */
const PRODUCTS = [
  { id: 'tee-black',  title: 'LB Tee — Black',  price: 38, image: '/shop/lb-tee-black.png'  },
  { id: 'tee-white',  title: 'LB Tee — White',  price: 38, image: '/shop/lb-tee-white.png'  },
  { id: 'cap-navy',   title: 'Dad Cap — Navy',  price: 32, image: '/shop/dad-cap-navy.png'  },
  { id: 'stick-pack', title: 'Sticker Pack',    price: 12, image: '/shop/stickers.png'      },
];

const SIZES = ['XS','S','M','L','XL'];

export default function ShopGrid({ hideTopRow = false }) {
  const [activeId, setActiveId] = useState/** @type {string|null} */(null);
  const active = useMemo(() => PRODUCTS.find(p => p.id === activeId) ?? null, [activeId]);

  const [size, setSize] = useState/** @type {string|null} */(null);
  useEffect(() => { setSize(null); }, [activeId]);

  // === Grid zoom (2..5 wrap) controlled by CSS var --grid-cols ============
  const [cols, setCols] = useState(() => {
    const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols') || '4', 10);
    return isNaN(v) ? 4 : v;
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-cols', String(cols));
  }, [cols]);

  // Mark overlay state on <html> so other code can read if needed
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.setAttribute('data-overlay-open', '');
    else root.removeAttribute('data-overlay-open');
  }, [active]);

  // Single orb event: close overlay if open; otherwise zoom grid +1
  useEffect(() => {
    const onOrb = () => {
      if (active) {
        setActiveId(null);
      } else {
        setCols(c => (c >= 5 ? 2 : c + 1));
      }
    };
    window.addEventListener('lb:orb-tap', onOrb);
    document.addEventListener('lb:orb-tap', onOrb);
    return () => {
      window.removeEventListener('lb:orb-tap', onOrb);
      document.removeEventListener('lb:orb-tap', onOrb);
    };
  }, [active]);

  const showGrid = !active;

  return (
    <div className="shop-wrap">
      {showGrid && (
        <section className="shop-grid" aria-label="Products">
          {PRODUCTS.map((p) => (
            <a
              key={p.id}
              className="product-tile lb-tile"
              role="button"
              onClick={(e) => { e.preventDefault(); setActiveId(p.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveId(p.id); } }}
              tabIndex={0}
            >
              <div className="product-box">
                <img className="product-img" alt={p.title} src={p.image} draggable={false} />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </section>
      )}

      {/* Overlay */}
      {active && (
        <div className="product-hero-overlay" role="dialog" aria-modal="true" aria-label={active.title}>
          <div className="product-hero">
            {/* IMAGE (centered) */}
            <img
              className="product-hero-img"
              src={active.image}
              alt={active.title}
              draggable={false}
              style={{ display:'block', margin:'0 auto' }}
            />

            {/* TITLE + PRICE */}
            <div style={{ textAlign:'center' }}>
              <div className="product-hero-title" style={{ marginTop:10 }}>{active.title}</div>
              <div className="product-hero-price" style={{ marginTop:6 }}>${active.price.toFixed(2)}</div>
            </div>

            {/* SIZE CHIPS */}
            <div
              aria-label="Choose size"
              style={{
                display:'flex', justifyContent:'center', gap:10, marginTop:18, flexWrap:'wrap'
              }}
            >
              {SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className="product-size-pill"
                  style={{
                    border:'1px solid rgba(0,0,0,.15)',
                    background: size === s ? 'rgba(0,0,0,.08)' : '#fff',
                    color:'#111',
                    borderRadius:10,
                    padding:'8px 12px',
                    fontFamily:'var(--mono)',
                    fontSize:'14px',
                    fontWeight:700,
                    lineHeight:1,
                    cursor:'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* “+” BUTTON — pill like the size chips.
                WHITE by default, turns GREEN when a size is selected. */}
            <div style={{ display:'grid', placeItems:'center', marginTop:18 }}>
              <button
                type="button"
                disabled={!size}
                onClick={() => {
                  if (!size) return;
                  // TODO: hook into your cart add logic
                }}
                style={{
                  border:'1px solid rgba(0,0,0,.15)',
                  borderRadius:10,
                  padding:'8px 14px',
                  fontFamily:'var(--mono)',
                  fontSize:'14px',
                  fontWeight:800,
                  lineHeight:1,
                  letterSpacing:'.02em',
                  cursor: size ? 'pointer' : 'default',
                  background: size ? 'var(--hover-green, #0bf05f)' : '#fff', // white → green
                  color: size ? '#000' : '#111',
                  transition:'background .15s ease, transform .12s ease',
                }}
                onMouseDown={(e)=> e.currentTarget.style.transform = 'translateY(1px)'}
                onMouseUp={(e)=> e.currentTarget.style.transform = 'translateY(0)'}
              >
                +
              </button>
            </div>

            {/* Hidden close (orb acts as back) */}
            <button
              aria-label="Close"
              onClick={() => setActiveId(null)}
              style={{ position:'fixed', inset:'24px auto auto 24px', width:1, height:1, opacity:0, pointerEvents:'none' }}
              tabIndex={-1}
            />
          </div>
        </div>
      )}
    </div>
  );
}
