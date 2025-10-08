// @ts-check
// src/components/ShopGrid.jsx
'use client';

import { useMemo, useState } from 'react';
import CartButton from './CartButton';
import ProductOverlay from './ProductOverlay';

/**
 * Controlled grid. Parent passes columns (1..5)
 * @param {{ products?: Array<any>, columns?: number }} props
 */
export default function ShopGrid({ products = [], columns = 3 }) {
  const [selected, setSelected] = useState(null);

  const perRow = Math.min(5, Math.max(1, Number(columns) || 3));
  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${perRow}, minmax(0,1fr))` }),
    [perRow]
  );

  return (
    <section className="px-6 pb-24 pt-10">
      <div className="mb-6 flex items-center justify-end">
        <CartButton />
      </div>

      <div className="grid gap-10" style={gridStyle}>
        {products.map((p, i) => {
          const key = p.id ?? p.slug ?? p.name ?? String(i);
          const title = p.name ?? p.title ?? 'ITEM';
          const src = p.image ?? p.thumbnail ?? '/placeholder.png';
          return (
            <button
              key={key}
              className="group text-left"
              onClick={() => setSelected(p)}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                <img
                  src={src}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 text-center text-sm tracking-wide">
                <span className="font-semibold">{title}</span>
              </div>
            </button>
          );
        })}
      </div>

      <ProductOverlay item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
