// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // Robust product source:
  // 1) prop
  // 2) window.__LB_PRODUCTS (if you inject from backend)
  // 3) tiny demo list cloned if only one item exists (prevents “scroll up exits” feeling)
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin = typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS) ? window.__LB_PRODUCTS : null;

    const base = (fromProp && fromProp.length) ? fromProp
              : (fromWin && fromWin.length)     ? fromWin
              : [{
                  id: 'demo-1',
                  title: 'LAME Cap – Brown',
                  price: 4200,
                  image: '/products/lame-cap-brown.png',
                  images: ['/products/lame-cap-brown.png'],
                  sizes: ['OS']
                }];

    if (base.length >= 2) return base;

    // If only one product is present, make a few virtual clones so the overlay
    // can move up/down. These are placeholders only.
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} ${i ? `#${i+1}` : ''}`.trim(),
    }));
    return clones;
  }, [products]);

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
      try { document.documentElement.style.setProperty('--grid-cols', String(next)); } catch {}
      return next;
    });
  }, [down]);

  // orb → density OR overlay close
  useEffect(() => {
    const onZoom = () => {
      if (overlayIdx != null) setOverlayIdx(null);
      else stepCols();
    };
    // Use document only to avoid double fires
    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, stepCols]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      {/* CSS var inline is fine in React */}
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
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
          products={seed}
          index={overlayIdx}
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(seed.length-1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
