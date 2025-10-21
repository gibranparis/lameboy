'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BIRKINS = [
  '/cart/birkin-green.png',
  '/cart/birkin-royal.png',
  '/cart/birkin-sky.png',
];

export default function CartButton({ inHeader=false }) {
  const [count, setCount] = useState(0);
  const [img, setImg] = useState(BIRKINS[0]);
  const btnRef = useRef(null);

  // pick a birkin on mount
  useEffect(() => {
    const i = Math.floor(Math.random() * BIRKINS.length);
    setImg(BIRKINS[i]);
  }, []);

  // listen for add-to-cart events
  useEffect(() => {
    const onAdd = (e) => {
      setCount(c => c + (e?.detail?.qty || 1));
      // tiny bump animation
      const el = btnRef.current;
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 350);
    };
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, []);

  const showBadge = count > 0;

  return (
    <button
      ref={btnRef}
      className="cart-fab"
      type="button"
      aria-label="Cart"
      title={`Cart (${count})`}
      style={inHeader ? {} : { position:'fixed', right:16, top:16 }}
      onClick={() => { /* hook up drawer later */ }}
    >
      <span className="cart-img-wrap">
        <img src={img} alt="" />
      </span>
      {showBadge && <span className="cart-badge">{count}</span>}
    </button>
  );
}
