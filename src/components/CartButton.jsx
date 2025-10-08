// src/components/CartButton.jsx
'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function CartButton() {
  const { count, bumpKey } = useCart();
  const [bump, setBump] = useState(false);
  const [pulseTag, setPulseTag] = useState(false);

  useEffect(() => {
    if (bumpKey === 0) return;
    setBump(true);
    setPulseTag(true);
    const t1 = setTimeout(() => setBump(false), 380);
    const t2 = setTimeout(() => setPulseTag(false), 520);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [bumpKey]);

  return (
    <button
      className={`cart-fab ${bump ? 'bump' : ''}`}
      type="button"
      aria-label="Cart"
      aria-live="polite"
      title="Cart"
    >
      {/* Cart icon with separate orange handlebars */}
      <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
        {/* handlebars (filled; color set in CSS) */}
        <rect className="cb-handle" x="3" y="4" width="5.6" height="2.2" rx="1.1" />
        {/* cart outline uses currentColor so it’s white in night, dark in day */}
        <path
          className="cb-body"
          d="M7 6h12l-1.4 5.3a2 2 0 0 1-1.9 1.5H9.6L8.3 16H18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* wheels */}
        <circle className="cb-wheel" cx="9" cy="18" r="1.6" fill="currentColor" />
        <circle className="cb-wheel" cx="16" cy="18" r="1.6" fill="currentColor" />
      </svg>

      {count > 0 && (
        <span className={`cart-badge ${pulseTag ? 'swap-green' : ''}`}>
          {count}
        </span>
      )}
    </button>
  );
}
