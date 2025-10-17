// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string; images?: any }} Product */

export default function ShopGrid({ products = [], hideTopRow = false, columns }) {
  // Fallback items (until you wire real inventory)
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',  image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',  image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',  image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',    image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  const [selected, setSelected] = useState/** @type {Product|null} */(null);

  // Columns state (1..5), starts at 5 for “zoom in” direction
  const [perRow, setPerRow] = useState(MAX_COLS);
  // @ts-ignore
  const [zoomDir, setZoomDir] = useState/** @type {'in'|'out'} */('in');
  const [fromCascade, setFromCascade] = useState(false);

  // Accept controlled columns
  useEffect(() => {
    if (typeof columns === 'number') {
      const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(columns)));
      setPerRow(clamped);
    }
  }, [columns]);

  // Optional first-visit animation
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // Step helper with bounce at ends (infinite +/- loop)
  const stepDensity = useCallback((delta = 1) => {
    const isIn = zoomDir === 'in';
    let next = perRow + (isIn ? -delta : +delta);

    if (next < MIN_COLS) { next = MIN_COLS + 1; setZoomDir('out'); }
    else if (next > MAX_COLS) { next = MAX_COLS - 1; setZoomDir('in'); }

    setPerRow(next);
  }, [perRow, zoomDir]);

  /** Unified event handler for both event names. */
  const handleZoomEvent = useCallback((/** @type {CustomEvent<{ step?: number, dir?: 'in'|'out' }>} */ e) => {
    const step = Number(e?.detail?.step ?? 1);
    const dir  = e?.detail?.dir;
    if (dir === 'in' || dir === 'out') setZoomDir(dir);
    console.log('[grid] zoom event', { step, dir });
    if (typeof columns !== 'number') stepDensity(step);
  }, [columns, stepDensity]);

  // Listen on window AND document (belt & suspenders)
  useEffect(() => {
    const onZoom   = (e) => handleZoomEvent(e);
    const onLegacy = (e) => handleZoomEvent(e);

    window.addEventListener('lb:zoom', onZoom);
    window.addEventListener('grid-density', onLegacy);
    document.addEventListener('lb:zoom', onZoom);
    document.addEventListener('grid-density', onLegacy);

    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('grid-density', onLegacy);
      document.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('grid-density', onLegacy);
    };
  }, [handleZoomEvent]);

  // 👇 Inline style forces actual grid layout regardless of Tailwind
  const gridStyle = useMemo(() => ({
    display: 'grid',
    gap: '28px',
    gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
    alignItems: 'start',
  }), [perRow]);

  return (
    <section className={['px-6 pb-24 pt-10', fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : ''].join(' ')}>
      {/* Optional top controls (handy if you want to see col changes numerically) */}
      {!hideTopRow && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Density −"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => { setZoomDir('in'); stepDensity(1); }}
            >−</button>
            <div className="text-xs tabular-nums opacity-60">cols: {perRow}</div>
            <button
              aria-label="Density +"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => { setZoomDir('out'); stepDensity(1); }}
            >+</button>
          </div>
          <CartButton />
        </div>
      )}

      {/* Product grid */}
      <div style={gridStyle}>
        {items.map((p, i) => {
          const key = p.id ?? p.slug ?? p.name ?? String(i);
          const title = p.name ?? p.title ?? 'ITEM';
          const src = p.image ?? p.thumbnail ?? '/placeholder.png';
        return (
          <button
            key={key}
            className="group text-left product-tile"
            onClick={() => setSelected(p)}
            style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
          >
            <div className="product-box ring-1 ring-black/5 dark:ring-white/10 rounded-2xl"
                 style={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'transparent', border: 'none' }}>
              <img
                src={src}
                alt={title}
                className="product-img transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                style={{ width: '88%', height: '88%', objectFit: 'contain' }}
              />
            </div>
            <div className="product-meta" style={{ padding: '10px 2px 0', letterSpacing: '.02em', fontWeight: 800, textAlign: 'center', fontSize: 'clamp(12px,1.7vw,18px)', lineHeight: 1.05 }}>
              <span>{title}</span>
            </div>
          </button>
        );})}
      </div>

      <ProductOverlay product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
