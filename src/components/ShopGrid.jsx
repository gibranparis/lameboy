'use client';

import { useEffect, useMemo, useState } from 'react';
import swell from '../lib/swell-client';

function productCode(p) {
  const tryKeys = ['code', 'short_code', 'sku', 'slug', 'name'];
  for (const k of tryKeys) {
    const v = p?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim().toUpperCase();
  }
  return String(p?.id || '').slice(0, 8).toUpperCase();
}

export default function ShopGrid() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  // --- Column count controller ---------------------------------------------
  const initialCols = useMemo(() => {
    if (typeof window === 'undefined') return 5; // SSR-safe
    const w = window.innerWidth;
    if (w >= 1536) return 7;
    if (w >= 1280) return 6;
    return 5; // mobile/tablet like yeezy
  }, []);
  const MAX_COLS = 7;

  const [cols, setCols] = useState(initialCols);
  const [direction, setDirection] = useState('shrink'); // 'shrink' ( + ) -> fewer per row; 'expand' ( < ) -> more

  const onSizeButton = () => {
    if (direction === 'shrink') {
      if (cols > 1) {
        const next = cols - 1;
        setCols(next);
        if (next === 1) setDirection('expand'); // flip at 1
      }
    } else {
      if (cols < MAX_COLS) {
        const next = cols + 1;
        setCols(next);
        if (next === MAX_COLS) setDirection('shrink'); // bounce at max
      }
    }
  };

  // keyboard accessibility
  const onSizeKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSizeButton();
    }
  };

  // -------------------------------------------------------------------------

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await swell.products.list({ limit: 60, page: 1, active: true });
        if (!alive) return;
        setItems(res?.results || []);
      } catch (e) {
        console.error('products list failed', e);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (busy) {
    return (
      <div className="page-center ui-top">
        <div className="code-success">// loading shop…</div>
      </div>
    );
  }

  if (!items.length) {
    return <div className="page-center ui-top"><div className="code-comment">// no products yet</div></div>;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="grid-toolbar ui-top">
        <button
          className="grid-size-btn"
          type="button"
          onClick={onSizeButton}
          onKeyDown={onSizeKey}
          aria-label={direction === 'shrink' ? 'Reduce grid by one column' : 'Increase grid by one column'}
          title={`${cols} per row`}
        >
          {direction === 'shrink' ? '+' : '<'}
        </button>
      </div>

      {/* Grid */}
      <main className="shop-wrap max-w-[1600px] mx-auto ui-top">
        <div className="shop-grid" style={{ '--cols': cols }}>
          {items.map((p) => {
            const code = productCode(p);
            const href = `/product/${p.slug || p.id}`;
            const img = p.images?.[0]?.file?.url;

            return (
              <a key={p.id} href={href} className="product-tile">
                <div className="product-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? (
                    <img className="product-img" src={img} alt={p.name || code} />
                  ) : (
                    <div className="code-placeholder" aria-hidden>no image</div>
                  )}
                </div>
                <div className="product-meta">{code}</div>
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}
