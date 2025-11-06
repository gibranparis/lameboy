// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

/** Normalize a display title so "Brown #3" dedupes with "Brown" */
function normalizeTitle(title = '') {
  return String(title)
    .replace(/\s+#\d+$/i, '')   // drop " #N" suffix
    .trim()
    .toLowerCase();
}

/** Deduplicate products by normalized title, keeping the first occurrence */
function dedupeByTitle(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = normalizeTitle(p?.title);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

export default function ShopGrid({ products }) {
  // Build product list (prop → window → fallback clones), then dedupe by title
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null;

    /** @type {{id:string,title:string,price?:number,image:string,thumb?:string,images?:string[],sizes?:string[]}[]} */
    const base =
      (fromProp && fromProp.length) ? fromProp :
      (fromWin  && fromWin.length)  ? fromWin  :
      [{
        id: 'hoodie-brown-1',
        title: 'Brown',
        price: 4000, // cents; overlay formats to $40 (no .00)
        image: '/products/brown.png',
        thumb: '/products/brown.png',
        images: ['/products/brown.png'],
        sizes: ['S','M','L','XL']
      }];

    // If we already have a real list, just dedupe & return it
    if (base.length >= 2) return dedupeByTitle(base);

    // Otherwise clone to 5 so overlay can loop vertically; label first as "Brown"
    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: i === 0 ? base[0].title : `${base[0].title} #${i + 1}`,
    }));
    // And then dedupe (which collapses back to one if someone later injects variants)
    return dedupeByTitle(clones);
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

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
      // If overlay is open, orb click closes overlay only (grid unchanged)
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

  // Make hoodies a bit bigger when exactly 5 unique items are showing
  const fiveUp = seed.length === 5;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
      <div
        className="shop-grid"
        style={{
          '--grid-cols': cols,
          // let us tune tile size when exactly 5
          '--tile-max': fiveUp ? '260px' : '220px'
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
            <div className="product-box" style={{ width: '100%', maxWidth: 'var(--tile-max)' }}>
              <Image
                src={p.thumb || p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx === 0}
                sizes="(max-width: 480px) 36vw, (max-width: 768px) 28vw, (max-width: 1280px) 18vw, 14vw"
                // keep Next optimization for better LCP; your assets are local
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

      {/* Mobile cart button scale-down (class lives on your Cart component) */}
      <style jsx global>{`
        @media (max-width: 600px) {
          .cart-btn,
          .CartButton,
          [data-cart-button] {
            transform: scale(0.72) !important;
            transform-origin: top right;
          }
        }
      `}</style>
    </div>
  );
}
