'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ProductOverlay from './ProductOverlay';

// Simple static catalog (use your real data or CMS later)
const CATALOG = [
  { id:'tee-black',  title:'LB Tee — Black',  price:3800, img:'/products/tee-black.png'  },
  { id:'tee-white',  title:'LB Tee — White',  price:3800, img:'/products/tee-white.png'  },
  { id:'dad-navy',   title:'Dad Cap — Navy',  price:3200, img:'/products/dad-navy.png'   },
  { id:'stickers',   title:'Sticker Pack',    price:1200, img:'/products/stickers.png'   },
];

const MIN_COLS = 1;
const MAX_COLS = 5;

export default function ShopGrid() {
  const rootRef = useRef(null);
  const [cols, setCols] = useState(() => {
    const saved = Number(localStorage.getItem('lb:gridcols') || '4');
    return Math.min(MAX_COLS, Math.max(MIN_COLS, saved || 4));
  });
  const [dir, setDir] = useState(1); // ping-pong direction
  const [open, setOpen] = useState(null); // product id open in overlay

  // set CSS var for grid columns
  useEffect(() => {
    const el = document.documentElement;
    el.style.setProperty('--grid-cols', String(cols));
    try { localStorage.setItem('lb:gridcols', String(cols)); } catch {}
  }, [cols]);

  // Orb behavior: close overlay else step 1..5..1 ping-pong
  useEffect(() => {
    const onOrb = () => {
      if (open) { setOpen(null); return; }
      setCols((c) => {
        let next = c + dir;
        if (next > MAX_COLS) { next = MAX_COLS - 1; setDir(-1); }
        else if (next < MIN_COLS) { next = MIN_COLS + 1; setDir(1); }
        return next;
      });
    };
    window.addEventListener('shop:orb', onOrb);
    document.addEventListener('shop:orb', onOrb);
    return () => {
      window.removeEventListener('shop:orb', onOrb);
      document.removeEventListener('shop:orb', onOrb);
    };
  }, [open, dir]);

  // announce overlay state (useful if other components care)
  useEffect(() => {
    const evt = new CustomEvent('overlay:state', { detail: { open: !!open } });
    try { window.dispatchEvent(evt); } catch {}
  }, [open]);

  const items = useMemo(() => CATALOG, []);

  return (
    <div className="shop-wrap">
      <div className="shop-grid" aria-label="Products grid" ref={rootRef} style={{ padding:'24px' }}>
        {items.map(p => (
          <button
            key={p.id}
            className="product-tile lb-tile"
            onClick={() => setOpen(p.id)}
            title={p.title}
            style={{ background:'transparent', border:0, cursor:'pointer' }}
          >
            <div className="product-box">
              <img className="product-img" src={p.img} alt={p.title} loading="lazy" />
            </div>
            <div className="product-meta">{p.title}</div>
          </button>
        ))}
      </div>

      {open && (
        <ProductOverlay
          product={items.find(i => i.id === open)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
