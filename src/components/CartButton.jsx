// @ts-check
// src/components/CartButton.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function CartButton({ inHeader = false }) {
  const [count, setCount] = useState(0);
  const btnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);

  // Listen for cart additions: window.dispatchEvent(new CustomEvent('cart:add', { detail: { qty: 1 } }))
  useEffect(() => {
    const onAdd = (/** @type {CustomEvent<{qty?:number}>} */ e) => {
      const qty = Math.max(1, e?.detail?.qty || 1);
      setCount(c => c + qty);
      // bump animation
      const el = btnRef.current;
      if (el) {
        el.classList.remove('bump');
        // force reflow
        // @ts-ignore
        void el.offsetWidth;
        el.classList.add('bump');
      }
    };
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, []);

  return (
    <button
      ref={btnRef}
      className="cart-fab"
      type="button"
      aria-label="Cart"
      title="Cart"
      style={inHeader ? undefined : { width:48, height:48 }}
    >
      <span className="cart-img-wrap">
        <img src="/cart/birkin.png" alt="" />
      </span>
      {count > 0 && (
        <span className="cart-badge" aria-live="polite">{count}</span>
      )}
    </button>
  );
}
