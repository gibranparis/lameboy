// src/components/ShopGrid.jsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

/**
 * Minimal product list stub — replace with your real data.
 */
const PRODUCTS = [
  { id: 'tee-black',  title: 'LB Tee — Black',  price: 38, img: '/products/lb-tee-black.png'  },
  { id: 'tee-white',  title: 'LB Tee — White',  price: 38, img: '/products/lb-tee-white.png'  },
  { id: 'cap-navy',   title: 'Dad Cap — Navy',  price: 32, img: '/products/dad-cap-navy.png' },
  { id: 'sticker',    title: 'Sticker Pack',    price: 12, img: '/products/sticker-pack.png'  },
];

/**
 * ShopGrid
 * - Defaults to 5 columns on mount.
 * - Orb click (CustomEvent 'lb:zoom' on document) steps grid by EXACTLY 1,
 *   bouncing: 5→4→3→2→1→2→3→4→5→…
 * - If overlay is open, an orb click closes overlay instead of changing columns.
 */
export default function ShopGrid({ hideTopRow = false }) {
  const [cols, setCols] = useState(5);     // 1..5
  const [dir, setDir]   = useState(-1);    // current direction (start stepping down)
  const [overlay, setOverlay] = useState/** @type {null | {id:string}} */(null);

  // Force CSS var to 5 on mount (default grid)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--grid-cols', '5');
    setCols(5);
  }, []);

  // Listen to single-source zoom events
  useEffect(() => {
    const onZoom = (e) => {
      // If a product overlay is open, orb acts as BACK/close.
      if (overlay) {
        setOverlay(null);
        return;
      }

      // Single precise ladder step
      setCols((prev) => {
        let nextDir = dir;
        if (prev === 5 && dir === 1) nextDir = -1;
        if (prev === 1 && dir === -1) nextDir = 1;

        const next = prev + nextDir;
        // clamp for safety, then reflect direction if at ends
        const clamped = Math.max(1, Math.min(5, next));
        setDir(nextDir);
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--grid-cols', String(clamped));
        });
        return clamped;
      });
    };

    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [dir, overlay]);

  const openOverlay = (id) => setOverlay({ id });
  const closeOverlay = () => setOverlay(null);

  const gridStyle = useMemo(() => ({
    padding: '24px 24px 80px',
  }), []);

  return (
    <div className="shop-page">
      {/* GRID */}
      <div className="shop-grid" style={gridStyle} aria-hidden={!!overlay}>
        {PRODUCTS.map((p) => (
          <a
            key={p.id}
            className="product-tile"
            role="button"
            tabIndex={0}
            onClick={() => openOverlay(p.id)}
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openOverlay(p.id); }}
          >
            <div className="product-box">
              {/* Use next/image if your files exist, else plain img */}
              <img className="product-img" src={p.img} alt={p.title} />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {/* OVERLAY */}
      {overlay && (
        <div className="product-hero-overlay" role="dialog" aria-modal="true">
          <div className="product-hero">
            {/* Hide the old gray back button; orb in header is the back control */}
            {/* <button className="product-hero-close" onClick={closeOverlay} aria-label="Close">←</button> */}

            {(() => {
              const prod = PRODUCTS.find((x) => x.id === overlay.id);
              if (!prod) return null;
              return (
                <>
                  <img className="product-hero-img" src={prod.img} alt={prod.title} />
                  <div className="product-hero-title">{prod.title}</div>
                  <div className="product-hero-price">${prod.price.toFixed(2)}</div>

                  {/* Your existing size / + flow can live here */}
                  {/* We keep UI minimal so the orb behavior is the focus */}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
