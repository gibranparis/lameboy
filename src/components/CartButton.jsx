// src/components/CartButton.jsx
// @ts-check
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * CartButton
 * Listens for:
 *  - 'lb:add-to-cart' | 'cart:add' -> detail: { count|qty }
 *  - 'cart:set'                    -> detail: { count }
 *  - 'cart:clear'
 */
export default function CartButton({
  size = 48,
  inHeader = false,
  imgSrc = '/cart/birkin.png',
  onClick,
}) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  /** @type {React.RefObject<HTMLButtonElement>} */
  const btnRef = useRef(null);
  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const tPulse = useRef(null);
  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const tBump = useRef(null);

  useEffect(() => {
    const add = (delta = 1) => {
      setCount((c) => Math.max(0, c + delta));
      setPulse(true);
      try {
        btnRef.current?.classList.add('lb-bump');
        if (tBump.current) clearTimeout(tBump.current);
        tBump.current = setTimeout(() => btnRef.current?.classList.remove('lb-bump'), 240);
      } catch {}
      if (tPulse.current) clearTimeout(tPulse.current);
      tPulse.current = setTimeout(() => setPulse(false), 360);
    };

    const onAdd = (e) => add(Number(e?.detail?.count ?? e?.detail?.qty ?? 1) || 1);
    const onSet = (e) => setCount(Math.max(0, Number(e?.detail?.count ?? 0) || 0));
    const onClear = () => setCount(0);

    for (const target of [window, document]) {
      target.addEventListener('lb:add-to-cart', onAdd);
      target.addEventListener('cart:add', onAdd);
      target.addEventListener('cart:set', onSet);
      target.addEventListener('cart:clear', onClear);
    }
    return () => {
      for (const target of [window, document]) {
        target.removeEventListener('lb:add-to-cart', onAdd);
        target.removeEventListener('cart:add', onAdd);
        target.removeEventListener('cart:set', onSet);
        target.removeEventListener('cart:clear', onClear);
      }
      if (tPulse.current) clearTimeout(tPulse.current);
      if (tBump.current) clearTimeout(tBump.current);
    };
  }, []);

  const aria = useMemo(
    () => (count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'),
    [count]
  );

  const fallbackSrc = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
        <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#60a5fa"/></linearGradient></defs>
        <rect width="64" height="64" rx="14" ry="14" fill="#0f1115"/>
        <path d="M18 26h28l-3 20H21l-3-20z" fill="url(#g)"/>
        <circle cx="26" cy="49" r="2.8" fill="#fff"/><circle cx="38" cy="49" r="2.8" fill="#fff"/>
        <path d="M24 26v-3a8 8 0 0 1 16 0v3" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
      </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }, [size]);

  const S = {
    btn: {
      position: 'relative',
      display: 'inline-grid',
      placeItems: 'center',
      width: size,
      height: size,
      borderRadius: 9999,
      padding: 0,
      border: 0,
      background: inHeader ? 'transparent' : 'rgba(255,255,255,.06)',
      cursor: 'pointer',
      lineHeight: 0,
      outline: 'none',
      boxShadow: inHeader ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.08)',
      transition: 'transform 120ms ease',
      zIndex: 2,
    },
    imgWrap: {
      width: Math.round(size * 0.86),
      height: Math.round(size * 0.86),
      display: 'grid',
      placeItems: 'center',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: 'block',
      userSelect: 'none',
      pointerEvents: 'none',
    },
    badge: {
      position: 'absolute',
      right: -4,
      top: -4,
      minWidth: 18,
      height: 18,
      padding: '0 5px',
      borderRadius: 9999,
      background: 'linear-gradient(180deg,#34d399,#22c55e)',
      color: '#0b0f15',
      fontWeight: 800,
      fontSize: 11,
      display: 'grid',
      placeItems: 'center',
      border: '1px solid rgba(255,255,255,.55)',
      boxShadow: '0 2px 10px rgba(0,0,0,.45)',
      transform: pulse ? 'scale(1.06)' : 'scale(1)',
      transition: 'transform 160ms ease',
      pointerEvents: 'none',
    },
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cart-fab ${pulse ? 'cart-pulse' : ''}`}
        aria-label={aria}
        title="Cart"
        onClick={onClick}
        style={S.btn}
      >
        <span className="cart-img-wrap" style={S.imgWrap}>
          <img
            src={imgOk ? imgSrc : fallbackSrc}
            alt=""
            style={S.img}
            draggable={false}
            onError={() => setImgOk(false)}
          />
        </span>
        {count > 0 && (
          <span className="cart-badge" aria-hidden="true" style={S.badge}>
            {count}
          </span>
        )}
      </button>

      {/* local animations; your global CSS can still target .cart-fab/.cart-badge */}
      <style jsx>{`
        .cart-pulse { animation: cartPulse .42s ease; }
        @keyframes cartPulse {
          0% { box-shadow: 0 0 0 0 rgba(11,240,95,.55) }
          70% { box-shadow: 0 0 0 12px rgba(11,240,95,0) }
          100% { box-shadow: 0 0 0 0 rgba(11,240,95,0) }
        }
        .lb-bump { animation: lbBump 240ms ease; }
        @keyframes lbBump {
          0% { transform: scale(1) }
          50% { transform: scale(1.06) }
          100% { transform: scale(1) }
        }
      `}</style>
    </>
  );
}
