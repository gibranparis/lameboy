// src/components/DayNightToggle.jsx
'use client';

import { useEffect } from 'react';

export default function DayNightToggle({
  value = 'day',                 // 'day' | 'night'
  onChange = () => {},
  size = 56,                     // visual height; width auto (≈ 1.9×)
  className = '',
  style = {},
}) {
  const h = Math.max(44, size);
  const w = Math.round(h * 1.9);
  const r = Math.round(h / 2);
  const isDay = value !== 'night';

  // keyboard toggle accessibility
  useEffect(() => {
    const el = document.getElementById('lb-daynight');
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(isDay ? 'night' : 'day');
      }
    };
    el?.addEventListener('keydown', handler);
    return () => el?.removeEventListener('keydown', handler);
  }, [isDay, onChange]);

  return (
    <button
      id="lb-daynight"
      type="button"
      aria-label="Toggle day/night"
      onClick={() => onChange(isDay ? 'night' : 'day')}
      className={`lb-dn ${isDay ? 'is-day' : 'is-night'} ${className}`}
      style={{ height: h, width: w, borderRadius: r, ...style }}
    >
      {/* Track */}
      <div className="track" />

      {/* Decorative layer (clouds / stars / Virgo) */}
      <div className="decor" aria-hidden="true">
        {/* Clouds (day only) */}
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />

        {/* Stars field (night only) */}
        <svg className="stars" viewBox="0 0 190 100" preserveAspectRatio="none">
          {/* Soft sky glow */}
          <defs>
            <radialGradient id="nightGlow" cx="30%" cy="30%" r="75%">
              <stop offset="0%"  stopColor="#1b1f3a" />
              <stop offset="60%" stopColor="#0f1226" />
              <stop offset="100%" stopColor="#090a16" />
            </radialGradient>
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="190" height="100" fill="url(#nightGlow)" />

          {/* Scattered stars */}
          {[
            [18,22],[30,64],[46,36],[60,18],[72,54],[82,30],[12,58],
            [40,72],[52,12],[66,40],[78,68],[24,34]
          ].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" filter="url(#starGlow)" opacity="0.9"/>
          ))}

          {/* Virgo constellation (approx layout) */}
          <g className="virgo" stroke="#7aa2ff" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.95">
            {/* points */}
            {[
              [110,20],[125,28],[138,40],[152,52],[146,70],[130,78],[116,64],[100,48]
            ].map(([x,y],i)=>(
              <circle key={`vpt-${i}`} cx={x} cy={y} r="1.9" fill="#cfe2ff" />
            ))}
            {/* lines */}
            <polyline fill="none" points="110,20 125,28 138,40 152,52 146,70 130,78 116,64 100,48 110,20" />
          </g>
        </svg>
      </div>

      {/* Knob with Sun/Moon */}
      <div className={`knob ${isDay ? 'day' : 'night'}`}>
        {/* Sun (day) */}
        <svg viewBox="0 0 48 48" className="sun" aria-hidden="true">
          <defs>
            <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="g"/>
              <feMerge>
                <feMergeNode in="g"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="24" cy="24" r="10" fill="#FFE270" stroke="#FFD44D" strokeWidth="2" filter="url(#sunGlow)"/>
          <g stroke="#FFD44D" strokeWidth="2" strokeLinecap="round" opacity=".9">
            <line x1="24" y1="3"  x2="24" y2="11" />
            <line x1="24" y1="37" x2="24" y2="45" />
            <line x1="3"  y1="24" x2="11" y2="24" />
            <line x1="37" y1="24" x2="45" y2="24" />
            <line x1="9"  y1="9"  x2="14" y2="14" />
            <line x1="34" y1="34" x2="39" y2="39" />
            <line x1="9"  y1="39" x2="14" y2="34" />
            <line x1="34" y1="14" x2="39" y2="9"  />
          </g>
        </svg>

        {/* Moon (night) */}
        <svg viewBox="0 0 48 48" className="moon" aria-hidden="true">
          <defs>
            <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="b"/>
              <feMerge>
                <feMergeNode in="b"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M30 4a18 18 0 1 0 14 28.5A16 16 0 1 1 30 4z" fill="#b7c7ff" filter="url(#moonGlow)"/>
          <circle cx="22" cy="18" r="2.2" fill="#dfe6ff" />
          <circle cx="27" cy="26" r="1.6" fill="#dfe6ff" />
          <circle cx="18" cy="28" r="1.8" fill="#dfe6ff" />
        </svg>
      </div>

      <style jsx>{`
        .lb-dn{
          position:relative; display:inline-block; padding:0; border:0; background:transparent;
          cursor:pointer; outline-offset:4px;
        }
        .track{
          position:absolute; inset:0; border-radius:inherit; overflow:hidden;
          background: linear-gradient(180deg,#cfe6ff 0%,#eaf5ff 55%,#ffffff 100%);
          box-shadow: 0 6px 16px rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,.7);
          transition: background .25s ease, box-shadow .25s ease;
        }
        .is-night .track{
          background: radial-gradient(120% 120% at 30% 30%, #1a1b2e 0%, #0e1024 55%, #070813 100%);
          box-shadow: 0 8px 18px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.15);
        }

        .decor{ position:absolute; inset:0; border-radius:inherit; overflow:hidden; pointer-events:none; }

        /* Clouds */
        .cloud{
          position:absolute; background:#fff; border-radius:999px; filter: drop-shadow(0 3px 6px rgba(0,0,0,.08));
          opacity:.96; transition: transform .45s ease, opacity .35s ease;
        }
        .cloud::before,.cloud::after{ content:""; position:absolute; background:#fff; border-radius:999px; }
        .c1{ left:10%; top:22%; width:34%; height:38%; }
        .c1::before{ left:-22%; top:16%; width:46%; height:58%; }
        .c1::after { right:-18%; top:30%; width:36%; height:46%; }

        .c2{ left:54%; top:54%; width:26%; height:28%; opacity:.92; }
        .c2::before{ left:-24%; top:8%; width:40%; height:58%; }
        .c2::after { right:-18%; top:20%; width:34%; height:44%; }

        .c3{ left:36%; top:10%; width:18%; height:22%; opacity:.94; }
        .c3::before{ left:-28%; top:10%; width:32%; height:44%; }
        .c3::after { right:-20%; top:26%; width:28%; height:38%; }

        /* Gentle drift while in day */
        .is-day .c1{ animation: drift1 8s ease-in-out infinite; }
        .is-day .c2{ animation: drift2 10s ease-in-out infinite; }
        .is-day .c3{ animation: drift3 7.5s ease-in-out infinite; }
        @keyframes drift1 { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(6%) } }
        @keyframes drift2 { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(-5%) } }
        @keyframes drift3 { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(4%) } }

        /* Stars + Virgo (only visible at night) */
        .stars{ position:absolute; inset:0; opacity:0; transition: opacity .35s ease; }
        .is-night .stars{ opacity:1; }

        /* Knob */
        .knob{
          position:absolute; top:50%; left:4px; width:calc(50% - 6px); height:calc(100% - 8px);
          transform: translate(0,-50%); border-radius:inherit; display:grid; place-items:center;
          background:#cfe6ff;
          box-shadow: 0 8px 16px rgba(98,150,255,.30), inset 0 0 0 1px rgba(255,255,255,.8);
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease;
        }
        .knob.night{
          transform: translate(calc(100% + 4px), -50%);
          background:#0e1124;
          box-shadow: 0 10px 18px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.18);
        }
        .sun{ width:65%; height:65%; }
        .moon{ width:65%; height:65%; display:none; }
        .knob.night .sun{ display:none; }
        .knob.night .moon{ display:block; }
      `}</style>
    </button>
  );
}
