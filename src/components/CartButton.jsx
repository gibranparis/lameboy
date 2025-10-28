// @ts-check
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * CartButton
 * - Badge count updates via CustomEvents:
 *   - 'lb:add-to-cart' | 'cart:add'   -> detail: { id?, size?, count: +n }
 *   - 'cart:set'                      -> detail: { count: n } (hard set)
 *   - 'cart:clear'                    -> no detail (resets to 0)
 *
 * Props:
 * - size?: number        (button square size in px; default 48)
 * - inHeader?: boolean   (applies subtle style tweaks)
 * - imgSrc?: string      (cart image path; default '/cart/birkin.png')
 * - onClick?: () => void (optional click handler to open drawer, etc.)
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

  const btnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null);
  const bumpTimer  = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null);

  useEffect(() => {
    const add = (delta = 1) => {
      setCount(c => Math.max(0, c + delta));
      // visual feedback
      setPulse(true);
      if (btnRef.current) {
        btnRef.current.classList.add('lb-bump');
        if (bumpTimer.current) clearTimeout(bumpTimer.current);
        bumpTimer.current = setTimeout(() => btnRef.current?.classList.remove('lb-bump'), 280);
      }
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulse(false), 420);
    };

    const onAdd = (e) => {
      const delta = Number(e?.detail?.count ?? e?.detail?.qty ?? 1) || 1;
      add(delta);
    };

    const onSet = (e) => {
      const n = Math.max(0, Number(e?.detail?.count ?? 0) || 0);
      setCount(n);
      setPulse(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulse(false), 300);
    };

    const onClear = () => setCount(0);

    // Listen to both our new and legacy channels
    window.addEventListener('lb:add-to-cart', onAdd);
    window.addEventListener('cart:add', onAdd);
    window.addEventListener('cart:set', onSet);
    window.addEventListener('cart:clear', onClear);
    document.addEventListener('lb:add-to-cart', onAdd);
    document.addEventListener('cart:add', onAdd);
    document.addEventListener('cart:set', onSet);
    document.addEventListener('cart:clear', onClear);

    return () => {
      window.removeEventListener('lb:add-to-cart', onAdd);
      window.removeEventListener('cart:add', onAdd);
      window.removeEventListener('cart:set', onSet);
      window.removeEventListener('cart:clear', onClear);
      document.removeEventListener('lb:add-to-cart', onAdd);
      document.removeEventListener('cart:add', onAdd);
      document.removeEventListener('cart:set', onSet);
      document.removeEventListener('cart:clear', onClear);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      if (bumpTimer.current) clearTimeout(bumpTimer.current);
    };
  }, []);

  // Accessible label
  const aria = useMemo(() => {
    const base = 'Cart';
    if (!count) return base;
    return `${base}, ${count} item${count === 1 ? '' : 's'}`;
  }, [count]);

  // Fallback inline SVG if birkin image is missing
  const fallbackSrc = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#2dd4bf"/>
            <stop offset="1" stop-color="#60a5fa"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" ry="14" fill="#0f1115"/>
        <path d="M18 26h28l-3 20H21l-3-20z" fill="url(#g)"/>
        <circle cx="26" cy="49" r="2.8" fill="#fff"/>
        <circle cx="38" cy="49" r="2.8" fill="#fff"/>
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
      outline: 'none',
      cursor: 'pointer',
      lineHeight: 0,
      transition: 'transform 120ms ease, box-shadow 180ms ease',
      boxShadow: pulse
        ? '0 0 0 2px rgba(50,255,199,.3)'
        : inHeader
          ? 'none'
          : 'inset 0 0 0 1px rgba(255,255,255,.08)',
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
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.35))',
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
  } as const;

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

      {/* minimal local styles for bump animation */}
      <style jsx>{`
        .lb-bump {
          animation: lb-bump-kf 240ms ease;
        }
        @keyframes lb-bump-kf {
          0%   { transform: scale(1.00); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1.00); }
        }
      `}</style>
    </>
  );
}
