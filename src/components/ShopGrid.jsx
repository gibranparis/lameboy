// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string }} Product */
/** @typedef {{ products?: Product[], hideTopRow?: boolean }} ShopGridProps */

/** @param {ShopGridProps} props */
export default function ShopGrid({ products = [], hideTopRow = false }) {
  /** @type {[Product|null, (p: Product|null) => void]} */
  // @ts-ignore - React infers setter; JSDoc narrows value
  const [selected, setSelected] = useState(/** @type {Product|null} */(null));
  const [perRow, setPerRow] = useState(MAX_COLS);
  /** @type {['in'|'out', (d: 'in'|'out') => void]} */
  // @ts-ignore
  const [zoomDir, setZoomDir] = useState(/** @type {'in'|'out'} */('in')); // 'in' = 5→1, 'out' = 1→5
  const [fromCascade, setFromCascade] = useState(false);

  // detect cascade handoff (optional styling hook)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // helper: step columns and swap direction at the ends (infinite loop feel)
  const stepDensity = useCallback(
    /** @param {number} [delta=1] */
    (delta = 1) => {
      const isIn = zoomDir === 'in';
      let next = perRow + (isIn ? -delta : +delta);

      if (next < MIN_COLS) {
        next = MIN_COLS + 1; // bounce
        setZoomDir('out');
      } else if (next > MAX_COLS) {
        next = MAX_COLS - 1; // bounce
        setZoomDir('in');
      }
      setPerRow(next);
    },
    [perRow, zoomDir]
  );

  // listen for global orb events
  useEffect(() => {
    /** @param {CustomEvent<{ step?: number }>} e */
    const onDensity = (e) => {
      const step = Number(e?.detail?.step ?? 1);
      stepDensity(step);
    };
    // @ts-ignore - addEventListener typing doesn't know CustomEvent payload
    window.addEventListener('grid-density', onDensity);
    return () => {
      // @ts-ignore
      window.removeEventListener('grid-density', onDensity);
    };
  }, [stepDensity]);

  const gridStyle = useMemo(
    () => /** @type {const} */ ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }),
    [perRow]
  );

  return (
    <section
      className={[
        'px-6 pb-24 pt-10',
        fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : ''
      ].join(' ')}
    >
      {/* Top row: optional controls + cart (hidden when header has cart) */}
      {!hideTopRow && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Density −"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => {
                setZoomDir('in');
                stepDensity(1);
              }}
            >
              −
            </button>
            <div className="text-xs tabular-nums opacity-60">cols: {perRow}</div>
            <button
              aria-label="Density +"
              className="rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/15"
              onClick={() => {
                setZoomDir('out');
                stepDensity(1);
              }}
            >
              +
            </button>
          </div>

          <CartButton />
        </div>
      )}

      {/* Product grid */}
      <div className="grid gap-10" style={gridStyle}>
        {products.map((p, i) => {
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

      <ProductOverlay item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
