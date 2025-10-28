// src/components/CartButton.jsx
// @ts-check
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BIRKIN_SOURCES = [
  '/cart/birkin-green.png',
  '/cart/birkin-royal.png',
  '/cart/birkin-sky.png',
  '/cart/birkin.png',          // legacy
];

export default function CartButton({
  size = 48,
  inHeader = true,
  imgSrc,                       // optional override
  onClick,
}) {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [srcIdx, setSrcIdx] = useState(0);

  // Prefer explicit prop, else try our list (remember the winner this tab)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('lb:birkin-src');
      if (!imgSrc && cached) {
        const i = BIRKIN_SOURCES.indexOf(cached);
        if (i >= 0) setSrcIdx(i);
      }
    } catch {}
  }, [imgSrc]);

  const btnRef = useRef/** @type {React.RefObject<HTMLButtonElement>} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null);
  const bumpTimer  = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null);

  useEffect(() => {
    const add = (delta = 1) => {
      setCount((c) => Math.max(0, c + delta));
      setPulse(true);
      if (btnRef.current) {
        btnRef.current.classList.add('lb-bump');
        clearTimeout(bumpTimer.current || 0);
        bumpTimer.current = setTimeout(() => btnRef.current?.classList.remove('lb-bump'), 260);
      }
      clearTimeout(pulseTimer.current || 0);
      pulseTimer.current = setTimeout(() => setPulse(false), 420);
    };

    const onAdd   = (e) => add(Number(e?.detail?.count ?? e?.detail?.qty ?? 1) || 1);
    const onSet   = (e) => setCount(Math.max(0, Number(e?.detail?.count ?? 0) || 0));
    const onClear = ()  => setCount(0);

    window.addEventListener('lb:add-to-cart', onAdd);
    window.addEventListener('cart:add',       onAdd);
    window.addEventListener('cart:set',       onSet);
    window.addEventListener('cart:clear',     onClear);
    document.addEventListener('lb:add-to-cart', onAdd);
    document.addEventListener('cart:add',       onAdd);
    document.addEventListener('cart:set',       onSet);
    document.addEventListener('cart:clear',     onClear);

    return () => {
      window.removeEventListener('lb:add-to-cart', onAdd);
      window.removeEventListener('cart:add',       onAdd);
      window.removeEventListener('cart:set',       onSet);
      window.removeEventListener('cart:clear',     onClear);
      document.removeEventListener('lb:add-to-cart', onAdd);
      document.removeEventListener('cart:add',       onAdd);
      document.removeEventListener('cart:set',       onSet);
      document.removeEventListener('cart:clear',     onClear);
      clearTimeout(pulseTimer.current || 0);
      clearTimeout(bumpTimer.current  || 0);
    };
  }, []);

  const aria = useMemo(() => (count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'), [count]);

  // fallback SVG (only if everything fails)
  const fallback = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#0f1115'/><path d='M18 26h28l-3 20H21l-3-20z' fill='url(#g)'/><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#2dd4bf'/><stop offset='1' stop-color='#60a5fa'/></linearGradient></defs><circle cx='26' cy='49' r='3' fill='#fff'/><circle cx='38' cy='49' r='3' fill='#fff'/><path d='M24 26v-3a8 8 0 0 1 16 0v3' stroke='#a7f3d0' stroke-width='2.4' fill='none'/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }, [size]);

  const chosenSrc = imgSrc ?? BIRKIN_SOURCES[srcIdx] ?? fallback;

  const S = {
    btn: {
      position:'relative', display:'inline-grid', placeItems:'center',
      width:size, height:size, borderRadius:9999, padding:0, border:0,
      background: inHeader ? 'transparent' : 'rgba(255,255,255,.06)',
      lineHeight:0, cursor:'pointer', outline:'none',
      transition:'transform .12s ease, box-shadow .18s ease',
      boxShadow: inHeader ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.08)',
    },
    imgWrap: { width: Math.round(size*0.86), height: Math.round(size*0.86), display:'grid', placeItems:'center' },
    img:     { width:'100%', height:'100%', objectFit:'contain', display:'block', userSelect:'none', pointerEvents:'none' },
    badge:   {
      position:'absolute', right:-4, top:-4, minWidth:18, height:18, padding:'0 5px',
      borderRadius:9999, background:'linear-gradient(180deg,#34d399,#22c55e)', color:'#0b0f15',
      fontWeight:800, fontSize:11, display:'grid', placeItems:'center',
      border:'1px solid rgba(255,255,255,.55)', boxShadow:'0 2px 10px rgba(0,0,0,.45)',
      transform: pulse ? 'scale(1.06)' : 'scale(1)', transition:'transform .16s ease', pointerEvents:'none',
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
            src={chosenSrc}
            alt=""
            style={S.img}
            draggable={false}
            onError={() => {
              // advance to next candidate, else use fallback
              if (!imgSrc && srcIdx < BIRKIN_SOURCES.length - 1) setSrcIdx(srcIdx + 1);
            }}
            onLoad={(e) => {
              // remember successful file for this tab/session
              try {
                const ok = (e.currentTarget?.src || '').replace(location.origin, '');
                if (BIRKIN_SOURCES.includes(ok)) localStorage.setItem('lb:birkin-src', ok);
              } catch {}
            }}
          />
        </span>

        {count > 0 && <span className="cart-badge" aria-hidden="true" style={S.badge}>{count}</span>}
      </button>

      <style jsx>{`
        .lb-bump { animation: lb-bump-kf 220ms ease; }
        @keyframes lb-bump-kf { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
      `}</style>
    </>
  );
}
