// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === grid density (orb) — bounce 5↔1 with each click ===
  const [cols, setCols] = useState(5);
  const [down, setDown] = useState(true);

  const stepCols = useCallback(() => {
    setCols((prev) => {
      let next = prev;
      if (down) next = Math.max(1, prev - 1);
      else next = Math.min(5, prev + 1);
      let nextDown = down;
      if (next === 1) nextDown = false;
      if (next === 5) nextDown = true;
      setDown(nextDown);
      document.documentElement.style.setProperty('--grid-cols', String(next));
      return next;
    });
  }, [down]);

  // orb → density OR overlay close
  useEffect(() => {
    const onZoom = () => {
      if (overlayIdx != null) setOverlayIdx(null);
      else stepCols();
    };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, stepCols]);

  const open = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);

  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {products.map((p, idx) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(idx); }}
            onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(idx); }}}
          >
            <div className="product-box">
              <Image
                src={p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx===0}
                unoptimized
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayOpen && (
        <ProductOverlay
          products={products}
          index={overlayIdx}
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(products.length-1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
