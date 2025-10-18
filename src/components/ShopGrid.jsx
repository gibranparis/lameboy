// src/components/ShopGrid.jsx
// @ts-check
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string, images?: any }} Product */

/**
 * @param {{
 *   products?: Product[];
 *   hideTopRow?: boolean;
 *   columns?: number; // optional controlled columns (1..5)
 * }} props
 */
export default function ShopGrid({ products = [], hideTopRow = false, columns }) {
  // Fallbacks
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',  image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',  image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',  image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',    image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  // Overlay
  const [selected, setSelected] = useState/** @type {Product|null} */(null);

  // Density state
  const [perRow, setPerRow] = useState(MAX_COLS); // start at 5
  // 'in' = fewer columns (bigger tiles), 'out' = more columns
  // @ts-ignore
  const [zoomDir, setZoomDir] = useState/** @type {'in'|'out'} */('in');
  const [fromCascade, setFromCascade] = useState(false);

  // If parent controls columns, respect it.
  useEffect(() => {
    if (typeof columns === 'number') {
      const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(columns)));
      setPerRow(clamped);
    }
  }, [columns]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // Step helper (bounce at the ends)
  const stepDensity = useCallback(
    /** @param {number} [delta=1] */
    (delta = 1) => {
      const isIn = zoomDir === 'in';
      let next = perRow + (isIn ? -delta : +delta);

      if (next < MIN_COLS) {
        next = MIN_COLS + 1; // bounce off 1
        setZoomDir('out');
      } else if (next > MAX_COLS) {
        next = MAX_COLS - 1; // bounce off 5
        setZoomDir('in');
      }
      setPerRow(next);
    },
    [perRow, zoomDir]
  );

  // Unified handler for lb:zoom
  /** @param {CustomEvent<{ step?: number, dir?: 'in'|'out' }>} e */
  const handleZoomEvent = useCallback((e) => {
    const step = Number(e?.detail?.step ?? 1);
    const dir  = e?.detail?.dir;
    if (dir === 'in' || dir === 'out') setZoomDir(dir);
    if (typeof columns !== 'number') stepDensity(step);
  }, [columns, stepDensity]);

  // ✅ Listen on BOTH window & document for robustness (single event name)
  useEffect(() => {
    // @ts-ignore
    const onZoom = (e) => handleZoomEvent(e);
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [handleZoomEvent]);

  // Grid columns from state
  const gridStyle = useMemo(
    () => /** @type {const} */ ({ display:'grid', gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`, gap: '2.5rem' }),
    [perRow]
  );

  return (
    <section
      className={[
        'px-6 pb-24 pt-10',
        fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : '',
      ].join(' ')}
    >
      {/* Optional controls row (hidden when header hosts the cart) */}
      {!hideTopRow && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Density −"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => { setZoomDir('in');  stepDensity(1); }}
            >
              −
            </button>
            <div className="text-xs tabular-nums opacity-60">cols: {perRow}</div>
            <button
              aria-label="Density +"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => { setZoomDir('out'); stepDensity(1); }}
            >
              +
            </button>
          </div>
          <CartButton />
        </div>
      )}

      {/* Product grid */}
      <div className="shop-grid" style={gridStyle}>
        {items.map((p, i) => {
          const key = p.id ?? p.slug ?? p.name ?? String(i);
          const title = p.name ?? p.title ?? 'ITEM';
          const src = p.image ?? p.thumbnail ?? '/placeholder.png';
          return (
            <button
              key={key}
              className="group text-left product-tile"
              onClick={() => setSelected(p)}
            >
              <div className="product-box ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                <img
                  src={src}
                  alt={title}
                  className="product-img transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="product-meta">
                <span>{title}</span>
              </div>
            </button>
          );
        })}
      </div>

      <ProductOverlay product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
