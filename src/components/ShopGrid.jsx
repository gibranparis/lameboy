// @ts-check
// src/components/ShopGrid.jsx
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
 *   columns?: number; // optional controlled columns from parent (1..5)
 * }} props
 */
export default function ShopGrid({ products = [], hideTopRow = false, columns }) {
  // fallback items
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',  image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',  image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',  image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',    image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  /** overlay state */
  const [selected, setSelected] = useState/** @type {Product|null} */(null);

  /** grid density */
  const [perRow, setPerRow] = useState(MAX_COLS);
  /** 'in' = 5→1, 'out' = 1→5 */
  // @ts-ignore
  const [zoomDir, setZoomDir] = useState/** @type {'in'|'out'} */('in');
  const [fromCascade, setFromCascade] = useState(false);

  // accept controlled columns from parent
  useEffect(() => {
    if (typeof columns === 'number') {
      const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(columns)));
      setPerRow(clamped);
    }
  }, [columns]);

  // detect cascade handoff (optional styling hook)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // helper: step, bounce at ends, flip direction
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

  // unified handler used by both events
  /** @param {CustomEvent<{ step?: number, dir?: 'in'|'out' }>} e */
  const handleZoomEvent = useCallback((e) => {
    const step = Number(e?.detail?.step ?? 1);
    const dir  = e?.detail?.dir;
    if (dir === 'in' || dir === 'out') setZoomDir(dir);
    if (typeof columns !== 'number') stepDensity(step);
  }, [columns, stepDensity]);

  // Listen for the orb (new) and legacy events
  useEffect(() => {
    // new event
    // @ts-ignore
    const onZoom = (e) => handleZoomEvent(e);
    // legacy event
    // @ts-ignore
    const onLegacy = (e) => handleZoomEvent(e);

    window.addEventListener('lb:zoom', onZoom);
    window.addEventListener('grid-density', onLegacy);

    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      window.removeEventListener('grid-density', onLegacy);
    };
  }, [handleZoomEvent]);

  const gridStyle = useMemo(
    () => /** @type {const} */ ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }),
    [perRow]
  );

  return (
    <section
      className={[
        'px-6 pb-24 pt-10',
        fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : '',
      ].join(' ')}
    >
      {/* Top row controls (hidden when header already hosts the cart) */}
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
      <div className="grid gap-10" style={gridStyle}>
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

      {/* ✅ prop name fixed */}
      <ProductOverlay product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
