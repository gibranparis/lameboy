// src/components/ThemeToggle.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

/** --- COOL SUN: sun dogs + 22° halo (inline) --- */
function SunHaloIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7cc" />
          <stop offset="55%" stopColor="#ffd75e" />
          <stop offset="100%" stopColor="#ffb200" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,200,80,0.9)" />
          <stop offset="100%" stopColor="rgba(255,200,80,0)" />
        </radialGradient>
        <linearGradient id="haloStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a0d8ff" />
          <stop offset="33%" stopColor="#a8ffbf" />
          <stop offset="66%" stopColor="#ffd080" />
          <stop offset="100%" stopColor="#a0d8ff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="20" fill="url(#sunGlow)" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="url(#haloStroke)" strokeWidth="2.2" opacity="0.9" />
      <circle cx="12" cy="32" r="3.2" fill="#ffe08a" />
      <circle cx="52" cy="32" r="3.2" fill="#ffe08a" />
      <circle cx="32" cy="32" r="12" fill="url(#sunCore)" />
    </svg>
  );
}

/** Minimal crescent moon that reads at tiny sizes */
function MoonIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id="moonShade" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd6e6" />
        </radialGradient>
      </defs>
      <path
        d="M42 52c-11.046 0-20-8.954-20-20 0-6.87 3.46-12.91 8.72-16.47C28.3 16.16 26 20.86 26 26c0 11.05 8.95 20 20 20 5.14 0 9.85-2.3 10.47-4.72C54.91 48.54 48.87 52 42 52z"
        fill="url(#moonShade)"
      />
    </svg>
  );
}

/**
 * ThemeToggle
 * - Controlled: pass `value` ('day'|'night') and `onChange`
 * - Uncontrolled: stores in localStorage('lb:theme')
 * - No blue ring / no default browser focus halo (clean header look)
 */
export default function ThemeToggle({
  className = '',
  value,              /** @type {Theme | undefined} */
  onChange,           /** @type {(t: Theme) => void | undefined} */
  circlePx = 28,
  trackPad = 1,
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // Uncontrolled boot from storage or system
  useEffect(() => {
    if (isControlled) return;
    let initial = 'day';
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'night' || stored === 'day') initial = stored;
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) initial = 'night';
    } catch {}
    setInternal(/** @type {Theme} */(initial));
    applyTheme(initial);
  }, [isControlled]);

  // Reflect → <html>, persist, broadcast
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(next /** @type {Theme} */) {
    if (isControlled) onChange?.(next);
    else setInternal(next);
  }

  function toggle() {
    setTheme(isNight ? 'day' : 'night');
  }

  function applyTheme(next /** @type {Theme} */) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = next;
    root.classList.toggle('dark', next === 'night');
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    try {
      const evt = new CustomEvent('theme-change', { detail: { theme: next } });
      document.dispatchEvent(evt);
      window.dispatchEvent?.(evt);
    } catch {}
  }

  // sizing that mirrors DayNightToggle API
  const dims = useMemo(() => {
    const knob  = Math.max(22, Math.round(circlePx));
    const padPx = Math.max(1, Math.min(8, Math.round(trackPad)));
    const h     = Math.max(knob + padPx * 2, 28);
    const w     = Math.round(h * (64 / 36));
    const inset = padPx;
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [circlePx, trackPad]);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={clsx('relative inline-flex select-none', className)}
      // ✅ No blue ring: no Tailwind `ring-*`, no outline; subtle neutral shadow only
      style={{
        position:'relative',
        display:'inline-flex',
        height:dims.h,
        width:dims.w,
        borderRadius:9999,
        overflow:'hidden',
        border: isNight ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(0,0,0,.10)',
        boxShadow: '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer',
        WebkitTapHighlightColor:'transparent',
        isolation:'isolate',
        outline:'none',
      }}
    >
      {/* Backdrops */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background:'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
          opacity: isNight ? 0 : 1,
          transition:'opacity 400ms ease',
        }}
      />
      {/* Night solid (keeps the switch dark without blue glow) */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background:'#0a0a12',
          opacity: isNight ? 1 : 0,
          transition:'opacity 400ms ease',
        }}
      />

      {/* Knob */}
      <span
        aria-hidden
        style={{
          position:'absolute',
          top:dims.inset, left:dims.inset,
          height:dims.knob, width:dims.knob, borderRadius:'50%',
          background: isNight ? '#0e0f12' : '#f6f7f4',
          display:'grid', placeItems:'center',
          transform:`translateX(${isNight ? dims.shift : 0}px)`,
          transition:'transform 300ms cubic-bezier(.22,.61,.21,.99)',
          boxShadow:'0 2px 8px rgba(0,0,0,.25)',
        }}
      >
        {/* Cross-fading icons (prevents white blip) */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 0 : 1, transition:'opacity 180ms ease',
          }}
        >
          <SunHaloIcon className="h-5 w-5" />
        </span>
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 1 : 0, transition:'opacity 180ms ease',
          }}
        >
          <MoonIcon className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
}
