'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BIRKINS = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];

export default function CartButton({ inHeader=false }) {
  const [count, setCount] = useState(0);
  const [bump, setBump]   = useState(false);
  const [src, setSrc]     = useState(BIRKINS[0]);
  const bumpRef = useRef(null);

  // load a random Birkin once
  useEffect(() => {
    const i = Math.floor(Math.random() * BIRKINS.length);
    setSrc(BIRKINS[i]);
  }, []);

  // cart:add listener
  useEffect(() => {
    const onAdd = () => {
      setCount(c => c + 1);
      setBump(true);
      clearTimeout(bumpRef.current);
      bumpRef.current = setTimeout(() => setBump(false), 350);
    };
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, []);

  const cls = useMemo(() => ['cart-fab', bump ? 'bump' : ''].join(' '), [bump]);

  return (
    <button className={cls} aria-label="Cart">
      <span className="cart-img-wrap">
        <img src={src} alt="" onError={(e)=>{ e.currentTarget.style.opacity='.001'; }} />
      </span>
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
}
