// src/components/ChakraOrbButton.tsx
'use client';

import React, {useMemo, useState} from 'react';

type Props = {
  segments?: 5 | 7;
  size?: number;           // px
  spinMs?: number;         // one rotation
  revealMs?: number;       // not used here but accepted
  flashMs?: number;        // click flash
  flashColor?: string;     // click flash color
  title?: string;
  onClick?: () => void;
};

const COLORS_7 = ['#ffd400','#00d084','#06f','#8b5cf6','#ef4444','#f97316','#22c55e'];
const COLORS_5 = ['#ffd400','#06f','#8b5cf6','#ef4444','#22c55e'];

export default function ChakraOrbButton({
  segments = 7,
  size = 44,
  spinMs = 3200,
  revealMs, // eslint-disable-line @typescript-eslint/no-unused-vars
  flashMs = 420,
  flashColor = '#0bf05f',
  title,
  onClick
}: Props) {
  const [flash, setFlash] = useState(false);
  const radius = size/2;
  const dot = Math.max(6, Math.round(size*0.18));
  const ring = Math.max(10, Math.round(size*0.36));
  const colors = useMemo(()=> segments === 5 ? COLORS_5 : COLORS_7, [segments]);

  const handle = () => {
    setFlash(true);
    window.setTimeout(()=>setFlash(false), flashMs);
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={title}
      aria-label={title}
      style={{
        width:size, height:size, borderRadius:'50%',
        border:'0', background:'transparent', padding:0, cursor:'pointer',
        position:'relative', outline:'none'
      }}
    >
      {/* click flash */}
      {flash && (
        <span style={{
          position:'absolute', inset:0, borderRadius:'50%',
          boxShadow:`0 0 0 2px ${flashColor}, 0 0 24px ${flashColor}, 0 0 60px ${flashColor}`,
          transition:`opacity ${flashMs}ms ease-out`, opacity:.85, pointerEvents:'none'
        }}/>
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ display:'block' }}
      >
        {/* group spins; child items counter-rotate to preserve the cross (+) appearance */}
        <g style={{ transformOrigin:`${radius}px ${radius}px`, animation:`spin ${spinMs}ms linear infinite` }}>
          {colors.map((c, i) => {
            const a = (i / colors.length) * Math.PI * 2;
            const cx = radius + ring * Math.cos(a);
            const cy = radius + ring * Math.sin(a);
            return (
              <g key={i} style={{ transformOrigin:`${cx}px ${cy}px`, animation:`anti ${spinMs}ms linear infinite` }}>
                <circle cx={cx} cy={cy} r={dot/2} fill={c} />
                <circle cx={cx} cy={cy} r={dot/2} fill="url(#glow)"/>
              </g>
            );
          })}
        </g>
        {/* center white (7th chakra) */}
        <circle cx={radius} cy={radius} r={Math.max(6, Math.round(size*0.24))} fill="#ffffff" />
        <defs>
          <radialGradient id="glow">
            <stop offset="60%" stopColor="#fff" stopOpacity=".35"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes anti { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      `}</style>
    </button>
  );
}
