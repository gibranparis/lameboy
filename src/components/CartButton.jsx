// src/components/CartButton.jsx
'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

export default function CartButton({ inHeader = false, className = '' }) {
  const { count } = useCart?.() || { count: 0 };
  const [bump, setBump] = useState(false);

  // Choose one Birkin at random on first mount (client-only component)
  const src = useMemo(() => {
    const options = [
      '/cart/birkin-green.png',
      '/cart/birkin-sky.png',
      '/cart/birkin-royal.png',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }, []);

  const onClick = () => {
    setBump(true);
    setTimeout(() => setBump(false), 350);
  };

  return (
    <button
      type="button"
      aria-label="Open cart"
      title="Cart"
      onClick={onClick}
      className={[
        'cart-fab',        // base style (keeps it on same plane as orb/toggle)
        bump ? 'bump' : '',
        className,
      ].join(' ')}
      style={inHeader ? {} : {}}
    >
      {/* Birkin image (transparent PNG) */}
      <span className="cart-img-wrap" aria-hidden="true">
        <Image
          src={src}
          alt=""           // decorative (button has label)
          width={48}
          height={48}
          priority={false}
          draggable={false}
        />
      </span>

      {/* badge */}
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
