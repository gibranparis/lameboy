// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // ----- stable fallback catalog (5 colors) -----
  const FALLBACK = [
    { id: 'hood-brown', title: 'Brown', image: '/products/brown.png?v=1', price: 4000, sizes: ['S','M','L','XL'] },
    { id: 'hood-black', title: 'Black', image: '/products/black.png?v=1', price: 4000, sizes: ['S','M','L','XL'] },
    { id: 'hood-gray',  title: 'Gray',  image: '/products/gray.png?v=1',  price: 4000, sizes: ['S','M','L','XL'] },
    { id: 'hood-green', title: 'Green', image: '/products/green.png?v=1', price: 4000, sizes: ['S','M','L','XL'] },
    { id: 'hood-blue',  title: 'Blue',  image: '/products/blue.png?v=1',  price: 4000, sizes: ['S','M','L','XL'] },
  ];

  // choose source: prop (>=2) else window (>=2) else fallback (5)
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : [];
    // eslint-disable-next-line no-undef
    const fromWin  = (typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)) ? window.__LB_PRODUCTS : [];

    if (fromProp.length >= 2) return fromProp;
    if (fromWin.length  >= 2) return fromWin;

    // if 0 or 1 provided, prefer full fallback catalog to avoid “Brown #1..#5”
    return FALLBACK;
  }, [products]);

  // ----- overlay state -----
  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);
  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  // ----- grid density (1..5 via orb) -----
  const MIN_COLS = 1;
  const MAX_COLS = 5;
  const [cols, setCols] = useState(MAX_COLS);

  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',      { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, []);

  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next|0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  useEffect(() => { applyCols(cols); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }
      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir  = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  return setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; });
      if (dir === 'out') return setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; });

      return setCols((p) => {
        const goingIn = p > MIN_COLS;
        const n = goingIn ? Math.max(MIN_COLS, p - 1) : Math.min(MAX_COLS, p + 1);
        applyCols(n); return n;
      });
    };
    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, applyCols]);

  // make 5-up tiles a touch larger
  const tileScale = cols === 5 ? 1.14 : 1.0;

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid" style={{ '--grid-cols': cols, '--tile-scale': tileScale }}>
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(idx); }}
            onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(idx); }}}
          >
            <div className="product-box" style={{ transform:'scale(var(--tile-scale,1))', transformOrigin:'top left' }}>
              <Image
                src={p.image}
                alt={p.title}
                width={900}
                height={900}
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
          onIndexChange={(i) => setOverlayIdx(((i % seed.length) + seed.length) % seed.length)}
          onClose={close}
        />
      )}
    </div>
  );
}
