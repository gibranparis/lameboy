// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    // Fallback single product → clone for smooth overlay nav
    const base =
      (fromProp && fromProp.length)
        ? fromProp
        : (fromWin && fromWin.length)
          ? fromWin
          : [{
              id: 'brown-hoodie',
              title: 'Brown Hoodie',
              price: 6500, // $65.00
              image: '/products/lame-hoodie-brown.png',
              images: ['/products/lame-hoodie-brown.png'],
              sizes: ['S','M','L','XL'],
            }];

    if (base.length >= 2) return base;

    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: `${base[0].title} ${i ? `#${i + 1}` : ''}`.trim(),
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === Grid density 1↔5 ===
  const MIN_COLS = 1;
  const MAX_COLS = 5;
  const [cols, setCols] = useState(MAX_COLS);
  const [towardMin, setTowardMin] = useState(true);

  const applyCols = useCallback((next, dirHint /** 'in' | 'out' | null */) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next | 0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}

    const inferred =
      dirHint ??
      (clamped < cols ? 'in' : clamped > cols ? 'out' : (towardMin ? 'in' : 'out'));

    const detail = { density: clamped, value: clamped, dir: inferred };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density', { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:grid-density', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, towardMin]);

  useEffect(() => {
    applyCols(cols, 'out'); // set CSS var + broadcast once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIn  = useCallback((step = 1) => applyCols(cols - step, 'in'),  [applyCols, cols]);
  const stepOut = useCallback((step = 1) => applyCols(cols + step, 'out'), [applyCols, cols]);

  const pingPong = useCallback(() => {
    const next = towardMin ? Math.max(MIN_COLS, cols - 1) : Math.min(MAX_COLS, cols + 1);
    if (next === MIN_COLS) setTowardMin(false);
    if (next === MAX_COLS) setTowardMin(true);
    applyCols(next, towardMin ? 'in' : 'out');
  }, [cols, towardMin, applyCols]);

  // orb → density OR overlay close
  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir  = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  { setTowardMin(true);  return stepIn(step);  }
      if (dir === 'out') { setTowardMin(false); return stepOut(step); }

      pingPong();
    };

    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [overlayIdx, stepIn, stepOut, pingPong]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
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
                width={1000}
                height={750}
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
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(seed.length - 1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
