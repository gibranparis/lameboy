// src/components/ShopGrid.jsx
'use client';

import { useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

const MIN_COLS = 1;
const MAX_COLS = 5;

export default function ShopGrid({ products }) {
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('boy'); // 'boy' | 'girl'
  const [glow, setGlow] = useState('');
  const [perRow, setPerRow] = useState(MAX_COLS);
  /** zoomDir: 'in' means shrink columns (5→1). 'out' means grow columns (1→5) */
  const [zoomDir, setZoomDir] = useState('in');

  const isZoomIn = zoomDir === 'in'; // controls + / -

  const onZoomClick = () => {
    if (isZoomIn) {
      const next = Math.max(MIN_COLS, perRow - 1);
      setPerRow(next);
      if (next === MIN_COLS) setZoomDir('out');
    } else {
      const next = Math.min(MAX_COLS, perRow + 1);
      setPerRow(next);
      if (next === MAX_COLS) setZoomDir('in');
    }
  };

  const toggleGender = () => {
    const next = gender === 'boy' ? 'girl' : 'boy';
    setGender(next);
    setGlow(next === 'boy' ? 'glow-blue' : 'glow-green');
    setTimeout(() => setGlow(''), 800);
  };

  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }),
    [perRow]
  );

  return (
    <div className="shop-page">
      {/* Zoom loop button (+ shrinks 5→1, then flips to – and grows 1→5) */}
      <button
        className={`shop-zoom ${isZoomIn ? 'is-plus' : 'is-minus'}`}
        onClick={onZoomClick}
        aria-label={
          isZoomIn
            ? `Zoom in (show fewer, larger items) — next: ${perRow - 1} per row`
            : `Zoom out (show more, smaller items) — next: ${perRow + 1} per row`
        }
        title={isZoomIn ? 'Zoom in' : 'Zoom out'}
      >
        <span className="icon" />
      </button>

      {/* Gender toggle */}
      <button
        className={`shop-toggle ${gender === 'boy' ? 'shop-toggle--boy' : 'shop-toggle--girl'} ${glow}`}
        onClick={toggleGender}
        aria-label="Switch gender"
        title="Switch gender"
      >
        {gender === 'boy' ? 'LAMEBOY' : 'LAMEGIRL'}
      </button>

      <CartButton />

      <div className="shop-wrap">
        <div className="shop-grid" style={gridStyle} key={perRow /* small reflow aid */}>
          {(products || []).map((p) => {
            const img =
              p.images?.[0]?.file?.url || p.images?.[0]?.url || p.image || '/placeholder.png';
            const name = p.name || '—';
            const open = () => setSelected(p);
            const keydown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
              }
            };
            return (
              <a
                key={p.id || p.slug || name}
                className="product-tile"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  open();
                }}
                onKeyDown={keydown}
                role="button"
                tabIndex={0}
                aria-label={`Open ${name}`}
              >
                <div className="product-box">
                  <img className="product-img" src={img} alt={name} loading="lazy" />
                </div>
                <div className="product-meta">{name}</div>
              </a>
            );
          })}
        </div>
      </div>

      {selected && <ProductOverlay product={selected} onClose={() => setSelected(null)} />}

      <style jsx>{`
        .shop-page {
          position: relative;
          padding-bottom: 64px;
        }

        /* ===== Floating controls ===== */
        .shop-zoom {
          position: fixed;
          top: 22px;
          left: 22px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          z-index: 40;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(6px);
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.18),
            0 0 24px rgba(255, 255, 255, 0.35);
          transition: transform 120ms ease, box-shadow 160ms ease, background 120ms ease;
        }
        .shop-zoom:hover {
          transform: translateY(-1px);
        }
        .shop-zoom:active {
          transform: translateY(0);
          background: rgba(255, 255, 255, 0.92);
        }

        /* Plus/Minus icon that morphs smoothly */
        .shop-zoom .icon {
          position: relative;
          width: 46%;
          height: 46%;
          transition: transform 200ms ease;
        }
        .shop-zoom .icon::before,
        .shop-zoom .icon::after {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          background: #000;
          border-radius: 2px;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.25);
          transition: transform 200ms ease, opacity 200ms ease, width 200ms ease, height 200ms ease;
        }
        /* Horizontal bar */
        .shop-zoom .icon::before {
          width: 100%;
          height: 18%;
        }
        /* Vertical bar (hidden for minus) */
        .shop-zoom .icon::after {
          width: 18%;
          height: 100%;
        }
        .shop-zoom.is-minus .icon::after {
          transform: scaleX(0);
          opacity: 0;
        }

        /* Gender pill */
        .shop-toggle {
          position: fixed;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 14px;
          border-radius: 999px;
          border: 0;
          font-weight: 800;
          letter-spacing: 0.18em;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          z-index: 40;
          backdrop-filter: blur(6px);
        }
        .shop-toggle--boy {
          color: #0ea5e9;
          text-shadow: 0 0 10px rgba(14, 165, 233, 0.45);
        }
        .shop-toggle--girl {
          color: #22c55e;
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.45);
        }
        .glow-blue {
          animation: pulseBlue 800ms ease;
        }
        .glow-green {
          animation: pulseGreen 800ms ease;
        }
        @keyframes pulseBlue {
          from {
            box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.65);
          }
          to {
            box-shadow: 0 0 0 18px rgba(14, 165, 233, 0);
          }
        }
        @keyframes pulseGreen {
          from {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.65);
          }
          to {
            box-shadow: 0 0 0 18px rgba(34, 197, 94, 0);
          }
        }

        /* ===== Grid ===== */
        .shop-wrap {
          padding: 96px 24px 24px;
        }
        .shop-grid {
          display: grid;
          gap: 28px 32px;
          /* subtle snap animation when layout changes */
          transition: gap 160ms ease;
        }

        .product-tile {
          display: grid;
          gap: 10px;
          align-content: start;
          text-decoration: none;
          color: inherit;
        }
        .product-box {
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f3f3;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04) inset;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          filter: saturate(1.02);
        }
        .product-meta {
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .product-tile:hover .product-box {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}
