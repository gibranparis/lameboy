// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // ----- product seed (fallback to your hoodie colors) -----
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    /** @type {Array<{id:string,title:string,price:number,image:string,images?:string[],sizes?:string[]}>} */
    const base =
      (fromProp && fromProp.length) ? fromProp :
      (fromWin  && fromWin.length)  ? fromWin  : [
        { id: 'hood-brown', title: 'Brown', image: '/products/brown.png', price: 4000, sizes: ['S','M','L','XL'] },
        { id: 'hood-black', title: 'Black', image: '/products/black.png', price: 4000, sizes: ['S','M','L','XL'] },
        { id: 'hood-gray',  title: 'Gray',  image: '/products/gray.png',  price: 4000, sizes: ['S','M','L','XL'] },
        { id: 'hood-green', title: 'Green', image: '/products/green.png', price: 4000, sizes: ['S','M','L','XL'] },
        { id: 'hood-blue',  title: 'Blue',  image: '/products/blue.png',  price: 4000, sizes: ['S','M','L','XL'] },
      ];

    if (base.length >= 2) return base;

    // If only one item exists, make virtual clones to keep overlay navigation feeling right.
    return Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: `${base[0].title} #${i + 1}`,
    }));
  }, [products]);

  // ----- overlay state -----
  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);
  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);
  const overlayOpen = overlayIdx != null;

  // ----- grid density (1..5 via the orb) -----
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);

  // tell the orb what density we are at (so it can choose spin direction)
  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',      { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, []);

  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next|0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  // initial apply so CSS var exists
  useEffect(() => { applyCols(cols); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // respond to orb zoom clicks (in/out + legacy ping-pong)
  useEffect(() => {
    const onZoom = (e) => {
      // In overlay: clicking orb = close overlay (no density change)
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d    = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir  = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  return setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; });
      if (dir === 'out') return setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; });

      // default ping-pong if no dir given
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

  // ----- image/tile sizing -----
  // A soft scale bump when 5 cols are shown (so the hoodies look a touch larger).
  // We use a CSS variable consumed by transform:scale to keep layout simple.
  const tileScale = cols === 5 ? 1.14 : 1.0;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
      <div
        className="shop-grid"
        style={{
          '--grid-cols': cols,
          '--tile-scale': tileScale,
        }}
      >
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); open(idx); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); }}}
          >
            <div
              className="product-box"
              style={{ transform: 'scale(var(--tile-scale,1))', transformOrigin: 'top left' }}
            >
              <Image
                src={p.image}
                alt={p.title}
                width={900}
                height={900}
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
          onIndexChange={(i) => setOverlayIdx(((i % seed.length) + seed.length) % seed.length)}
          onClose={close}
        />
      )}
    </div>
  );
}
