// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useId, useMemo, useState } from 'react';

/** @typedef {'day'|'night'} Theme */

function SunIconFull({ className = '' }) {
  const uid = useId();
  const coreId = `sun-core-${uid}`;
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff6c9"/>
          <stop offset="55%"  stopColor="#ffd462"/>
          <stop offset="100%" stopColor="#ffb300"/>
        </radialGradient>
      </defs>
      {/* fill almost the entire knob circle */}
      <circle cx="32" cy="32" r="28" fill={`url(#${coreId})`} />
    </svg>
  );
}

function MoonIcon({ className = '' }) {
  const uid = useId();
  const moonId = `moonShade-${uid}`;
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id={moonId} cx="35%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd6e6" />
        </radialGradient>
      </defs>
      <path
        d="M42 52c-11.046 0-20-8.954-20-20 0-6.87 3.46-12.91 8.72-16.47C28.3 16.16 26 20.86 26 26c0 11.05 8.95 20 20 20 5.14 0 9.85-2.3 10.47-4.72C54.91 48.54 48.87 52 42 52z"
        fill={`url(#${moonId})`}
      />
    </svg>
  );
}

const THEME_KEY = 'theme';

export default function DayNightToggle({
  className = '',
  value,                  /** @type {Theme | undefined} */
  onChange,               /** @type {(t: Theme) => void | undefined} */
  size = 34,
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';
  /** @type {[Theme, (t: Theme)=>void]} */
  // @ts-ignore
  const [internal, setInternal] = useState/** @type {Theme} */('day');

  /** @type {Theme} */
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  useEffect(() => {
    if (!isControlled) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored === 'night' || stored === 'day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', isNight);
    root.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme, isNight]);

  function setTheme(next /** @type {Theme} */) {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: next } })); } catch {}
  }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  const dims = useMemo(() => {
    const h = Math.max(24, size);
    const w = Math.round(h * (64 / 36));
    const knob = Math.round(h * (28 / 36));
    const inset = Math.round(h * (4 / 36));
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [size]);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: dims.h,
        width: dims.w,
        borderRadius: 9999,
        background: isNight ? '#1e1e1e' : '#fff',
        boxShadow:
          '0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.03), inset 0 0 0 1px rgba(0,0,0,.06)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: isNight
            ? 'linear-gradient(to bottom, rgba(255,255,255,.08), rgba(0,0,0,.4))'
            : 'linear-gradient(to bottom, rgba(255,255,255,.6), rgba(0,0,0,.05))',
          pointerEvents: 'none',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: dims.inset,
          left: dims.inset,
          height: dims.knob,
          width: dims.knob,
          borderRadius: 9999,
          background: isNight ? '#0e0f12' : '#f6f7f4',
          boxShadow: '0 2px 6px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.06)',
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 300ms ease-out, background 200ms ease',
          transform: `translateX(${isNight ? dims.shift : 0}px)`,
          overflow: 'hidden',
        }}
      >
        {/* icons sized to FILL the knob */}
        <span
          style={{
            position: 'absolute',
            inset: '6%',           // small breathing room
            opacity: isNight ? 0 : 1,
            transition: 'opacity 200ms ease',
          }}
        >
          <SunIconFull className="w-full h-full" />
        </span>
        <span
          style={{
            position: 'absolute',
            inset: '10%',
            opacity: isNight ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
        >
          <MoonIcon className="w-full h-full" />
        </span>
      </span>
    </button>
  );
}
