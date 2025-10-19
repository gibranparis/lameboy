// @ts-check
// src/components/CartButton.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function CartButton({ inHeader = false }) {
  const [count, setCount] = useState(0);
  const btnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);

  // A small set of Birkin images; replace with your actual filenames if different.
  const imgs = useMemo(
    () => [
      '/cart/birkin-1.png',
      '/cart/birkin-2.png',
      '/cart/birkin-3.png',
      '/cart/birkin-4.png',
      '/cart/birkin.png',       // <- final fallback
    ],
    []
  );
  const pick = useMemo(() => Math.floor(Math.random() * imgs.length), [imgs.length]);
  const fallback = '/cart/birkin.png';

  // Listen for add events
  useEffect(() => {
    const onAdd = (/** @type {CustomEvent<{qty?:number}>} */ e) => {
      const qty = Math.max(1, e?.detail?.qty || 1);
      setCount(c => c + qty);
      const el = btnRef.current;
      if (el) {
        el.classList.remove('bump');
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
        <img
          src={imgs[pick]}
          alt=""
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
        />
      </span>
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
