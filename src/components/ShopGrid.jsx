// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // Robust product source:
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin = typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS) ? window.__LB_PRODUCTS : null;

    const base = (fromProp && fromProp.length) ? fromProp
              : (fromWin && fromWin.length)     ? fromWin
              : [{
                  id: 'demo-1',
                  title: 'LAME Cap – Brown',
                  price: 4200,
                  image: '/products/lame-cap-brown.png',
                  images: ['/products/lame-cap-brown.png'],
                  sizes: ['OS']
                }];

    if (base.length >= 2) return base;

    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} ${i ? `#${i+1}` : ''}`.trim(),
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === grid density (orb) ===
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);
  const [down, setDown] = useState(true); // used for ping-pong when no dir provided

  // Broadcast current density (for orb reverse spin, headers, etc.)
  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',       { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density',  { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('lb:grid-density',         { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('lb:zoom/grid-density',    { detail })); } catch {}
  }, []);

  // Apply cols → CSS var + broadcast
  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next|0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  // Initialize CSS var + broadcast once
  useEffect(() => {
    applyCols(cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Ping-pong behavior (legacy fallback when no dir provided)
  const stepColsPingPong = useCallback(() => {
    setCols((prev) => {
      let next = prev;
      let nextDown = down;
      if (down) next = Math.max(MIN_COLS, prev - 1);
      else      next = Math.min(MAX_COLS, prev + 1);
      if (next === MIN_COLS) nextDown = false;
      if (next === MAX_COLS) nextDown = true;
      setDown(nextDown);
      applyCols(next);
      return next;
    });
  }, [down, applyCols]);

  // Handle lb:zoom (document+window for safety)
  useEffect(() => {
    /** @param {CustomEvent} e */
    const onZoom = (e) => {
      // If overlay is open, close it and don't change density
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in') {
        setCols((prev) => {
          const next = Math.max(MIN_COLS, prev - step);
          applyCols(next);
          return next;
        });
        return;
      }

      if (dir === 'out') {
        setCols((prev) => {
          const next = Math.min(MAX_COLS, prev + step);
          applyCols(next);
          return next;
        });
        return;
      }

      // No dir provided → legacy ping-pong 5↔1
      stepColsPingPong();
    };

    const names = ['lb:zoom'];
    names.forEach((n) => {
      document.addEventListener(n, onZoom);
      window.addEventListener(n, onZoom);
    });
    return () => {
      names.forEach((n) => {
        document.removeEventListener(n, onZoom);
        window.removeEventListener(n, onZoom);
      });
    };
  }, [overlayIdx, stepColsPingPong, applyCols]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      {/* CSS var inline is fine in React */}
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(idx); }}
            onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(idx); }}}
          >
            <div className="product-box">
              <Image
                src={p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx===0}
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
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(seed.length-1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
