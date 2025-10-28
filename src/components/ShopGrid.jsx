// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ShopGrid({ products = [] }) {
  const [overlayId, setOverlayId] = useState(null);

  // === Grid density (orb) — smooth 5→1→5 bounce, one step per click ===
  const [cols, setCols] = useState(5);
  const [down, setDown] = useState(true);

  // reflect current cols on :root only (no inline var to avoid precedence issues)
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-cols', String(cols));
  }, [cols]);

  const stepCols = useCallback(() => {
    setCols((prev) => {
      let next = down ? Math.max(1, prev - 1) : Math.min(5, prev + 1);
      const nextDown = next === 1 ? false : next === 5 ? true : down;
      setDown(nextDown);
      return next;
    });
  }, [down]);

  // hook orb
  useEffect(() => {
    const onZoom = () => { if (overlayId == null) stepCols(); };
    window.addEventListener('lb:zoom', onZoom);
    document.addEventListener('lb:zoom', onZoom);
    return () => {
      window.removeEventListener('lb:zoom', onZoom);
      document.removeEventListener('lb:zoom', onZoom);
    };
  }, [overlayId, stepCols]);

  // overlay controls from ProductOverlay (next/prev by wheel)
  useEffect(() => {
    const onNav = (e) => {
      if (overlayId == null) return;
      const dir = e?.detail?.dir;
      const idx = products.findIndex((p) => p.id === overlayId);
      if (idx < 0) return;
      const nextIdx = dir === 'prev'
        ? (idx - 1 + products.length) % products.length
        : (idx + 1) % products.length;
      setOverlayId(products[nextIdx]?.id ?? null);
    };
    window.addEventListener('lb:overlay:navigate', onNav);
    return () => window.removeEventListener('lb:overlay:navigate', onNav);
  }, [overlayId, products]);

  const open  = (id) => setOverlayId(id);
  const close = ()  => setOverlayId(null);

  const overlayProduct = useMemo(
    () => products.find((p) => p.id === overlayId) || null,
    [overlayId, products]
  );

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid">
        {products.map((p, i) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(p.id); }}
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(p.id); }}}
          >
            <div className="product-box">
              <Image
                src={p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={i===0}
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayProduct && (
        <(await import('./ProductOverlay')).default
          product={overlayProduct}
          onClose={close}
          onAddToCart={() => {}}
        />
      )}
    </div>
  );
}
