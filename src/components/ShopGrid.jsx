// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string; images?: any }} Product */

/**
 * @param {{
 *   products?: Product[];
 *   hideTopRow?: boolean;
 *   columns?: number; // optional controlled columns from parent (1..5)
 * }} props
 */
export default function ShopGrid({ products = [], hideTopRow = false, columns }) {
  // Fallback items (until you wire your file-based inventory)
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',  image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',  image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',  image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',    image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  /** Overlay state */
  const [selected, setSelected] = useState/** @type {Product|null} */(null);

  /** Grid density (columns) */
  const [perRow, setPerRow] = useState(MAX_COLS);

  /** Optional “arrival” effect hook */
  const [fromCascade, setFromCascade] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // If a parent forces columns, respect it (and ignore zoom events)
  useEffect(() => {
    if (typeof columns === 'number') {
      const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(columns)));
      setPerRow(clamped);
    }
  }, [columns]);

  /** Wrap-around decrement: 5→4→3→2→1→5… (zoom-in loop) */
  const zoomInOne = useCallback(() => {
    if (typeof columns === 'number') return; // controlled, ignore
    setPerRow(prev => (prev - 1 < MIN_COLS ? MAX_COLS : prev - 1));
  }, [columns]);

  /** Wrap-around increment: 1→2→3→4→5→1… (zoom-out loop) */
  const zoomOutOne = useCallback(() => {
    if (typeof columns === 'number') return; // controlled, ignore
    setPerRow(prev => (prev + 1 > MAX_COLS ? MIN_COLS : prev + 1));
  }, [columns]);

  /** Event handler used by both new + legacy events */
  const onZoomEvent = useCallback(/** @param {CustomEvent<{step?: number, dir?: 'in'|'out'}>} e */(e) => {
    const step = Math.max(1, Number(e?.detail?.step ?? 1)); // we only use 1, but tolerate >1
    const dir  = e?.detail?.dir ?? 'in';
    for (let i = 0; i < step; i++) {
      (dir === 'out' ? zoomOutOne : zoomInOne)();
    }
  }, [zoomInOne, zoomOutOne]);

  /** Listen for:
   *   - 'lb:zoom'      (new)
   *   - 'grid-density' (legacy/back-compat)
   */
  useEffect(() => {
    // @ts-ignore
    const onNew = (e) => onZoomEvent(e);
    // @ts-ignore
    const onLegacy = (e) => onZoomEvent(e);

    window.addEventListener('lb:zoom', onNew);
    window.addEventListener('grid-density', onLegacy);
    return () => {
      window.removeEventListener('lb:zoom', onNew);
      window.removeEventListener('grid-density', onLegacy);
    };
  }, [onZoomEvent]);

  const gridStyle = useMemo(
    () => /** @type {const} */ ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }),
    [perRow]
  );

  return (
    <section className={['px-6 pb-24 pt-10', fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : ''].join(' ')}>
      {/* Top-row controls for debugging (hidden when header hosts cart) */}
      {!hideTopRow && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Zoom in"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={zoomInOne}
              title="5→4→3→2→1→5…"
            >
              −
            </button>
            <div className="text-xs tabular-nums opacity-60">cols: {perRow}</div>
            <button
              aria-label="Zoom out"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={zoomOutOne}
              title="1→2→3→4→5→1…"
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
            <button key={key} className="group text-left product-tile" onClick={() => setSelected(p)}>
              <div className="product-box ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                <img src={src} alt={title} className="product-img transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
              </div>
              <div className="product-meta"><span>{title}</span></div>
            </button>
          );
        })}
      </div>

      {/* ← prop name must be product */}
      <ProductOverlay product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
