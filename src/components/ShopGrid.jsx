'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProductOverlay from './ProductOverlay.jsx';

/**
 * ShopGrid
 * - columns: integer 1..5 (how many tiles per row, fixed)
 * - products: optional array [{ id, title, price, image }]
 */
export default function ShopGrid({
  columns = 5,
  products: productsProp,
}) {
  // Clamp columns for safety
  const cols = Math.max(1, Math.min(5, Number(columns) || 5));

  // Fallback demo products (you can replace with your data source)
  const products = useMemo(
    () =>
      productsProp?.length
        ? productsProp
        : [
            { id: 'tee-01', title: 'TEE 01', price: 40, image: '/preview/tee-01.png' },
            { id: 'tee-02', title: 'TEE 02', price: 40, image: '/preview/tee-02.png' },
            { id: 'hood-01', title: 'HOOD 01', price: 85, image: '/preview/hood-01.png' },
          ],
    [productsProp]
  );

  // Smooth entry veil if we arrived via the banned-page cascade
  const [veil, setVeil] = useState(false);
  useEffect(() => {
    let cameFromCascade = false;
    try {
      cameFromCascade = sessionStorage.getItem('fromCascade') === '1';
      if (cameFromCascade) sessionStorage.removeItem('fromCascade');
    } catch {}
    if (cameFromCascade) {
      setVeil(true);
      const t = setTimeout(() => setVeil(false), 380); // quick fade
      return () => clearTimeout(t);
    }
  }, []);

  // Product overlay state
  const [active, setActive] = useState(null); // product or null

  return (
    <div data-shop-root className="shop-page">
      {/* subtle entry veil (keeps the cascade feeling continuous) */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#fff',
            zIndex: 80,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity .38s ease-out',
          }}
          // trigger next paint so transition runs
          ref={(el) => el && requestAnimationFrame(() => (el.style.opacity = 0))}
        />
      )}

      <div className="shop-wrap">
        <div
          className="shop-grid"
          style={{
            // force an exact column count; still responsive inside each cell
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
          aria-label="product-grid"
        >
          {products.map((p) => (
            <a
              key={p.id}
              href="#"
              className="product-tile"
              onClick={(e) => {
                e.preventDefault();
                setActive(p);
              }}
            >
              <div className="product-box">
                <img
                  className="product-img"
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="product-meta">
                {p.title}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {active && (
        <ProductOverlay
          product={active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
