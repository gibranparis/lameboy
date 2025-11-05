// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

/**
 * Grid of shop products with density control (1..5) driven by the orb.
 * - If only one product is available, we create virtual clones so the overlay
 *   can move up/down without feeling like it "exits".
 */
export default function ShopGrid({ products }) {
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;

    // ✅ Prefer prop; otherwise use our hoodie fallback
    const base = (fromProp && fromProp.length) ? fromProp : [{
      id: 'brown-hoodie',
      title: 'Brown',                          // ← label
      price: 4000,                             // ← $40.00
      image: '/products/lame-hoodie-brown.png',
      images: ['/products/lame-hoodie-brown.png'],
      sizes: ['S','M','L','XL','XXL'],
    }];

    if (base.length >= 2) return base;

    // Create a few virtual clones so overlay has vertical navigation
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: `${base[0].title}${i ? ` #${i + 1}` : ''}`,
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === Grid density (1..5) ===============================================
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);

  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',       { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:grid-density',       { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density',  { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:zoom/grid-density',  { detail })); } catch {}
  }, []);

  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next | 0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  // Initial density broadcast
  useEffect(() => { applyCols(cols); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Respond to orb zoom events
  useEffect(() => {
    /** @param {CustomEvent<{step?:number, dir?:'in'|'out'}>} e */
    const onZoom = (e) => {
      // If overlay is open, zoom acts as "close" (back to grid)
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir  = (d.dir === 'in' || d.dir === 'out') ? d.dir : null;

      if (dir === 'in')  { setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; }); return; }
      if (dir === 'out') { setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; }); return; }

      // Legacy ping-pong when no explicit direction is sent
      setCols((p) => {
        const goingIn = p > MIN_COLS;
        const n = goingIn ? Math.max(MIN_COLS, p - 1) : Math.min(MAX_COLS, p + 1);
        applyCols(n);
        return n;
      });
    };

    // Listen on both targets so any emitter works
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [overlayIdx, applyCols]);

  // Overlay helpers
  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  // Safe modulo indexer for wrap-around
  const wrap = (i, len) => ((i % len) + len) % len;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
      {/* CSS var is read by styles; providing a numeric fallback for SSR */}
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); open(idx); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); } }}
          >
            <div className="product-box">
              <Image
                src={p.image}
                alt={p.title}
                width={1200}
                height={900}
                className="product-img"
                priority={idx === 0}
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
          onIndexChange={(i) => setOverlayIdx(wrap(i, seed.length))}
          onClose={close}
        />
      )}
    </div>
  );
}
