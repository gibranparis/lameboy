// src/components/ShopGrid.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

export default function ShopGrid({ products = [] }) {
  const [selected, setSelected] = useState(null);
  const [perRow, setPerRow] = useState(MAX_COLS);
  const [zoomDir, setZoomDir] = useState('in'); // 'in' = 5→1, 'out' = 1→5
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
  const stepDensity = (delta = 1) => {
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
  };

  // listen for global orb events
  useEffect(() => {
    const onDensity = (e) => {
      const step = Number(e?.detail?.step ?? 1);
      stepDensity(step);
    };
    window.addEventListener('grid-density', onDensity);
    return () => window.removeEventListener('grid-density', onDensity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perRow, zoomDir]);

  // (Optional) keyboard shortcut: press "g" to step grid
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'g') stepDensity(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perRow, zoomDir]);

  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }),
    [perRow]
  );

  return (
    <section
      className={[
        'px-6 pb-24 pt-10',
        fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : ''
      ].join(' ')}
    >
      {/* Top row: optional controls + cart */}
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

      {/* Product grid */}
      <div className="grid gap-10" style={gridStyle}>
        {products.map((p) => (
          <button
            key={p.id ?? p.slug ?? p.name}
            className="group text-left"
            onClick={() => setSelected(p)}
          >
            <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
              {/* Ensure images never show as blank: use background fallbacks */}
              <img
                src={p.image ?? p.thumbnail ?? '/placeholder.png'}
                alt={p.name ?? 'Product'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div className="mt-3 text-center text-sm tracking-wide">
              <span className="font-semibold">{p.name ?? 'ITEM'}</span>
            </div>
          </button>
        ))}
      </div>

      <ProductOverlay item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
{process.env.NODE_ENV === 'development' && (
  <div style={{ position: 'fixed', left: 8, top: 56, zIndex: 50 }}>
    <button onClick={() => { setZoomDir('in');  stepDensity(1); }}>−</button>
    <div>cols: {perRow}</div>
    <button onClick={() => { setZoomDir('out'); stepDensity(1); }}>+</button>
  </div>
)}
