// src/components/ShopGrid.jsx
// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

export default function ShopGrid({ products }) {
  // ---- product source (prop → window.__LB_PRODUCTS → demo) ----
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin  = typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS) ? window.__LB_PRODUCTS : null;

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

    // Clone the single item so overlay can paginate vertically.
    return Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i+1}`,
      title: `${base[0].title} ${i ? `#${i+1}` : ''}`.trim(),
    }));
  }, [products]);

  // ---- overlay state ----
  const [overlayIdx, setOverlayIdx] = useState/** @type {number|null} */(null);
  const overlayOpen = overlayIdx != null;
  const open  = (i) => setOverlayIdx(i);
  const close = () => setOverlayIdx(null);

  // ---- grid density state (single source of truth) ----
  const MIN = 1, MAX = 5;
  const [cols, setCols] = useState(MAX);
  const [down, setDown] = useState(true); // ping-pong direction

  // Apply CSS var and broadcast once whenever cols changes
  useEffect(() => {
    try { document.documentElement.style.setProperty('--grid-cols', String(cols)); } catch {}
    const detail = { density: cols, value: cols };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, [cols]);

  // Initial broadcast so the orb knows where we start (5)
  useEffect(() => {
    const detail = { density: MAX, value: MAX };
    try { document.dispatchEvent(new CustomEvent('lb:grid-density', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail })); } catch {}
  }, []);

  // Helpers
  const clamp = (n) => Math.max(MIN, Math.min(MAX, n|0));

  const shrink = useCallback((step = 1) => {
    setCols((p) => {
      const n = clamp(p - step);
      if (n === MIN) setDown(false);
      if (n === MAX) setDown(true);
      return n;
    });
  }, []);

  const expand = useCallback((step = 1) => {
    setCols((p) => {
      const n = clamp(p + step);
      if (n === MIN) setDown(false);
      if (n === MAX) setDown(true);
      return n;
    });
  }, []);

  const pingPong = useCallback((step = 1) => {
    setCols((p) => {
      let n = p;
      if (down)  n = clamp(p - step);   // going toward 1
      else       n = clamp(p + step);   // going toward 5
      if (n === MIN) setDown(false);
      if (n === MAX) setDown(true);
      return n;
    });
  }, [down]);

  // De-dupe repeated events in same tick (some environments fire on both window & document)
  const lastStampRef = useRef(0);

  useEffect(() => {
    /** @param {CustomEvent & {timeStamp?:number}} e */
    const onZoom = (e) => {
      // If overlay is open, close and stop — don't change density.
      if (overlayOpen) { setOverlayIdx(null); return; }

      // Deduplicate if the same event fired twice this frame
      const ts = Number(e?.timeStamp || 0);
      if (ts && ts === lastStampRef.current) return;
      lastStampRef.current = ts;

      const d = e?.detail || {};
      const step = clamp(Number(d.step) || 1);
      const dir = typeof d.dir === 'string' ? d.dir : null;

      if (dir === 'in')  return expand(step);  // green → numbers grow 1→…→5
      if (dir === 'out') return shrink(step);  // red   → numbers shrink 5→…→1
      pingPong(step);                          // legacy bounce
    };

    // Single source of truth: listen on document only
    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayOpen, expand, shrink, pingPong]);

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
          onIndexChange={(i) => setOverlayIdx(Math.max(0, Math.min(seed.length-1, i)))}
          onClose={close}
        />
      )}
    </div>
  );
}
