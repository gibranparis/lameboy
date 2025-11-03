// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // Robust product source:
  // 1) prop
  // 2) window.__LB_PRODUCTS (if injected from backend)
  // 3) tiny demo list cloned if only one item exists (prevents “exit” feel)
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    // --- FALLBACK: your hoodie image ---
    const base =
      (fromProp && fromProp.length)
        ? fromProp
        : (fromWin && fromWin.length)
          ? fromWin
          : [{
              id: 'lame-hoodie-brown',
              title: 'LAME Hoodie – Brown',
              price: 6500, // $65.00 (adjust as needed)
              image: '/products/lame-hoodie-brown.png',
              images: ['/products/lame-hoodie-brown.png'],
              sizes: ['S','M','L','XL'],
            }];

    if (base.length >= 2) return base;

    // If only one product is present, make a few virtual clones so the overlay
    // can move up/down. These are placeholders only.
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: `${base[0].title} ${i ? `#${i + 1}` : ''}`.trim(),
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === grid density (orb) — bounce 5↔1 with each click when no dir is given ===
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);
  const [towardMin, setTowardMin] = useState(true); // true = shrinking toward 1

  // Broadcast current density (so the orb can decide rotation direction etc.)
  const broadcastDensity = useCallback((density, dir) => {
    const detail = { density, value: density, dir };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',        { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:grid-density',        { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density',   { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:zoom/grid-density',   { detail })); } catch {}
  }, []);

  const applyCols = useCallback((next, dirHint /** 'in' | 'out' | null */) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next | 0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    // If no explicit direction supplied, infer from movement
    const inferred =
      dirHint ??
      (clamped < cols ? 'in' : clamped > cols ? 'out' : (towardMin ? 'in' : 'out'));
    broadcastDensity(clamped, inferred);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, towardMin, broadcastDensity]);

  // Initial CSS var + broadcast so the orb knows starting state
  useEffect(() => {
    applyCols(cols, 'out');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIn  = useCallback((step = 1) => applyCols(cols - step, 'in'),  [applyCols, cols]);
  const stepOut = useCallback((step = 1) => applyCols(cols + step, 'out'), [applyCols, cols]);

  const pingPong = useCallback(() => {
    // when no direction provided, bounce 5↔1
    const next = towardMin ? Math.max(MIN_COLS, cols - 1) : Math.min(MAX_COLS, cols + 1);
    const atMin = next === MIN_COLS;
    const atMax = next === MAX_COLS;
    if (atMin) setTowardMin(false);
    if (atMax) setTowardMin(true);
    applyCols(next, towardMin ? 'in' : 'out');
  }, [cols, towardMin, applyCols]);

  // orb → density OR overlay close
  useEffect(() => {
    const onZoom = (e) => {
      // If overlay is open, first close the overlay (back to grid)
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir  = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  { setTowardMin(true);  return stepIn(step);  }
      if (dir === 'out') { setTowardMin(false); return stepOut(step); }

      // legacy “no dir” mode ➜ ping-pong
      pingPong();
    };

    // Listen on BOTH window and document to match any emitter
    ['lb:zoom'].forEach((n) => {
      window.addEventListener(n, onZoom);
      document.addEventListener(n, onZoom);
    });
    return () => {
      ['lb:zoom'].forEach((n) => {
        window.removeEventListener(n, onZoom);
        document.removeEventListener(n, onZoom);
      });
    };
  }, [overlayIdx, stepIn, stepOut, pingPong]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
      {/* inline CSS var is fine in React */}
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {seed.map((p, idx) => (
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
          products={seed}
          index={overlayIdx}
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(seed.length - 1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
