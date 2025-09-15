'use client';

import { useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

export default function ShopGrid({ products }) {
  const [selected, setSelected] = useState(null);
  const [gender, setGender] = useState('boy'); // 'boy' | 'girl'
  const [glow, setGlow] = useState('');        // pulse animation class
  const [perRow, setPerRow] = useState(4);     // 1..6

  const densityIcon = perRow > 1 ? '+' : '<';
  const onDensityClick = () => setPerRow((n) => (n > 1 ? n - 1 : 2));

  const toggleGender = () => {
    const next = gender === 'boy' ? 'girl' : 'boy';
    setGender(next);
    setGlow(next === 'boy' ? 'glow-blue' : 'glow-green');
    setTimeout(() => setGlow(''), 800);
  };

  const gridStyle = useMemo(() => ({ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }), [perRow]);

  return (
    <div className="shop-page">
      <button className="shop-density" onClick={onDensityClick} aria-label="Change density">{densityIcon}</button>

      <button
        className={`shop-toggle ${gender === 'boy' ? 'shop-toggle--boy' : 'shop-toggle--girl'} ${glow}`}
        onClick={toggleGender}
        aria-label="Switch gender"
      >
        {gender === 'boy' ? 'LAMEBOY' : 'LAMEGIRL'}
      </button>

      <CartButton />

      <div className="shop-wrap">
        <div className="shop-grid" style={gridStyle}>
          {(products || []).map((p) => {
            const img = p.images?.[0]?.file?.url || p.images?.[0]?.url || p.image || '/placeholder.png';
            const name = p.name || '—';
            const open = () => setSelected(p);
            const keydown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            };
            return (
              <a
                key={p.id || p.slug || name}
                className="product-tile"
                href="#"
                onClick={(e) => { e.preventDefault(); open(); }}
                onKeyDown={keydown}
                role="button"
                tabIndex={0}
                aria-label={`Open ${name}`}
              >
                <div className="product-box">
                  <img className="product-img" src={img} alt={name} />
                </div>
                <div className="product-meta">{name}</div>
              </a>
            );
          })}
        </div>
      </div>

      {selected && <ProductOverlay product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
