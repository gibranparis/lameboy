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

    const clones = Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} ${i ? `#${i+1}` : ''}`.trim(),
    }));
    return clones;
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);

  const MIN = 1, MAX = 5;
  const [cols, setCols] = useState(MAX);

  // broadcast helper
  const broadcast = useCallback((n) => {
    const detail = { density: n, value: n };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density',      { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:grid-density',      { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, []);

  const apply = useCallback((n) => {
    const clamped = Math.max(MIN, Math.min(MAX, n | 0));
    setCols(clamped);
    try { document.documentElement.style.setProperty('--grid-cols', String(clamped)); } catch {}
    broadcast(clamped);
  }, [broadcast]);

  useEffect(() => { apply(cols); /* initial */ /* eslint-disable-next-line */ }, []);

  // REVERSED mapping:
  // 'in'  => grid grows (1 -> 5)
  // 'out' => grid shrinks (5 -> 1)
  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }
      const d = e?.detail || {};
      const step = Math.max(1, Math.min(3, Number(d.step) || 1));
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  return setCols(p => { const n = Math.min(MAX, p + step); apply(n); return n; });
      if (dir === 'out') return setCols(p => { const n = Math.max(MIN, p - step); apply(n); return n; });

      // fallback ping-pong if no dir present
      return setCols(p => {
        const n = p >= MAX ? MIN : p + 1;
        apply(n);
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
  }, [overlayIdx, apply]);

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
