// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

type CSSVarStyle = React.CSSProperties & { ['--grid-cols']?: number | string };

export default function ShopGrid({ products = [] }) {
  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // ---- Grid density state (1..5) ----------------------------------------
  const clampCols = (n: number) => Math.max(1, Math.min(5, n));

  const readInitialCols = () => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--grid-cols').trim();
      const n = parseInt(v || '5', 10);
      return Number.isFinite(n) ? clampCols(n) : 5;
    } catch { return 5; }
  };
  const [cols, setCols] = useState<number>(5);
  const directionRef = useRef<'down' | 'up'>('down'); // bounce 5↔1

  // on mount, sync from CSS custom prop
  useEffect(() => {
    const n = readInitialCols();
    setCols(n);
    document.documentElement.style.setProperty('--grid-cols', String(n));
  }, []);

  const applyCols = useCallback((n: number) => {
    const c = clampCols(n);
    setCols(c);
    try { document.documentElement.style.setProperty('--grid-cols', String(c)); } catch {}
    // flip bounce direction at edges
    if (c === 1) directionRef.current = 'up';
    else if (c === 5) directionRef.current = 'down';
  }, []);

  // Primary orb handler: click toggles density; if overlay open, close instead
  useEffect(() => {
    const onZoom = (e: Event) => {
      // If overlay is open, orb = close overlay
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      // Otherwise step density (bounce 5↔1)
      const dir = directionRef.current;
      applyCols(dir === 'down' ? cols - 1 : cols + 1);
    };

    // Legacy channel: allow explicit step/dir control
    const onLegacy = (e: any) => {
      // If overlay is open, orb = close
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const step = Math.max(1, Number(e?.detail?.step ?? 1) || 1);
      const dir  = String(e?.detail?.dir || '').toLowerCase();
      let next = cols;
      if (dir === 'out') next = cols + step;
      else if (dir === 'in') next = cols - step;
      else next = cols - step; // default = zoom in
      applyCols(next);
    };

    window.addEventListener('lb:zoom', onZoom as EventListener);
    window.addEventListener('grid-density', onLegacy as EventListener);
    return () => {
      window.removeEventListener('lb:zoom', onZoom as EventListener);
      window.removeEventListener('grid-density', onLegacy as EventListener);
    };
  }, [cols, overlayIdx, applyCols]);

  // Mark a root so shop CSS tokens apply
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-shop-root', '1');
    root.setAttribute('data-mode', 'shop');
    return () => {
      root.removeAttribute('data-shop-root');
      // keep data-mode in case other pages rely on it; remove if you prefer:
      // root.removeAttribute('data-mode');
    };
  }, []);

  const open = (i: number) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  const gridStyle = useMemo(() => {
    return { '--grid-cols': cols } as CSSVarStyle;
  }, [cols]);

  return (
    <div className="shop-wrap" data-shop-root style={{ padding: '28px 28px 60px' }}>
      <div className="shop-grid" style={gridStyle}>
        {products.map((p, idx) => (
          <a
            key={p.id ?? idx}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); open(idx); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); } }}
          >
            <div className="product-box">
              <Image
                src={p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx === 0}
                unoptimized
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayOpen && (
        <ProductOverlay
          products={products}
          index={overlayIdx!}
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(products.length - 1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
