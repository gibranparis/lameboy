'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ShopGrid({ products = [], cols = 5 }) {
  const [ready, setReady] = useState(false);

  // fade/slide in once first images are ready (cuts perceived jitter)
  useEffect(() => {
    const imgs = Array.from(document.images || []).slice(0, 16);
    if (!imgs.length) return setReady(true);
    let done = 0;
    const mark = () => { if (++done >= imgs.length) setReady(true); };
    imgs.forEach((img) => {
      if (img.complete) return mark();
      img.addEventListener('load', mark, { once: true });
      img.addEventListener('error', mark, { once: true });
    });
  }, []);

  const clamped = Math.max(1, Math.min(5, cols));

  return (
    <section
      className="shop-wrap"
      style={{
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity .36s cubic-bezier(.22,1,.36,1), transform .36s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity, transform',
      }}
    >
      <div
        className="shop-grid"
        style={{
          gridTemplateColumns: `repeat(${clamped}, minmax(0, 1fr))`, // force exact N columns
        }}
      >
        {products.map((p, idx) => {
          const img = p?.images?.[0]?.url || '/placeholder.png';
          const title = p?.name ?? `Item ${idx + 1}`;
          return (
            <a key={p.id ?? idx} className="product-tile" href="#" aria-label={title}>
              <div className="product-box">
                <Image
                  src={img}
                  alt={title}
                  width={800}
                  height={800}
                  className="product-img"
                  priority={idx < 6}
                />
              </div>
              <div className="product-meta">{title}</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
