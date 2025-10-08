// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useMemo } from 'react';

export default function DayNightToggle({
  value = 'day',          // 'day' | 'night'
  onChange = () => {},
  size = 56,              // total height; width auto (≈ 1.9×)
  className = '',
  style = {},
}) {
  const h = Math.max(40, size);
  const w = Math.round(h * 1.9);
  const r = Math.round(h / 2);

  const isDay = value !== 'night';

  // keyboard toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(isDay ? 'night' : 'day');
      }
    };
    const el = document.getElementById('lb-daynight');
    el?.addEventListener('keydown', handler);
    return () => el?.removeEventListener('keydown', handler);
  }, [isDay, onChange]);

  return (
    <button
      id="lb-daynight"
      type="button"
      aria-label="Toggle day/night"
      onClick={() => onChange(isDay ? 'night' : 'day')}
      className={`lb-dn ${className}`}
      style={{
        height: h, width: w, borderRadius: r,
        ...style,
      }}
    >
      <div className="track" />
      <div className={`knob ${isDay ? 'day' : 'night'}`}>
        {/* sun / moon glyphs are sized internally; no outer pill visual change when scaled */}
        <svg viewBox="0 0 48 48" className="sun" aria-hidden="true">
          <circle cx="24" cy="24" r="10" />
          <g className="rays">
            <line x1="24" y1="3" x2="24" y2="11" />
            <line x1="24" y1="37" x2="24" y2="45" />
            <line x1="3"  y1="24" x2="11" y2="24" />
            <line x1="37" y1="24" x2="45" y2="24" />
            <line x1="9"  y1="9"  x2="14" y2="14" />
            <line x1="34" y1="34" x2="39" y2="39" />
            <line x1="9"  y1="39" x2="14" y2="34" />
            <line x1="34" y1="14" x2="39" y2="9"  />
          </g>
        </svg>
        <svg viewBox="0 0 48 48" className="moon" aria-hidden="true">
          <path d="M30 4a18 18 0 1 0 14 28.5A16 16 0 1 1 30 4z" />
          <circle cx="22" cy="18" r="2.2" />
          <circle cx="27" cy="26" r="1.6" />
          <circle cx="18" cy="28" r="1.8" />
        </svg>
      </div>

      <style jsx>{`
        .lb-dn{
          position:relative; display:inline-block;
          padding:0; border:0; background:transparent; cursor:pointer;
          box-shadow:none; outline-offset:4px;
        }
        .track{
          position:absolute; inset:0;
          background: linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.65));
          border-radius:inherit;
          box-shadow: 0 4px 14px rgba(0,0,0,.10), inset 0 0 0 1px rgba(0,0,0,.06);
        }
        /* knob slides inside track */
        .knob{
          position:absolute; top:50%; left:4px;
          width:calc(50% - 6px); height:calc(100% - 8px);
          transform:translate(0,-50%); border-radius:inherit;
          display:grid; place-items:center;
          background: #cfe6ff;
          box-shadow: 0 8px 16px rgba(98,150,255,.32),
                      inset 0 0 0 1px rgba(255,255,255,.75);
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease;
        }
        .knob.night{
          transform: translate(calc(100% + 4px), -50%);
          background: #141728;
          box-shadow: 0 8px 16px rgba(0,0,0,.45),
                      inset 0 0 0 1px rgba(255,255,255,.18);
        }
        .sun, .moon{ width:64%; height:64%; }
        .sun{ fill:#FFE270; stroke:#FFD44D; stroke-width:2; }
        .sun .rays line{ stroke:#FFD44D; stroke-width:2; stroke-linecap:round; }
        .moon{ fill:#d8d9e3; }
      `}</style>
    </button>
  );
}
