// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

// normalize: remove "#2", "#3" suffix
function norm(title = '') {
  return title.replace(/\s+#\d+$/i, '').trim().toLowerCase();
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((p) => {
    const k = norm(p.title);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default function ShopGrid({ products }) {

  // ✅ REAL HOODIES LIST — this is now your fallback source of truth
  const REAL = [
    {
      id: 'hoodie-brown',
      title: 'Brown',
      price: 4000,
      image: '/products/brown.png',
      thumb: '/products/brown.png',
      images: ['/products/brown.png'],
      sizes: ['S','M','L','XL']
    },
    {
      id: 'hoodie-black',
      title: 'Black',
      price: 4000,
      image: '/products/black.png',
      thumb: '/products/black.png',
      images: ['/products/black.png'],
      sizes: ['S','M','L','XL']
    },
    {
      id: 'hoodie-gray',
      title: 'Gray',
      price: 4000,
      image: '/products/gray.png',
      thumb: '/products/gray.png',
      images: ['/products/gray.png'],
      sizes: ['S','M','L','XL']
    },
    {
      id: 'hoodie-green',
      title: 'Green',
      price: 4000,
      image: '/products/green.png',
      thumb: '/products/green.png',
      images: ['/products/green.png'],
      sizes: ['S','M','L','XL']
    },
    {
      id: 'hoodie-blue',
      title: 'Blue',
      price: 4000,
      image: '/products/blue.png',
      thumb: '/products/blue.png',
      images: ['/products/blue.png'],
      sizes: ['S','M','L','XL']
    }
  ];

  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null;
    // eslint-disable-next-line no-undef
    const fromWin = typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
      ? window.__LB_PRODUCTS
      : null;

    const base = fromProp?.length ? fromProp : fromWin?.length ? fromWin : REAL;
    return dedupe(base);
  }, [products]);

  const [overlayIdx, setOverlayIdx] = useState(null);

  const MIN = 1, MAX = 5;
  const [cols, setCols] = useState(MAX);

  const applyCols = useCallback((n) => {
    const c = Math.max(MIN, Math.min(MAX, n|0));
    setCols(c);
    document.documentElement.style.setProperty('--grid-cols', String(c));
  }, []);

  useEffect(() => applyCols(cols), []); // init

  useEffect(() => {
    const onZoom = (e) => {
      if (overlayIdx != null) { setOverlayIdx(null); return; }
      const step = Math.max(1, Math.min(3, Number(e?.detail?.step) || 1));
      const dir = e?.detail?.dir;
      setCols((p) => {
        const next = dir === 'in' ? p - step : dir === 'out' ? p + step : (p > MIN ? p-1 : p+1);
        applyCols(next);
        return next;
      });
    };
    document.addEventListener('lb:zoom', onZoom);
    return () => document.removeEventListener('lb:zoom', onZoom);
  }, [overlayIdx, applyCols]);

  const fiveUp = seed.length === 5;

  return (
    <div className="shop-wrap" style={{ padding: '28px 28px 60px' }}>
      <div className="shop-grid" style={{
        '--grid-cols': cols,
        '--tile-max': fiveUp ? '260px' : '220px'
      }}>
        {seed.map((p, i) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            onClick={(e)=>{ e.preventDefault(); setOverlayIdx(i); }}
          >
            <div className="product-box" style={{ maxWidth: 'var(--tile-max)' }}>
              <Image
                src={p.thumb || p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                sizes="(max-width: 480px) 36vw, (max-width: 768px) 28vw, (max-width: 1280px) 18vw, 14vw"
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayIdx !== null && (
        <ProductOverlay
          products={seed}
          index={overlayIdx}
          onIndexChange={(i)=>setOverlayIdx(((i%seed.length)+seed.length)%seed.length)}
          onClose={()=>setOverlayIdx(null)}
        />
      )}
    </div>
  );
}
