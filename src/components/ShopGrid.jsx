// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // Build product list:
  // 1) use prop if provided
  // 2) use window.__LB_PRODUCTS if present
  // 3) fallback to our four hoodies
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    const base =
      (fromProp && fromProp.length) ? fromProp :
      (fromWin && fromWin.length)   ? fromWin   :
      [
        {
          id: 'hoodie-brown',
          title: 'Brown',
          price: 4000, // $40.00
          image: '/products/brown.png',
          images: ['/products/brown.png'],
          sizes: ['S', 'M', 'L', 'XL'],
        },
        {
          id: 'hoodie-black',
          title: 'Black',
          price: 4000,
          image: '/products/black.png',
          images: ['/products/black.png'],
          sizes: ['S', 'M', 'L', 'XL'],
        },
        {
          id: 'hoodie-gray',
          title: 'Gray',
          price: 4000,
          image: '/products/gray.png',
          images: ['/products/gray.png'],
          sizes: ['S', 'M', 'L', 'XL'],
        },
        {
          id: 'hoodie-green',
          title: 'Green',
          price: 4000,
          image: '/products/green.png',
          images: ['/products/green.png'],
          sizes: ['S', 'M', 'L', 'XL'],
        },
      ];

    // If only one product exists (rare with our fallback), clone a few
    if (base.length >= 2) return base;
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: `${base[0].title} #${i + 1}`,
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // === Grid density (1..5) controlled by orb ===
  const MIN_COLS = 1;
  const MAX_COLS = 5;

  const [cols, setCols] = useState(MAX_COLS);

  // Broadcast current density so the orb can flip spin direction, etc.
  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',      { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, []);

  const applyCols = useCallback((next) => {
    const clamped = Math.max(MIN_COLS, Math.min(MAX_COLS, next | 0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcastDensity(clamped);
  }, [broadcastDensity]);

  // Initialize CSS var + broadcast
  useEffect(() => {
    applyCols(cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Respond to orb zoom events
  useEffect(() => {
    const onZoom = (e) => {
      // If overlay is open, close it on any zoom
      if (overlayIdx != null) { setOverlayIdx(null); return; }

      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in') {
        setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; });
        return;
      }
      if (dir === 'out') {
        setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; });
        return;
      }

      // Legacy ping-pong if no dir provided
      setCols((p) => {
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
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
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
          onIndexChange={(i) =>
            setOverlayIdx(((i % seed.length) + seed.length) % seed.length) // infinite wrap
          }
          onClose={close}
        />
      )}
    </div>
  );
}
