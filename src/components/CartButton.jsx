// @ts-check
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Simple cart button with Birkin PNG + hugging badge.
 * Listens for `cart:add` events: { detail: { count: number } }
 */
export default function CartButton({ inHeader = false, imgSrc = '/cart/birkin.png' }) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const btnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);

  useEffect(() => {
    const onAdd = (e) => {
      const delta = Number(e?.detail?.count ?? 1) || 1;
      setCount((c) => c + delta);
      setPulse(true);
      // bump animation class helper
      try {
        btnRef.current?.classList.add('bump');
        setTimeout(() => btnRef.current?.classList.remove('bump'), 350);
      } catch {}
      // clear the pulse class
      const t = setTimeout(() => setPulse(false), 450);
      return () => clearTimeout(t);
    };

    window.addEventListener('cart:add', onAdd);
    document.addEventListener('cart:add', onAdd);
    return () => {
      window.removeEventListener('cart:add', onAdd);
      document.removeEventListener('cart:add', onAdd);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`cart-fab ${pulse ? 'cart-pulse' : ''}`}
      aria-label={`Cart${count ? `, ${count} item${count===1?'':'s'}` : ''}`}
    >
      <span className="cart-img-wrap">
        <img src={imgSrc} alt="" />
      </span>
      {count > 0 && (
        <span className="cart-badge" aria-hidden="true">{count}</span>
      )}
    </button>
  );
}
