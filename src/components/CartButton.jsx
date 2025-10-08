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
     <svg viewBox="0 0 24 24" aria-hidden="true">
  {/* body + wheels follow currentColor */}
  <path d="M3 5h2l2.2 9.2c.1.4.5.8 1 .8h8.7a1 1 0 0 0 .98-.78l1.1-5A1 1 0 0 0 18 8H7.6"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="10" cy="19" r="1.6" fill="currentColor"/>
  <circle cx="17" cy="19" r="1.6" fill="currentColor"/>
  {/* orange “handlebars” */}
  <path className="cb-handle" d="M3 5c1.2 0 2.2-.9 2.4-2h1.2" fill="none" stroke="#F7A02D" strokeWidth="1.8" strokeLinecap="round"/>
</svg>


      {count > 0 && (
        <span className={`cart-badge ${pulseTag ? 'swap-green' : ''}`}>
          {count}
        </span>
      )}
    </button>
  );
}
