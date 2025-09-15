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
    <button className={`cart-fab ${bump ? 'bump' : ''}`} type="button" aria-label="Cart" aria-live="polite">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h12l-1.2 12.4A2 2 0 0 1 14.81 22H9.19a2 2 0 0 1-1.99-1.6L6 8Zm3-1a3 3 0 1 1 6 0h-2a1 1 0 1 0-2 0H9Z" />
      </svg>
      {count > 0 && (
        <span className={`cart-badge ${pulseTag ? 'swap-green' : ''}`}>
          {count}
        </span>
      )}
    </button>
  );
}
