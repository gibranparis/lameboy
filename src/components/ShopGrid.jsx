// src/components/ShopGrid.jsx
'use client';

import { useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

// Cycle order for the "+" button
const VIEW_MODES = ['light', 'mono', 'dense', 'wide'];

export default function ShopGrid({ products }) {
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('boy'); // 'boy' | 'girl'
  const [glow, setGlow] = useState('');        // pulse animation class
  const [perRow, setPerRow] = useState(4);     // 1..6
  const [modeIndex, setModeIndex] = useState(0);

  const mode = VIEW_MODES[modeIndex];

  // "+" loops through view modes (like yeezy.com)
  const onCycleMode = () => setModeIndex((i) => (i + 1) % VIEW_MODES.length);

  // Optional separate density toggle (you already had this)
  const densityIcon = perRow > 1 ? '+' : '<';
  const onDensityClick = () => setPerRow((n) => (n > 1 ? n - 1 : 2));

  const toggleGender = () => {
    const next = gender === 'boy' ? 'girl' : 'boy';
    setGender(next);
    setGlow(next === 'boy' ? 'glow-blue' : 'glow-green');
    setTimeout(() => setGlow(''), 800);
  };

  const gridStyle = useMemo(() => {
    // Mode-specific column sizing presets (still overridden by perRow button)
    const modeCols =
      mode === 'wide' ? Math.max(2, Math.min(4, perRow - 1)) :
      mode === 'dense' ? Math.min(6, perRow + 1) :
      perRow;

    return { gridTemplateColumns: `repeat(${modeCols}, minmax(0, 1fr))` };
  }, [perRow, mode]);

  return (
    <div className={`shop-page mode-${mode}`}>
      {/* Yeezy-style loop button */}
      <button
        className="shop-loop"
        onClick={onCycleMode}
        aria-label="Cycle view"
        title="Cycle view"
      >
        <span className="plus" />
      </button>

      {/* (Optional) your original density button; keep if you like both */}
      <button
        className="shop-density"
        onClick={onDensityClick}
        aria-label="Change density"
        title="Change density"
      >
        {densityIcon}
      </button>

      {/* Gender switch */}
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
        <div className="shop-grid" style={gridStyle}>
          {(products || []).map((p) => {
            const img = p.images?.[0]?.file?.url || p.images?.[0]?.url || p.image || '/placeholder.png';
            const name = p.name || '—';
            const open = () => setSelected(p);
            const keydown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            };
            return (
              <a
                key={p.id || p.slug || name}
                className="product-tile"
                href="#"
                onClick={(e) => { e.preventDefault(); open(); }}
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

      {/* Scoped styles */}
      <style jsx>{`
        .shop-page {
          position: relative;
          padding-bottom: 64px;
        }

        /* ===== Floating controls ===== */
        .shop-loop,
        .shop-density {
          position: fixed;
          top: 22px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          box-shadow:
            0 2px 10px rgba(0,0,0,0.18),
            0 0 24px rgba(255,255,255,0.35);
          cursor: pointer;
          z-index: 40;
          backdrop-filter: blur(6px);
          transition: transform 120ms ease, box-shadow 160ms ease, background 120ms ease;
        }
        .shop-loop:hover,
        .shop-density:hover { transform: translateY(-1px); }
        .shop-loop:active,
        .shop-density:active { transform: translateY(0); background: rgba(255,255,255,0.92); }

        .shop-loop { left: 22px; }
        .shop-density { left: 78px; font-weight: 800; }

        .shop-toggle {
          position: fixed;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 14px;
          border-radius: 999px;
          border: 0;
          font-weight: 800;
          letter-spacing: .18em;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          cursor: pointer;
          z-index: 40;
          backdrop-filter: blur(6px);
        }
        .shop-toggle--boy { color: #0ea5e9; text-shadow: 0 0 10px rgba(14,165,233,.45); }
        .shop-toggle--girl { color: #22c55e; text-shadow: 0 0 10px rgba(34,197,94,.45); }
        .glow-blue  { animation: pulseBlue 800ms ease; }
        .glow-green { animation: pulseGreen 800ms ease; }
        @keyframes pulseBlue  { from { box-shadow: 0 0 0 0 rgba(14,165,233,.65) } to { box-shadow: 0 0 0 18px rgba(14,165,233,0) } }
        @keyframes pulseGreen { from { box-shadow: 0 0 0 0 rgba(34,197,94,.65) } to { box-shadow: 0 0 0 18px rgba(34,197,94,0) } }

        .plus { position: relative; width: 45%; height: 45%; }
        .plus::before, .plus::after {
          content: ''; position: absolute; inset: 0; margin: auto; background: #000; border-radius: 2px;
        }
        .plus::before { width: 100%; height: 18%; }
        .plus::after  { width: 18%; height: 100%; }
        .shop-loop:active { animation: spinHalf 360ms ease; }
        @keyframes spinHalf { from { transform: rotate(0deg) } to { transform: rotate(180deg) } }

        /* ===== Grid ===== */
        .shop-wrap { padding: 96px 24px 24px; }
        .shop-grid {
          display: grid;
          grid-auto-rows: 1fr;
          gap: 28px 32px;
        }

        .product-tile { display: grid; gap: 10px; align-content: start; text-decoration: none; color: inherit; }
        .product-box {
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f3f3;
          box-shadow: 0 1px 0 rgba(0,0,0,.04) inset;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .product-img {
          width: 100%; height: 100%; object-fit: contain; object-position: center;
          display: block;
          filter: saturate(1.02);
        }
        .product-meta { font-weight: 800; letter-spacing: .12em; }

        .product-tile:hover .product-box { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }

        /* ===== Mode styles (cycled by the + button) ===== */
        .mode-mono .product-img  { filter: grayscale(1) contrast(1.05); }
        .mode-dense .shop-grid   { gap: 16px 18px; }
        .mode-wide  .product-box { aspect-ratio: 1 / 1; }
      `}</style>
    </div>
  );
}
