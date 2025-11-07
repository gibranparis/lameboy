// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';
import { PRODUCTS, logMissingAssets } from '@/lib/products';

export default function ShopGrid({ products, autoOpenFirstOnMount = false }) {
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    /** @type {typeof PRODUCTS} */
    const base =
      (fromProp && fromProp.length) ? fromProp :
      (fromWin  && fromWin.length)  ? fromWin  :
      (PRODUCTS && PRODUCTS.length) ? PRODUCTS :
      [{
        id: 'hoodie-brown-1',
        title: 'Brown',
        price: 4000,
        image: '/products/brown.png',
        thumb:  '/products/brown.png',
        images: ['/products/brown.png'],
        sizes: ['S','M','L','XL'],
      }];

    if (base.length >= 2) return base;

    return Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: i === 0 ? base[0].title : `${base[0].title} #${i + 1}`,
    }));
  }, [products]);

  useEffect(() => { if (process.env.NODE_ENV !== 'production') logMissingAssets?.(); }, []);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // auto open #0 on mount
  useEffect(() => {
    if (autoOpenFirstOnMount && seed.length) {
      // slight delay to let layout settle
      const id = setTimeout(() => setOverlayIdx(0), 60);
      return () => clearTimeout(id);
    }
  }, [autoOpenFirstOnMount, seed.length]);

  // ===== Grid density (1..5) controlled by orb =====
  const MIN_COLS = 1;
  const MAX_COLS = 5;
  const [cols, setCols] = useState(MAX_COLS);

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

  useEffect(() => {
    applyCols(cols); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }
      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')      { setCols((p) => { const n = Math.max(MIN_COLS, p - step); applyCols(n); return n; }); return; }
      if (dir === 'out')     { setCols((p) => { const n = Math.min(MAX_COLS, p + step); applyCols(n); return n; }); return; }
      setCols((p) => { const n = p > MIN_COLS ? Math.max(MIN_COLS, p - 1) : Math.min(MAX_COLS, p + 1); applyCols(n); return n; });
    };

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
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); }}}
          >
            <div className="product-box">
              <Image
                src={p.thumb || p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx === 0}
                unoptimized
                sizes="(max-width: 480px) 42vw, (max-width: 768px) 28vw, (max-width: 1280px) 18vw, 14vw"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallback === 'hero') {
                    img.src = '/products/brown.png';
                    img.dataset.fallback = 'final';
                  } else if (!img.dataset.fallback) {
                    img.src = p.image;
                    img.dataset.fallback = 'hero';
                  }
                }}
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
