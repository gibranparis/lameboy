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
                  id: 'demo-1',
                  title: 'LAME Cap – Brown',
                  price: 4200,
                  image: '/products/lame-cap-brown.png',
                  images: ['/products/lame-cap-brown.png'],
                  sizes: ['OS']
                }];

    if (base.length >= 2) return base;

    // clone a few so overlay can move
    return Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} ${i ? `#${i+1}` : ''}`.trim(),
    }));
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  // density 5→1 (in) and 1→5 (out)
  const MIN = 1, MAX = 5;
  const [cols, setCols] = useState(MAX);

  // broadcast density so the orb can sync mode
  const broadcast = useCallback((density) => {
    const detail = { density, value: density };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density', { detail })); } catch {}
  }, []);

  const applyCols = useCallback((n) => {
    const v = Math.max(MIN, Math.min(MAX, n|0));
    setCols(v);
    try { document.documentElement.style.setProperty('--grid-cols', String(v)); } catch {}
    broadcast(v);
  }, [broadcast]);

  // initial density → 5
  useEffect(() => { applyCols(MAX); /* once on mount */ }, [applyCols]);

  // handle zoom events (document-only)
  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }
      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = d.dir === 'out' ? 'out' : 'in';
      setCols((p) => {
        const next = dir === 'in' ? Math.max(MIN, p - step) : Math.min(MAX, p + step);
        applyCols(next);
        return next;
      });
    };
    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, applyCols]);

  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);

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

      {overlayIdx != null && (
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
