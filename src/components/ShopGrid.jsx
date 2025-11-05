// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin = typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS) ? window.__LB_PRODUCTS : null;

    const base = (fromProp && fromProp.length) ? fromProp
              : (fromWin && fromWin.length)     ? fromWin
              : [{
                  id: 'hoodie-1',
                  title: 'Brown Hoodie',
                  price: 6500,
                  image: '/products/lame-hoodie-brown.png?v=1',
                  images: ['/products/lame-hoodie-brown.png?v=1'],
                  sizes: ['S','M','L','XL']
                }];

    if (base.length >= 2) return base;

    // clone few for vertical wrap on overlay
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} #${i+1}`,
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // grid density (1..5)
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);

  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    document.dispatchEvent(new CustomEvent('lb:grid-density',      { detail }));
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
  }, []);

  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next|0));
    setCols(clamped);
    document.documentElement.style.setProperty('--grid-cols', String(clamped));
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  useEffect(() => { applyCols(cols); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // respond to zoom events
  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }  // close overlay only
      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  return setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; });
      if (dir === 'out') return setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; });

      // default ping-pong
      return setCols((p) => {
        const goingIn = p > MIN_COLS;
        const n = goingIn ? Math.max(MIN_COLS, p - 1) : Math.min(MAX_COLS, p + 1);
        applyCols(n);
        return n;
      });
    };

    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, applyCols]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
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
          onIndexChange={(i) => setOverlayIdx(((i % seed.length) + seed.length) % seed.length)}
          onClose={close}
        />
      )}
    </div>
  );
}
