'use client';

import { useEffect, useMemo, useState } from 'react';
import swell from '../lib/swell-client';
import ProductOverlay from './ProductOverlay';

function productCode(p) {
  const tryKeys = ['code', 'short_code', 'sku', 'slug', 'name'];
  for (const k of tryKeys) {
    const v = p?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim().toUpperCase();
  }
  return String(p?.id || '').slice(0, 8).toUpperCase();
}

export default function ShopGrid() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  // brand toggle: lameboy <-> lamegirl (UI only for now)
  const [brand, setBrand] = useState('boy');
  const toggleBrand = () => setBrand((b) => (b === 'boy' ? 'girl' : 'boy'));

  // --- Column count controller ---------------------------------------------
  const initialCols = useMemo(() => {
    if (typeof window === 'undefined') return 5;
    const w = window.innerWidth;
    if (w >= 1536) return 7;
    if (w >= 1280) return 6;
    return 5;
  }, []);
  const MAX_COLS = 7;

  const [cols, setCols] = useState(initialCols);
  const [direction, setDirection] = useState('shrink'); // '+' -> shrink; '<' -> expand

  const onSizeButton = () => {
    if (direction === 'shrink') {
      if (cols > 1) {
        const next = cols - 1;
        setCols(next);
        if (next === 1) setDirection('expand');
      }
    } else {
      if (cols < MAX_COLS) {
        const next = cols + 1;
        setCols(next);
        if (next === MAX_COLS) setDirection('shrink');
      }
    }
  };

  const onSizeKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSizeButton();
    }
  };
  // -------------------------------------------------------------------------

  const [selected, setSelected] = useState(null); // product for overlay

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await swell.products.list({ limit: 60, page: 1, active: true });
        if (!alive) return;
        setItems(res?.results || []);
      } catch (e) {
        console.error('products list failed', e);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (busy) {
    return (
      <div className="page-center ui-top">
        <div className="code-success">// loading shop…</div>
      </div>
    );
  }

  if (!items.length) {
    return <div className="page-center ui-top"><div className="code-comment">// no products yet</div></div>;
  }

  return (
    <>
      {/* Grid size control (top-left) */}
      <div className="grid-toolbar ui-top">
        <button
          className="grid-size-btn"
          type="button"
          onClick={onSizeButton}
          onKeyDown={onSizeKey}
          aria-label={direction === 'shrink' ? 'Reduce grid by one column' : 'Increase grid by one column'}
          title={`${cols} per row`}
        >
          {direction === 'shrink' ? '+' : '<'}
        </button>
      </div>

      {/* Center-top brand toggle with chakra boxes */}
      <div className="brand-toggle-top ui-top">
        <button
          type="button"
          className={`brand-title-btn ${brand === 'girl' ? 'pink' : ''}`}
          onClick={toggleBrand}
          aria-pressed={brand === 'girl'}
          title="Switch between lameboy / lamegirl"
        >
          {brand === 'girl' ? (
            // LAMEGIRL — sexier pink, no boxes
            <span>lamegirl</span>
          ) : (
            // LAMEBOY — per-letter with chakra bars
            <span className="brand-letters">
              <span className="brand-letter chakra-root">
                <span className="chakra-letter">L</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-sacral">
                <span className="chakra-letter">A</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-plexus">
                <span className="chakra-letter">M</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-heart">
                <span className="chakra-letter">E</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-throat">
                <span className="chakra-letter">B</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-thirdeye">
                <span className="chakra-letter">O</span>
                <span className="chakra-mini"></span>
              </span>
              <span className="brand-letter chakra-crown">
                <span className="chakra-letter">Y</span>
                <span className="chakra-mini"></span>
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Grid */}
      <main className="shop-wrap max-w-[1600px] mx-auto ui-top">
        <div className="shop-grid" style={{ '--cols': cols }}>
          {items.map((p) => {
            const code = productCode(p);
            const img = p.images?.[0]?.file?.url;

            return (
              <button
                key={p.id}
                type="button"
                className="product-tile"
                onClick={() => setSelected(p)}
                aria-label={`Open ${code}`}
                title={code}
              >
                <div className="product-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? (
                    <img className="product-img" src={img} alt={p.name || code} />
                  ) : (
                    <div className="code-placeholder" aria-hidden>no image</div>
                  )}
                </div>
                <div className="product-meta">{code}</div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Yeezy-style overlay */}
      {selected && <ProductOverlay product={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
