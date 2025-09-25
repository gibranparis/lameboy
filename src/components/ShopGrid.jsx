// src/components/ShopGrid.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';
import ChakraOrbButton from './ChakraOrbButton';

const MIN_COLS = 1;
const MAX_COLS = 5;

export default function ShopGrid({ products = [] }) {
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('boy'); // 'boy' | 'girl'
  const [glow, setGlow] = useState('');
  const [perRow, setPerRow] = useState(MAX_COLS);

  // If we arrived via the banned-page cascade, show a very brief white veil
  const [veil, setVeil] = useState(false);
  useEffect(() => {
    let from = null;
    try { from = sessionStorage.getItem('fromCascade'); sessionStorage.removeItem('fromCascade'); } catch {}
    if (from === '1') {
      setVeil(true);
      const t = setTimeout(() => setVeil(false), 360);
      return () => clearTimeout(t);
    }
  }, []);

  // When we're still above 1 col, clicking the orb *shrinks* (5→1). At 1, it flips to grow (1→5).
  const isZoomInPhase = perRow > MIN_COLS; // controls +/- state
  const orbSegments   = isZoomInPhase ? 7 : 5; // classic cue: 7 = '+', 5 = '−'

  const onOrbClick = useCallback(() => {
    if (isZoomInPhase) {
      const next = Math.max(MIN_COLS, perRow - 1);
      setPerRow(next);
    } else {
      const next = Math.min(MAX_COLS, perRow + 1);
      setPerRow(next);
    }
  }, [isZoomInPhase, perRow]);

  // When value reaches an end, flip the phase so the next taps go the other way
  useEffect(() => {
    if (perRow === MIN_COLS && isZoomInPhase) {
      // reached 1 while shrinking -> flip to grow
      // (do it on next tick so UI states settle)
      const t = setTimeout(() => {}, 0); return () => clearTimeout(t);
    }
    if (perRow === MAX_COLS && !isZoomInPhase) {
      const t = setTimeout(() => {}, 0); return () => clearTimeout(t);
    }
  }, [perRow, isZoomInPhase]);

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
      {/* ENTRY VEIL */}
      {veil && <div className="entry-veil" aria-hidden />}

      {/* Header: gender pill centered, cart on right */}
      <header className="shop-head">
        <div className="left" />
        <div className="center">
          <button
            className={`shop-toggle ${gender === 'boy' ? 'shop-toggle--boy' : 'shop-toggle--girl'} ${glow}`}
            onClick={toggleGender}
            aria-label="Switch gender"
            title="Switch gender"
          >
            {gender === 'boy' ? 'BOY' : 'GIRL'}
          </button>
        </div>
        <div className="right"><CartButton /></div>
      </header>

      {/* ORB bead: fixed top-left as +/- control */}
      <div className="orb-fixed">
        <ChakraOrbButton
          segments={orbSegments}
          onClick={onOrbClick}
          size={44}
          title={isZoomInPhase ? 'Zoom in (5→1)' : 'Zoom out (1→5)'}
          spinMs={isZoomInPhase ? 3200 : 3600}
          revealMs={720}
          flashMs={420}
          flashColor="#0bf05f"
        />
      </div>

      <div className="shop-wrap">
        <div className="shop-grid" style={gridStyle} key={perRow /* tiny reflow aid */}>
          {products.map((p, i) => {
            const name    = p?.name ?? `ITEM ${i + 1}`;
            const img     = p?.images?.[0]?.file?.url || p?.images?.[0]?.url || p?.image || '/placeholder.png';
            const open    = () => setSelected(p);
            const keydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };

            return (
              <a
                key={p?.id || p?.slug || name}
                className="product-tile"
                href="#"
                onClick={(e)=>{ e.preventDefault(); open(); }}
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
        .shop-page { position:relative; padding-bottom:64px; background:#fff; color:#111; min-height:100dvh; overflow:hidden; }

        /* entry veil */
        .entry-veil{
          position:fixed; inset:0; background:#fff; z-index:999;
          animation: veilOut .36s ease-out forwards;
        }
        @keyframes veilOut { from{opacity:1;} to{opacity:0;} }

        .shop-head { position:sticky; top:0; z-index:60; background:linear-gradient(#ffffff, rgba(255,255,255,.85) 70%, rgba(255,255,255,0)); padding:16px 16px 10px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .left{ width:44px; }
        .center{ display:flex; align-items:center; justify-content:center; flex:1; }
        .right{ display:flex; align-items:center; gap:8px; }

        /* Gender pill */
        .shop-toggle {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,.12);
          font-weight: 800;
          letter-spacing: 0.12em;
          background: rgba(255,255,255,.88);
          box-shadow: 0 2px 10px rgba(0,0,0,.10);
          cursor: pointer;
          backdrop-filter: blur(6px);
        }
        .shop-toggle--boy {
          color: #0ea5e9;
          text-shadow: 0 0 10px rgba(14, 165, 233, .45);
        }
        .shop-toggle--girl {
          color: #22c55e;
          text-shadow: 0 0 10px rgba(34, 197, 94, .45);
        }
        .glow-blue { animation: pulseBlue 800ms ease; }
        .glow-green { animation: pulseGreen 800ms ease; }
        @keyframes pulseBlue  { from{ box-shadow:0 0 0 0 rgba(14,165,233,.55); } to{ box-shadow:0 0 0 18px rgba(14,165,233,0);} }
        @keyframes pulseGreen { from{ box-shadow:0 0 0 0 rgba(34,197,94,.55); }  to{ box-shadow:0 0 0 18px rgba(34,197,94,0);} }

        /* Orb position */
        .orb-fixed{ position:fixed; left:18px; top:18px; z-index:120; }

        /* Grid */
        .shop-wrap { padding: 10px 24px 24px; }
        .shop-grid {
          display:grid;
          gap: 28px 32px;
          transition: grid-template-columns 300ms ease, gap 160ms ease;
        }

        .product-tile {
          display:grid; gap:10px; align-content:start;
          text-decoration:none; color:inherit;
        }
        .product-box {
          aspect-ratio: 4 / 3;
          border-radius:12px; overflow:hidden;
          background:#f3f3f3;
          box-shadow:0 1px 0 rgba(0,0,0,.04) inset;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .product-img { width:100%; height:100%; object-fit:contain; object-position:center; display:block; filter:saturate(1.02); }
        .product-meta { font-weight:800; letter-spacing:.12em; }
        .product-tile:hover .product-box { transform: translateY(-1px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
      `}</style>
    </div>
  );
}
