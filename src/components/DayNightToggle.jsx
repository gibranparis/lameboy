// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useId, useMemo, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

export default function DayNightToggle({
  id,
  className = '',
  value,                         /** @type {Theme | undefined} */
  onChange,                      /** @type {(t: Theme) => void | undefined} */

  /** Visual sizing
   *  circlePx = knob (sun/moon) diameter; match your orb/cart square.
   *  trackPad = trims the pill height so it never reads taller than the knob.
   */
  circlePx = 44,
  trackPad = 8,

  /** Optional moon images (first will be used if available) */
  moonImages = ['/moon-night.png'],
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';

  /** @type {[Theme, (t: Theme)=>void]} */
  // @ts-ignore
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // boot: read localStorage when uncontrolled
  useEffect(() => {
    if (!isControlled) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored === 'night' || stored === 'day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled]);

  // reflect on <html> + localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    // notify listeners
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } })); } catch {}
  }, [theme, isNight]);

  function setTheme(next /** @type {Theme} */) {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
  }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  // ----- Sizing (keep proportions tight to the knob) ----------------------
  const dims = useMemo(() => {
    const h = Math.max(28, circlePx - trackPad);
    const w = Math.round(h * (64 / 36)); // original 64×36 track ratio
    const knob = Math.min(h - 8, circlePx);
    const inset = Math.round((h - knob) / 2);
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [circlePx, trackPad]);

  // pick the first existing moon image
  const moonSrc = moonImages?.[0] ?? '/moon-night.png';

  // Star coordinates (percentage) roughly forming "LAMEBOY" across the pill
  // small canvas = suggestive layout, not literal text; spaced for readability
  const STARS = [
    // L
    {l:10,t:22},{l:10,t:34},{l:10,t:46},{l:14,t:46},
    // A
    {l:22,t:46},{l:24,t:36},{l:26,t:46},{l:23,t:41},
    // M
    {l:32,t:46},{l:34,t:34},{l:36,t:46},{l:38,t:34},{l:40,t:46},
    // E
    {l:46,t:22},{l:46,t:34},{l:46,t:46},{l:50,t:22},{l:50,t:34},{l:50,t:46},
    // B
    {l:58,t:22},{l:58,t:34},{l:58,t:46},{l:62,t:28},{l:62,t:40},
    // O
    {l:70,t:28},{l:74,t:34},{l:70,t:40},{l:66,t:34},
    // Y
    {l:80,t:28},{l:82,t:32},{l:84,t:28},{l:82,t:40}
  ];

  return (
    <button
      id={id}
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={`lb-switch ${className}`}  // <- applies the always-on blue/white outline from globals.css
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: dims.h,
        width: dims.w,
        borderRadius: 9999,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,.12)',
        background: isNight ? '#0a0a12' : '#ffffff',
        boxShadow: '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.5)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate',
      }}
    >
      {/* DAY BACKDROP (soft gradient) */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background: isNight ? 'transparent' : `linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)`,
          opacity: isNight ? 0 : 1,
          transition:'opacity 400ms ease',
        }}
      />

      {/* DAY CLOUDS */}
      {!isNight && (
        <span aria-hidden style={{ position:'absolute', inset:0, borderRadius:9999, overflow:'hidden' }}>
          {[
            { left:'12%', top:'18%', w:'34%', h:'40%', d:0   },
            { left:'54%', top:'48%', w:'28%', h:'30%', d:120 },
            { left:'36%', top:'10%', w:'20%', h:'24%', d:240 },
          ].map((c, i) => (
            <span
              key={i}
              style={{
                position:'absolute',
                left:c.left, top:c.top, width:c.w, height:c.h, borderRadius:9999,
                background:'#fff',
                filter:'drop-shadow(0 4px 8px rgba(0,0,0,.10))',
                opacity:.96,
                transform:`translateX(0)`,
                animation:`cloudMove 14s ${c.d}ms ease-in-out infinite alternate`,
              }}
            >
              <span style={{ position:'absolute', left:'-24%', top:'10%', width:'42%', height:'58%', background:'#fff', borderRadius:9999 }} />
              <span style={{ position:'absolute', right:'-18%', top:'22%', width:'36%', height:'46%', background:'#fff', borderRadius:9999 }} />
            </span>
          ))}
        </span>
      )}

      {/* NIGHT STARS + shooting star */}
      {isNight && (
        <span aria-hidden style={{ position:'absolute', inset:0, opacity:1, transition:'opacity 400ms ease' }}>
          {STARS.map((s, i) => (
            <span
              key={i}
              style={{
                position:'absolute',
                left:`${s.l}%`,
                top:`${s.t}%`,
                width:2, height:2, borderRadius:2, background:'#fff',
                boxShadow:'0 0 8px rgba(255,255,255,.9)',
                animation:`twinkle ${1.6 + (i%5)*0.25}s ease-in-out ${(i%7)*0.18}s infinite`,
              }}
            />
          ))}
          {/* shooting star */}
          <span
            style={{
              position:'absolute',
              left:'-10%', top:'35%',
              width:'26%', height:2,
              background:'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.9), rgba(255,255,255,0))',
              boxShadow:'0 0 6px rgba(255,255,255,.75)',
              borderRadius:2,
              transform:'translateX(-40%)',
              animation:'shootAcross 7s ease-in-out 1s infinite',
              opacity:.0
            }}
          />
        </span>
      )}

      {/* KNOB (sun/moon) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: dims.inset,
          left: dims.inset,
          height: dims.knob,
          width: dims.knob,
          borderRadius: 9999,
          background: isNight ? '#0e0f16' : '#fff7cc',
          boxShadow: '0 6px 16px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)',
          display: 'grid',
          placeItems: 'center',
          transform: `translateX(${isNight ? dims.shift : 0}px)`,
          transition: 'transform 320ms cubic-bezier(.22,.61,.21,.99), background 220ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Sun */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 0 : 1, transition:'opacity 180ms ease',
            filter:'drop-shadow(0 0 18px rgba(255, 210, 80, .65))',
          }}
        >
          <span
            style={{
              width: Math.round(dims.knob * 0.74),
              height: Math.round(dims.knob * 0.74),
              borderRadius:'50%',
              background: 'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)',
            }}
          />
        </span>

        {/* Moon image */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 1 : 0, transition:'opacity 180ms ease',
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
              mixBlendMode: 'screen',
              filter: 'saturate(1.15) brightness(1.02)',
            }}
            draggable={false}
          />
        </span>
      </span>

      {/* Inline keyframes (scoped) */}
      <style jsx>{`
        @keyframes twinkle { 0%,100% { transform: scale(.7); opacity:.7; } 50% { transform: scale(1.1); opacity:1; } }
        @keyframes cloudMove { from { transform: translateX(-4%); } to { transform: translateX(6%); } }
        @keyframes shootAcross {
          0%   { transform: translateX(-40%); opacity: 0; }
          10%  { opacity: .95; }
          45%  { transform: translateX(160%); opacity: .85; }
          70%  { opacity: 0; }
          100% { transform: translateX(200%); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
