// @ts-check
'use client';

import { useEffect, useMemo, useState } from 'react';

const BIRKINS = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];

export default function CartButton({ inHeader=false }) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const src = useMemo(() => {
    // simple stable pick per session
    const i = Math.abs((Date.now() >> 6) % BIRKINS.length);
    return BIRKINS[i];
  }, []);

  // Listen for adds
  useEffect(() => {
    const onAdd = (e) => {
      setCount(c => c + Number(e?.detail?.qty || 1));
      setPulse(true);
      setTimeout(() => setPulse(false), 420);
    };
    window.addEventListener('lb:add-to-cart', onAdd);
    document.addEventListener('lb:add-to-cart', onAdd);
    return () => {
      window.removeEventListener('lb:add-to-cart', onAdd);
      document.removeEventListener('lb:add-to-cart', onAdd);
    };
  }, []);

  return (
    <button
      type="button"
      className={['cart-fab', pulse ? 'cart-pulse' : ''].join(' ')}
      aria-label="Open cart"
      title="Cart"
    >
      <span className="cart-img-wrap">
        <img src={src} alt="" />
      </span>
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
