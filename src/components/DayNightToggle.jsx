'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

/**
 * Scalable Day/Night toggle
 * - Controlled by `height` (default 44). Width auto-scales.
 * - Flips data-theme="day|night" on [data-shop-root] (or <body>)
 */
export default function DayNightToggle({
  storageKey = 'lb-theme',
  initial = 'day',
  height = 44,            // << set size here
  className = '',
  id = 'lb-daynight',
}) {
  const [theme, setTheme] = useState(initial); // 'day' | 'night'
  const isNight = theme === 'night';

  // derived sizes from height (keeps proportions tight)
  const H = Math.max(36, Math.round(height));
  const W = Math.round(H * 2.55);     // pill width ratio
  const KNOB_H = Math.round(H * 0.82);
  const KNOB_W = Math.round(KNOB_H * 1.25);
  const KNOB_PAD = Math.round(H * 0.14);
  const ICON_FRAC = 0.72;

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

  const virgo = useMemo(() => "M6,16 L10,11 L13,14 L17,9 L20,12", []);

  return (
    <button
      id={id}
      type="button"
      onClick={toggle}
      aria-pressed={isNight}
      aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      className={['lb-switch', className].join(' ')}
      style={{
        width: W,
        height: H,
        borderRadius: 999,
        position: 'relative',
        boxShadow: '0 3px 12px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        border: '1px solid rgba(0,0,0,.12)',
      }}
    >
      <span className="lb-switch-bg" style={{ borderRadius: 999 }} />

      <span className="lb-switch-decor" aria-hidden="true">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />

        <span className="stars">
          <i className="s s1" /><i className="s s2" /><i className="s s3" />
          <i className="s s4" /><i className="s s5" /><i className="s s6" />
          <i className="s s7" /><i className="s s8" /><i className="s s9" />
          <i className="s s10" /><i className="s s11" /><i className="s s12" />
        </span>

        {/* Virgo */}
        <svg viewBox="0 0 26 26"
             style={{ position:'absolute', inset:0, opacity: isNight ? .85 : 0, transition:'opacity .35s ease' }}
             aria-hidden="true">
          <g transform="translate(6,5)">
            <path d={virgo} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.5" strokeLinecap="round" />
            {[ [0,11],[4,6],[7,9],[11,4],[14,7] ].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="0.9" fill="#fff" />
            ))}
          </g>
        </svg>
      </span>

      <span
        className="lb-switch-knob"
        style={{
          width: KNOB_W,
          height: KNOB_H,
          top: '50%',
          left: KNOB_PAD,
          transform: 'translate(0,-50%)',
          borderRadius: 999,
          boxShadow: '0 5px 14px rgba(0,0,0,.16), inset 0 0 0 1px rgba(0,0,0,.08)',
          background: '#fff',
        }}
      >
        <svg className="icon sun" viewBox="0 0 24 24" aria-hidden="true"
             style={{ width: `${ICON_FRAC*100}%`, height: `${ICON_FRAC*100}%` }}>
          <defs>
            <radialGradient id="lbSunGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#FFF9C4"/>
              <stop offset="60%" stopColor="#FFE082"/>
              <stop offset="100%" stopColor="rgba(255,220,80,.0)"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="7.5" fill="url(#lbSunGlow)"/>
          <circle cx="12" cy="12" r="5.6" fill="#FFE082"/>
        </svg>

        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true"
             style={{ width: `${ICON_FRAC*100}%`, height: `${ICON_FRAC*100}%` }}>
          <defs>
            <radialGradient id="lbMoonTint" cx="45%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#D7E5FF"/>
              <stop offset="100%" stopColor="#8FA9FF"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="6.2" fill="url(#lbMoonTint)"/>
          <circle cx="9.5" cy="10" r="1.1" fill="#BBD0FF"/>
          <circle cx="13.5" cy="14.2" r="0.9" fill="#BBD0FF"/>
          <circle cx="15.6" cy="10.8" r="0.7" fill="#BBD0FF"/>
        </svg>
      </span>

      {/* knob target position when night; we keep it CSS-driven via globals:
          [data-theme="night"] .lb-switch .lb-switch-knob { transform: translate(calc(100% - PAD - 100%), -50%) } */}
      <style jsx>{`
        :global([data-theme="night"]) #${id} .lb-switch-knob{
          transform: translate(calc(${W - KNOB_PAD - KNOB_W}px - 100%), -50%);
          background:#0e0e16;
        }
      `}</style>
    </button>
  );
}
