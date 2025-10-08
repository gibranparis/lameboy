// src/components/CartButton.jsx
'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function CartButton({ inHeader = false }) {
  const { count } = useCart?.() || { count: 0 };
  const [bump, setBump] = useState(false);

  const onClick = () => {
    setBump(true);
    setTimeout(() => setBump(false), 350);
  };

  return (
    <button
      type="button"
      className={`cart-fab ${bump ? 'bump' : ''}`}
      onClick={onClick}
      aria-label="Open cart"
      title="Cart"
      style={inHeader ? { } : {}}
    >
      {/* Birkin 25 silhouette (currentColor = body/wheels) */}
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {/* handle (orange via .cb-handle) */}
        <path className="cb-handle" d="M20 20c0-6 6-10 12-10s12 4 12 10" fill="none" strokeWidth="3" />
        {/* bag body */}
        <path d="M12 24h40c1.7 0 3 1.3 3 3v26c0 1.7-1.3 3-3 3H12c-1.7 0-3-1.3-3-3V27c0-1.7 1.3-3 3-3z" fill="currentColor" />
        {/* flap */}
        <rect x="10" y="24" width="44" height="8" rx="1.5" ry="1.5" fill="currentColor" />
        {/* clasp */}
        <rect x="30" y="28" width="4" height="6" rx="1" ry="1" fill="#fff"/>
      </svg>

      {/* badge */}
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
