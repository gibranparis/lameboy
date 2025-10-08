'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * DayNightToggle (compact, self-contained)
 * - Exact visual size controlled by `size` (height). Default 32px.
 * - Width = size * 2.2
 * - No global CSS hooks; all styles are component-scoped.
 * - Sets data-theme="day|night" on [data-shop-root] (or body) for your theme tokens.
 */
export default function DayNightToggle({
  size = 32,                 // visual height in px
  storageKey = 'lb-theme',
  initial = 'day',
  id = 'lb-dn',
  className = '',
}) {
  const [theme, setTheme] = useState(initial); // 'day' | 'night'
  const isNight = theme === 'night';

  // derived geometry
  const H = Math.max(28, Math.round(size));
  const W = Math.round(H * 2.2);
  const R = Math.round(H / 2);
  const KNOB = Math.round(H - 6);
  const PAD = Math.round((H - KNOB) / 2);
  const knobLeftDay = PAD;
  const knobLeftNight = W - PAD - KNOB;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'day' || saved === 'night') setTheme(saved);
      else setTheme(initial);
    } catch {}
  }, [initial, storageKey]);

  useEffect(() => {
    const root = document.querySelector('[data-shop-root]') || document.body;
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(storageKey, theme); } catch {}
  }, [theme, storageKey]);

  const toggle = useCallback(() => setTheme(t => (t === 'day' ? 'night' : 'day')), []);

  return (
    <button
      type="button"
      id={id}
      aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      aria-pressed={isNight}
      onClick={toggle}
      className={['dn', className].join(' ')}
      style={{
        width: W,
        height: H,
        borderRadius: R,
      }}
    >
      {/* BACKGROUND */}
      <svg className="bg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          {/* day sky */}
          <linearGradient id={`${id}-day`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe7ff"/>
            <stop offset="60%" stopColor="#dff4ff"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>
          {/* night sky */}
          <radialGradient id={`${id}-night`} cx="30%" cy="30%" r="90%">
            <stop offset="0%" stopColor="#1a1a2b"/>
            <stop offset="55%" stopColor="#0b0b14"/>
            <stop offset="100%" stopColor="#000"/>
          </radialGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* pill */}
        <rect x="0" y="0" rx={R} ry={R} width={W} height={H}
              fill={`url(#${isNight ? `${id}-night` : `${id}-day`})`} />

        {/* clouds (day only) */}
        {!isNight && (
          <>
            <Cloud x={Math.round(W * .18)} y={Math.round(H * .35)} s={H * .35}/>
            <Cloud x={Math.round(W * .55)} y={Math.round(H * .6)}  s={H * .28}/>
            <Cloud x={Math.round(W * .42)} y={Math.round(H * .2)}  s={H * .22}/>
          </>
        )}

        {/* stars + Virgo (night only) */}
        {isNight && (
          <>
            {scatterStars(W, H).map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} fill="#fff" opacity={p[3]} />
            ))}
            {/* simple Virgo line & nodes */}
            <g opacity=".8">
              <path
                d={`M ${W*.16},${H*.68} L ${W*.34},${H*.40} L ${W*.50},${H*.58} L ${W*.70},${H*.32} L ${W*.84},${H*.50}`}
                stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="none" />
              {[ [0.16,0.68],[0.34,0.40],[0.50,0.58],[0.70,0.32],[0.84,0.50] ].map((t,i)=>(
                <circle key={i} cx={W*t[0]} cy={H*t[1]} r="1.4" fill="#fff" />
              ))}
            </g>
          </>
        )}
      </svg>

      {/* KNOB (sun/moon inside) */}
      <div
        className="knob"
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB,
          left: isNight ? knobLeftNight : knobLeftDay,
        }}
      >
        {/* SUN (day) */}
        <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#FFF9C4"/>
              <stop offset="60%" stopColor="#FFE082"/>
              <stop offset="100%" stopColor="rgba(255,220,80,.0)"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="9" fill="url(#lb-sun-fallback)" filter={`url(#${id}-glow)`} />
          <circle cx="12" cy="12" r="7" fill="#FFE082"/>
        </svg>

        {/* MOON (night) */}
        <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-moon`} cx="45%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#D7E5FF"/>
              <stop offset="100%" stopColor="#8FA9FF"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="8" fill={`url(#${id}-moon)`}/>
          <circle cx="9.5" cy="10" r="1.3" fill="#BBD0FF"/>
          <circle cx="14.2" cy="14.3" r="1.1" fill="#BBD0FF"/>
          <circle cx="16.4" cy="10.8" r="0.9" fill="#BBD0FF"/>
        </svg>
      </div>

      <style jsx>{`
        .dn{
          position:relative;
          display:inline-block;
          padding:0;
          border:none;
          background:transparent;
          cursor:pointer;
          line-height:0;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,.55);
        }
        .bg{ position:absolute; inset:0; border-radius:${R}px; display:block; }
        .knob{
          position:absolute; top:50%;
          transform: translateY(-50%);
          background:#fff;
          box-shadow: 0 5px 14px rgba(0,0,0,.16), inset 0 0 0 1px rgba(0,0,0,.08);
          display:grid; place-items:center;
          transition:left .32s cubic-bezier(.22,.61,.21,.99), background .25s ease;
        }
        .sun, .moon{ width:70%; height:70%; display:block; }
        .sun{ opacity:${isNight ? 0 : 1}; transition:opacity .2s ease; filter: drop-shadow(0 0 10px rgba(255,220,80,.65)); }
        .moon{ opacity:${isNight ? 1 : 0}; transition:opacity .2s ease; }
      `}</style>
    </button>
  );
}

/* Tiny cloud made from three circles */
function Cloud({ x, y, s }) {
  const w = s * 1.6, h = s;
  return (
    <g transform={`translate(${x},${y})`}>
      <g filter="url(#cloud-shadow)">
        <defs>
          <filter id="cloud-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity=".18" />
          </filter>
        </defs>
        <ellipse cx={w*0.35} cy={h*0.55} rx={w*0.35} ry={h*0.45} fill="#fff"/>
        <circle  cx={w*0.62} cy={h*0.45} r={h*0.32} fill="#fff"/>
        <circle  cx={w*0.20} cy={h*0.45} r={h*0.28} fill="#fff"/>
      </g>
    </g>
  );
}

function scatterStars(W, H) {
  // hand-picked spots for a nice look at any small size
  return [
    [W*0.18,H*0.28,1.2,.95],[W*0.30,H*0.64,1,.85],[W*0.46,H*0.36,1.1,.9],
    [W*0.60,H*0.18,1,.9],[W*0.72,H*0.54,1.1,.95],[W*0.82,H*0.30,1,.9],
    [W*0.12,H*0.58,1,.85],[W*0.40,H*0.72,1,.85],[W*0.52,H*0.16,1,.85],
    [W*0.66,H*0.40,1,.9],[W*0.78,H*0.68,1,.85],[W*0.24,H*0.34,1,.9],
  ];
}
