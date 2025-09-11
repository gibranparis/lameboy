'use client';

import { useEffect, useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

export default function ShopGrid({ products }) {
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('boy'); // 'boy' | 'girl'
  const [glow, setGlow] = useState('');        // pulse animation class
  const [perRow, setPerRow] = useState(4);     // grid density (1..6)

  // density toggle: + reduces items per row by 1 until 1, then becomes "<" to increase
  const densityIcon = perRow > 1 ? '+' : '<';
  const onDensityClick = () => setPerRow((n) => (n > 1 ? n - 1 : 2));

  // center toggle gradient + pulse
  const toggleGender = () => {
    const next = gender === 'boy' ? 'girl' : 'boy';
    setGender(next);
    setGlow(next === 'boy' ? 'glow-blue' : 'glow-green'); // as requested: blue & green pulses
    setTimeout(() => setGlow(''), 800);
  };

  // computed grid style
  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
    }),
    [perRow]
  );

  return (
    <div className="shop-page">
      {/* Density button (top-left) */}
      <button className="shop-density" onClick={onDensityClick} aria-label="Change density">
        {densityIcon}
      </button>

      {/* LAMEBOY / LAMEGIRL toggle center-top */}
      <button
        className={`shop-toggle ${gender === 'boy' ? 'shop-toggle--boy' : 'shop-toggle--girl'} ${glow}`}
        onClick={toggleGender}
        aria-label="Switch gender"
      >
        {gender === 'boy' ? 'LAMEBOY' : 'LAMEGIRL'}
      </button>

      {/* Cart always visible, including when overlay is open */}
      <CartButton />

      <div className="shop-wrap">
        <div className="shop-grid" style={gridStyle}>
          {(products || []).map((p) => {
            const img =
              p.images?.[0]?.file?.url ||
              p.images?.[0]?.url ||
              p.image ||
              '/placeholder.png';
            return (
              <a
                key={p.id || p.slug || p.name}
                className="product-tile"
                onClick={(e) => {
                  e.preventDefault();
                  setSelected(p);
                }}
                href="#"
              >
                <div className="product-box">
                  <img className="product-img" src={img} alt={p.name || 'Product'} />
                </div>
                <div className="product-meta">{p.name || '—'}</div>
              </a>
            );
          })}
        </div>
      </div>

      {selected && (
        <ProductOverlay product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
