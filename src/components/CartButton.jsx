'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BAG_SOURCES = [
  '/cart/birkin-1.png',
  '/cart/birkin-2.png',
  '/cart/birkin-3.png',
  '/cart/birkin-4.png',
  // safe fallbacks (keep these in /public/cart/)
  '/cart/birkin-fallback.png',
];

export default function CartButton({ inHeader=false }) {
  const [qty, setQty] = useState(0);
  const [bump, setBump] = useState(false);

  // choose a bag once
  const initialIndex = useMemo(() => Math.floor(Math.random() * 4), []);
  const [bagIndex, setBagIndex] = useState(initialIndex);

  // if an image 404s, walk the fallback list
  const imgRef = useRef(null);
  const onImgError = () => {
    setBagIndex((i) => (i + 1 < BAG_SOURCES.length ? i + 1 : i));
  };

  useEffect(() => {
    const onAdd = () => {
      setQty((q) => q + 1);
      setBump(true);
      setTimeout(() => setBump(false), 350);
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
      className={`cart-fab ${bump ? 'bump' : ''}`}
      aria-label="Cart"
      title="Cart"
      type="button"
    >
      <span className="cart-img-wrap" aria-hidden>
        <img
          ref={imgRef}
          src={BAG_SOURCES[bagIndex]}
          alt=""
          loading="eager"
          decoding="sync"
          onError={onImgError}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </span>

      {qty > 0 && <span className="cart-badge">{qty}</span>}
    </button>
  );
}
