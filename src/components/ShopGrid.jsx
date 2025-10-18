// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

/** @typedef {{ id?: string; slug?: string; name?: string; title?: string; price?: number; image?: string; thumbnail?: string, images?: any }} Product */

/**
 * @param {{
 *   products?: Product[];
 *   hideTopRow?: boolean;
 * }} props
 */
export default function ShopGrid({ products = [], hideTopRow = false }) {
  // fallback items
  const fallbackProductList = [
    { id: 'tee-black',  name: 'LB Tee — Black',  image: '/shop/tee-black.png',  price: 38 },
    { id: 'tee-white',  name: 'LB Tee — White',  image: '/shop/tee-white.png',  price: 38 },
    { id: 'cap-navy',   name: 'Dad Cap — Navy',  image: '/shop/cap-navy.png',   price: 32 },
    { id: 'stick-pack', name: 'Sticker Pack',    image: '/shop/stickers.png',   price: 10 },
  ];
  const items = (products?.length ? products : fallbackProductList);

  /** overlay state */
  const [selected, setSelected] = useState/** @type {Product|null} */(null);
  const [fromCascade, setFromCascade] = useState(false);

  // detect cascade handoff (optional styling hook)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setFromCascade(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, []);

  // Read current columns (optional display in the header row)
  const cols = useMemo(() => {
    if (typeof window === 'undefined') return 4;
    const v = getComputedStyle(document.documentElement).getPropertyValue('--grid-cols').trim();
    const n = parseInt(v || '4', 10);
    return Number.isFinite(n) ? n : 4;
  }, [items.length]); // re-read rarely; purely cosmetic

  return (
    <section
      className={[
        'px-6 pb-24 pt-10',
        fromCascade ? 'animate-[fadeIn_.6s_ease-out]' : '',
      ].join(' ')}
    >
      {/* Top row controls (hidden when header already hosts the cart) */}
      {!hideTopRow && (
        <div className="mb-6 flex items-center justify-between">
          <div className="text-xs tabular-nums opacity-60">cols: {cols}</div>
          <CartButton />
        </div>
      )}

      {/* Product grid — layout entirely via CSS: .shop-grid uses --grid-cols */}
      <div className="shop-grid">
        {items.map((p, i) => {
          const key = p.id ?? p.slug ?? p.name ?? String(i);
          const title = p.name ?? p.title ?? 'ITEM';
          const src = p.image ?? p.thumbnail ?? '/placeholder.png';
          return (
            <button
              key={key}
              className="group text-left product-tile"
              onClick={() => setSelected(p)}
            >
              <div className="product-box ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                <img
                  src={src}
                  alt={title}
                  className="product-img transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="product-meta">
                <span>{title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overlay uses the correct prop name */}
      <ProductOverlay product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
