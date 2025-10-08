// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string }} Product */

/**
 * @param {{
 *   products?: Product[];
 *   hideTopRow?: boolean;
 *   columns?: number; // optional controlled columns from parent (1..5)
 * }} props
 */
export default function ShopGrid({ products = [], hideTopRow = false, columns }) {
  // show something even if products aren’t passed
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',      image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',      image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',      image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',        image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  /** selection overlay */
  const [selected, setSelected] = useState/** @type {Product|null} */(null);

  /** grid density */
  const [perRow, setPerRow] = useState(MAX_COLS);
  /** @type {['in'|'out', (d: 'in'|'out') => void]} */
  // @ts-ignore
  const [zoomDir, setZoomDir] = useState/** @type {'in'|'out'} */('in'); // 'in' = 5→1, 'out' = 1→5
  const [fromCascade, setFromCascade] = useState(false);

  // accept controlled columns from parent (header orb)
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

  // listen for global orb events (from the banned page orb)
  useEffect(() => {
    /** @param {CustomEvent<{ step?: number }>} e */
    const onDensity = (e) => {
      const step = Number(e?.detail?.step ?? 1);
      // ignore if parent is controlling with `columns`
      if (typeof columns !== 'number') stepDensity(step);
    };
    // @ts-ignore
    window.addEventListener('grid-density', onDensity);
    return () => {
      // @ts-ignore
      window.removeEventListener('grid-density', onDensity);
    };
  }, [stepDensity, columns]);

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
      {/* Top row: optional controls + cart (hide when header contains cart) */}
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

      <ProductOverlay item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
