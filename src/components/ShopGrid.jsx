'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import BlueOrbCross3D from './BlueOrbCross3D';
import CartButton from './CartButton';         // you already have this
// If you had a previous left-orb component (e.g., ChakraOrbButton / LoopFab),
// do NOT import it here. We’re replacing it with BlueOrbCross3D in the header.

/**
 * ShopGrid
 * - Renders a simple header:
 *    left:  BlueOrbCross3D (chakra spinner)  ✅
 *    center: gender toggle pill (visual only here; wire as needed)
 *    right: cart button (existing component)
 * - Renders the product grid once images are ready to avoid janky cascade.
 */
export default function ShopGrid({ products = [] }) {
  const [ready, setReady] = useState(false);

  // ---- Cascade smoothing: wait for images to settle before reveal ----
  useEffect(() => {
    // collect the first batch of images on this page
    const imgs = Array.from(document.images || []).slice(0, 16);
    if (imgs.length === 0) {
      setReady(true);
      return;
    }
    let done = 0;
    const mark = () => {
      done++;
      if (done >= imgs.length) setReady(true);
    };
    imgs.forEach((img) => {
      if (img.complete) return mark();
      img.addEventListener('load', mark, { once: true });
      img.addEventListener('error', mark, { once: true });
    });
  }, []);

  // ---- Render ----
  return (
    <div>
      {/* HEADER */}
      <header className="shop-head" style={{ position: 'relative', zIndex: 75 }}>
        {/* left: chakra spinner */}
        <div style={{ position: 'fixed', left: 18, top: 18, zIndex: 120, pointerEvents: 'none' }}>
          <BlueOrbCross3D overrideGlowOpacity={0.7} height="44px" />
        </div>

        {/* center: gender toggle pill (keep your existing classes) */}
        <div
          className="shop-toggle shop-toggle--boy"
          style={{
            position: 'fixed',
            left: '50%',
            top: 18,
            transform: 'translateX(-50%)',
            zIndex: 75,
          }}
        >
          BOY
        </div>

        {/* right: cart */}
        <div className="cart-fab" aria-label="cart">
          <CartButton />
        </div>
      </header>

      {/* GRID */}
      <section
        className="shop-wrap"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity .36s cubic-bezier(.22,1,.36,1), transform .36s cubic-bezier(.22,1,.36,1)',
          willChange: 'opacity, transform',
        }}
      >
        <div className="shop-grid">
          {products.map((p, idx) => {
            const img = p?.images?.[0]?.url || '/placeholder.png';
            const title = p?.name ?? `Item ${idx + 1}`;
            return (
              <a key={p.id ?? idx} className="product-tile" href="#" aria-label={title}>
                <div className="product-box">
                  {/* Use next/image for stability; it respects container size */}
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
    </div>
  );
}
