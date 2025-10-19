// @ts-check
// src/components/ShopGrid.jsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

/**
 * Very small demo catalog. If you already have a products source,
 * keep the same shape { id, title, price, image } and wire it up.
 */
const PRODUCTS = [
  { id: 'tee-black',  title: 'LB Tee — Black',  price: 38, image: '/shop/lb-tee-black.png'  },
  { id: 'tee-white',  title: 'LB Tee — White',  price: 38, image: '/shop/lb-tee-white.png'  },
  { id: 'cap-navy',   title: 'Dad Cap — Navy',  price: 32, image: '/shop/dad-cap-navy.png'  },
  { id: 'stick-pack', title: 'Sticker Pack',    price: 12, image: '/shop/stickers.png'      },
];

/** The sizes offered for apparel items */
const SIZES = ['XS','S','M','L','XL'];

export default function ShopGrid({ hideTopRow = false }) {
  // Overlay state
  const [activeId, setActiveId] = useState/** @type {string|null} */(null);
  const active = useMemo(() => PRODUCTS.find(p => p.id === activeId) ?? null, [activeId]);

  // selected size for the overlay
  const [size, setSize] = useState/** @type {string|null} */(null);

  // clear size when switching products / closing
  useEffect(() => { setSize(null); }, [activeId]);

  // emit the zoom step event (+1) for the grid; your orb/back button can also emit -1
  const stepZoom = (delta = 1) => {
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step: delta } })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step: delta } })); } catch {}
  };

  // When there is an overlay, hide the grid below (header stays)
  const showGrid = !active;

  return (
    <div className="shop-wrap">
      {showGrid && (
        <section className="shop-grid" aria-label="Products">
          {PRODUCTS.map((p, i) => (
            <a
              key={p.id}
              className="product-tile lb-tile"
              role="button"
              onClick={(e) => { e.preventDefault(); setActiveId(p.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveId(p.id); } }}
              tabIndex={0}
            >
              <div className="product-box">
                {/* product image */}
                <img className="product-img" alt={p.title} src={p.image} draggable={false} />
              </div>
              <div className="product-meta">{p.title}</div>
            </a>
          ))}
        </section>
      )}

      {/* ----- PRODUCT OVERLAY ----- */}
      {active && (
        <div className="product-hero-overlay" role="dialog" aria-modal="true" aria-label={active.title}>
          <div className="product-hero">
            {/* IMAGE — centered */}
            <img
              className="product-hero-img"
              src={active.image}
              alt={active.title}
              draggable={false}
              style={{
                display:'block',
                margin:'0 auto',
              }}
            />

            {/* TITLE + PRICE */}
            <div style={{ textAlign:'center' }}>
              <div className="product-hero-title" style={{ marginTop: 10 }}>{active.title}</div>
              <div className="product-hero-price" style={{ marginTop: 6 }}>
                ${active.price.toFixed(2)}
              </div>
            </div>

            {/* SIZE PICKER — centered; no “Size” label */}
            <div
              aria-label="Choose size"
              style={{
                display:'flex',
                justifyContent:'center',
                gap:10,
                marginTop:18,
                flexWrap:'wrap'
              }}
            >
              {SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className="product-size-pill"
                  aria-pressed={size === s}
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

            {/* ADD TO CART — “+”, black => turns GREEN when size selected */}
            <div style={{ display:'grid', placeItems:'center', width:'100%', marginTop:18 }}>
              <button
                type="button"
                disabled={!size}
                onClick={() => {
                  if (!size) return;
                  // TODO: wire to your cart
                  // bump badge etc
                }}
                style={{
                  // same width as previous long button but visually simple
                  minWidth:'min(640px, 92vw)',
                  height:44,
                  borderRadius:12,
                  border:'1px solid rgba(0,0,0,.12)',
                  fontFamily:'var(--mono)',
                  fontSize:'16px',      // “same size as the rest of the words”
                  fontWeight:800,
                  letterSpacing:'.02em',
                  lineHeight:1,
                  cursor: size ? 'pointer' : 'default',
                  color: size ? '#000' : '#fff',
                  background: size ? 'var(--hover-green, #0bf05f)' : '#000',
                  opacity: size ? 1 : 1, // keep black, not grey
                  transition:'transform .12s ease, background .15s ease, color .15s ease',
                }}
                onMouseDown={(e)=> e.currentTarget.style.transform = 'translateY(1px)'}
                onMouseUp={(e)=> e.currentTarget.style.transform = 'translateY(0)'}
              >
                +
              </button>
            </div>

            {/* CLOSE (kept invisible button for a11y, orb handles “back”) */}
            <button
              aria-label="Close"
              onClick={() => setActiveId(null)}
              style={{
                position:'fixed', inset:'24px auto auto 24px',
                width:1, height:1, opacity:0, pointerEvents:'none'
              }}
              tabIndex={-1}
            />
          </div>
        </div>
      )}
    </div>
  );
}
