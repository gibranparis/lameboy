// @ts-check
'use client';

import { useEffect, useMemo, useState } from 'react';

/** @typedef {'day'|'night'} Theme */

export default function DayNightToggle({
  className = '',
  value,                     /** @type {Theme | undefined} */
  onChange,                  /** @type {(t: Theme) => void | undefined} */
  circlePx = 36,             // <- exact diameter of the sun/moon knob (matches orb)
  trackPad = 8,              // <- vertical padding around the knob inside the pill
  moonImages = ['/toggle/moon-red.png','/toggle/moon-blue.png'],
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // pick a moon on mount + preload both
  const [moonSrc, setMoonSrc] = useState(moonImages[0]);
  useEffect(() => {
    // preload
    moonImages.forEach((src) => { const i = new Image(); i.src = src; });
    // random choose once
    setMoonSrc(moonImages[Math.floor(Math.random() * moonImages.length)] ?? moonImages[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // boot theme when uncontrolled
  useEffect(() => {
    if (!isControlled) {
      try {
        const saved = localStorage.getItem('theme');
        if (saved === 'night' || saved === 'day') setInternal(saved);
      } catch {}
    }
  }, [isControlled]);

  // reflect on <html> + localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem('theme', theme); } catch {}
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } })); } catch {}
  }, [theme, isNight]);

  function setTheme(next /** @type {Theme} */) {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
  }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  // geometry that guarantees a tight fit
  const dims = useMemo(() => {
    const knob = Math.max(18, Math.round(circlePx));
    const trackH = knob + Math.max(0, Math.round(trackPad));             // small cushion
    const trackW = Math.round(trackH * (64 / 36));                        // keep original ratio
    const inset  = Math.floor((trackH - knob) / 2);                       // centers the knob
    const shift  = trackW - knob - inset * 2;                             // travel distance
    return { knob, trackH, trackW, inset, shift };
  }, [circlePx, trackPad]);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        // Tight pill – NO layout-inflating borders here
        position: 'relative',
        display: 'inline-flex',
        height: dims.trackH,
        width:  dims.trackW,
        borderRadius: 9999,
        overflow: 'hidden',
        background: isNight ? '#0b0c12' : '#ffffff',
        boxShadow: '0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px rgba(0,0,0,.06)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate',
      }}
    >
      {/* simple backgrounds (subtle; won’t affect box size) */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background: isNight
            ? 'radial-gradient(120% 120% at 30% 30%, #161827 0%, #0b0b14 55%, #000 100%)'
            : 'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
          transition:'opacity 320ms ease',
        }}
      />

      {/* KNOB (exactly circlePx) */}
      <span
        aria-hidden
        style={{
          position:'absolute',
          top:  dims.inset,
          left: dims.inset,
          height:dims.knob,
          width: dims.knob,
          borderRadius:9999,
          background:isNight ? '#0f1118' : '#fff7cc',
          boxShadow:'0 6px 16px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)',
          display:'grid', placeItems:'center',
          transform:`translateX(${isNight ? dims.shift : 0}px)`,
          transition:'transform 300ms cubic-bezier(.22,.61,.21,.99), background 220ms ease',
          overflow:'hidden',
        }}
      >
        {/* Sun */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity:isNight ? 0 : 1, transition:'opacity 160ms ease',
            filter:'drop-shadow(0 0 14px rgba(255, 210, 80, .55))',
          }}
        >
          <span
            style={{
              width: Math.round(dims.knob * 0.70),
              height: Math.round(dims.knob * 0.70),
              borderRadius:'50%',
              background: 'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)',
            }}
          />
        </span>

        {/* Moon image */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity:isNight ? 1 : 0, transition:'opacity 160ms ease',
          }}
        >
          <img
            src={moonSrc}
            alt=""
            style={{
              width: Math.round(dims.knob * 0.78),
              height: Math.round(dims.knob * 0.78),
              borderRadius:'50%',
              objectFit:'cover',
              mixBlendMode:'screen',
              filter:'saturate(1.1) brightness(1.02)',
            }}
            draggable={false}
          />
        </span>
      </span>
    </button>
  );
}
