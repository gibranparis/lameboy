// src/components/CartButton.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BIRKINS = [
  '/shop/birkin-1.png',
  '/shop/birkin-2.png',
  '/shop/birkin-3.png',
];

export default function CartButton({
  size = 36,                    // same height as toggle/orb
  title = 'Open cart',
  onClick,
  badge = 0,
  className = '',
  style = {},
}) {
  // preload & pick one once
  const [src, setSrc] = useState(BIRKINS[0]);
  const picked = useRef(false);
  useEffect(() => {
    BIRKINS.forEach(s => { const i = new Image(); i.src = s; i.decoding = 'async'; });
    if (!picked.current) {
      picked.current = true;
      const one = BIRKINS[Math.floor(Math.random() * BIRKINS.length)] ?? BIRKINS[0];
      setSrc(one);
    }
  }, []);

  const box = useMemo(() => Math.max(28, Math.round(size)), [size]);

  return (
    <button
      aria-label={title}
      className={className}
      onClick={onClick}
      style={{
        contain:'layout size paint',
        position:'relative',
        display:'inline-grid',
        placeItems:'center',
        width: box, height: box,
        padding: 0, margin: 0, lineHeight: 0,
        background:'transparent', border:'none', cursor:'pointer',
        ...style,
      }}
    >
      <span
        style={{
          width:'100%', height:'100%', aspectRatio:'1 / 1', lineHeight:0,
          display:'grid', placeItems:'center',
        }}
      >
        <img
          src={src}
          alt=""
          width={box}
          height={box}
          decoding="async"
          draggable={false}
          style={{
            display:'block',
            width:'100%', height:'100%',
            objectFit:'contain',
            imageRendering:'auto',
            filter:'saturate(1.0)',
          }}
        />
      </span>

      {badge > 0 && (
        <span
          style={{
            position:'absolute', top:-6, right:-6,
            minWidth:18, height:18, padding:'0 5px',
            borderRadius:999, fontSize:11, lineHeight:'18px', textAlign:'center',
            color:'#000', background:'#0bf05f', boxShadow:'0 0 0 1px rgba(0,0,0,.25)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
