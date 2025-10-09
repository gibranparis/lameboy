// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'theme';

export default function DayNightToggle({
  className = '',
  value,                    /** @type {Theme | undefined} */
  onChange,                 /** @type {(t: Theme) => void | undefined} */
  track = 36,               // total track height in px (36 => knob ~28)
  // your files in /public/toggle
  moonChoices = ['/toggle/moon-blue.png', '/toggle/moon-red.png'],
}) {
  const controlled = value !== undefined && typeof onChange === 'function';

  /** @type {[Theme,(t:Theme)=>void]} */
  // @ts-ignore
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (controlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // Preload both moons and pick one once
  const [moonSrc, setMoonSrc] = useState(moonChoices[0]);
  const picked = useRef(false);
  useEffect(() => {
    moonChoices.forEach(src => { const i = new Image(); i.src = src; i.decoding = 'async'; });
    if (!picked.current) {
      picked.current = true;
      const one = moonChoices[Math.floor(Math.random() * moonChoices.length)] ?? moonChoices[0];
      setMoonSrc(one);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // boot default theme
  useEffect(() => {
    if (!controlled) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored === 'night' || stored === 'day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
  }, [controlled]);

  // reflect to <html>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } })); } catch {}
  }, [theme, isNight]);

  function setTheme(next /** @type {Theme} */) {
    if (controlled && onChange) onChange(next);
    else setInternal(next);
  }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  // geometry
  const dims = useMemo(() => {
    const h = Math.max(30, Math.round(track));
    const w = Math.round(h * (64 / 36));
    const knob = Math.round(h * (28 / 36));
    const inset = Math.round(h * (4 / 36));
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [track]);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        contain: 'layout size paint',
        position: 'relative',
        display: 'inline-flex',
        flex: 'none',
        height: `${dims.h}px`,
        width: `${dims.w}px`,
        borderRadius: 9999,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,.12)',
        background: isNight ? '#0a0a12' : '#ffffff',
        boxShadow: '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.5)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate',
        lineHeight: 0,
      }}
    >
      {/* Day bg */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background: isNight ? 'transparent' : 'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
          opacity: isNight ? 0 : 1,
          transition:'opacity 280ms ease',
        }}
      />

      {/* Night stars */}
      {isNight && (
        <span aria-hidden style={{ position:'absolute', inset:0 }}>
          {[...Array(12)].map((_, i) => {
            const left = [10,18,26,34,44,56,66,76,22,38,52,70][i];
            const top  = [20,12,30,18,40,24,32,14,54,64,42,28][i];
            const delay = (i % 5) * 0.22;
            return (
              <span key={i} style={{
                position:'absolute', left:`${left}%`, top:`${top}%`,
                width:2, height:2, borderRadius:2, background:'#fff',
                boxShadow:'0 0 8px rgba(255,255,255,.9)',
                animation:`twinkle ${1.8 + (i%4)*0.2}s ease-in-out ${delay}s infinite`,
              }}/>
            );
          })}
        </span>
      )}

      {/* Day clouds */}
      {!isNight && (
        <span aria-hidden style={{ position:'absolute', inset:0, borderRadius:9999, overflow:'hidden' }}>
          {[
            { left:'12%', top:'18%', w:'34%', h:'40%', d:0   },
            { left:'54%', top:'48%', w:'28%', h:'30%', d:120 },
            { left:'36%', top:'10%', w:'20%', h:'24%', d:240 },
          ].map((c, i) => (
            <span key={i} style={{
              position:'absolute', left:c.left, top:c.top, width:c.w, height:c.h, borderRadius:9999,
              background:'#fff', filter:'drop-shadow(0 4px 8px rgba(0,0,0,.10))', opacity:.96,
              animation:`cloudMove 14s ${c.d}ms ease-in-out infinite alternate`,
            }}>
              <span style={{ position:'absolute', left:'-24%', top:'10%', width:'42%', height:'58%', background:'#fff', borderRadius:9999 }} />
              <span style={{ position:'absolute', right:'-18%', top:'22%', width:'36%', height:'46%', background:'#fff', borderRadius:9999 }} />
            </span>
          ))}
        </span>
      )}

      {/* Knob */}
      <span
        aria-hidden
        style={{
          position:'absolute',
          top: `${dims.inset}px`,
          left: `${dims.inset}px`,
          height: `${dims.knob}px`,
          width: `${dims.knob}px`,
          borderRadius: 9999,
          background: isNight ? '#0e0f16' : '#fff7cc',
          boxShadow: '0 6px 16px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)',
          display:'grid', placeItems:'center',
          transform: `translateX(${isNight ? dims.shift : 0}px)`,
          transition: 'transform 260ms cubic-bezier(.22,.61,.21,.99), background 160ms ease',
          overflow:'hidden', backfaceVisibility:'hidden',
        }}
      >
        {/* Sun */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity: isNight ? 0 : 1, transition:'opacity 140ms ease',
          filter:'drop-shadow(0 0 14px rgba(255,210,80,.55))',
        }}>
          <span style={{
            width: Math.round(dims.knob * 0.74), height: Math.round(dims.knob * 0.74),
            borderRadius:'50%',
            background:'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)',
          }}/>
        </span>

        {/* Moon */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity: isNight ? 1 : 0, transition:'opacity 140ms ease',
        }}>
          <img
            src={moonSrc}
            alt=""
            width={Math.round(dims.knob * 0.78)}
            height={Math.round(dims.knob * 0.78)}
            decoding="async"
            style={{
              width:'100%', height:'100%', maxWidth: Math.round(dims.knob * 0.78), maxHeight: Math.round(dims.knob * 0.78),
              borderRadius:'50%', objectFit:'cover', display:'block',
              mixBlendMode:'screen', filter:'saturate(1.06) brightness(1.02)',
            }}
            draggable={false}
          />
        </span>
      </span>

      <style jsx>{`
        @keyframes twinkle { 0%,100% { transform: scale(.7); opacity:.7; } 50% { transform: scale(1.08); opacity:1; } }
        @keyframes cloudMove { from { transform: translateX(-4%); } to { transform: translateX(6%); } }
      `}</style>
    </button>
  );
}
