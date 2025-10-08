'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function CartButton({ inHeader = false }) {
  const { count, bumpKey } = useCart();
  const [bump, setBump] = useState(false);
  const [pulseTag, setPulseTag] = useState(false);

  useEffect(() => {
    if (bumpKey === 0) return;
    setBump(true);
    setPulseTag(true);
    const t1 = setTimeout(() => setBump(false), 300);
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
      style={inHeader ? { background:'transparent', border:'none', boxShadow:'none', width:'auto', height:'auto', padding:0 } : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width:24, height:24, display:'block' }}>
        <path className="cb-handle" d="M5 6 h4 a1 1 0 0 1 0 2 H5 a1 1 0 1 1 0-2z" />
        <path fill="currentColor" d="M6 7h12a1 1 0 0 1 .98 1.2l-1.3 6.5a2 2 0 0 1-1.97 1.6H9.1a2 2 0 0 1-1.94-1.5L5.2 8.8A1.2 1.2 0 0 1 6.4 7zM8.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7.8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
      </svg>

      {count > 0 && (
        <span className={`cart-badge ${pulseTag ? 'swap-green' : ''}`}>
          {count}
        </span>
      )}
    </button>
  );
}
