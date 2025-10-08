// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */

const THEME_KEY = 'theme';

export default function DayNightToggle({
  className = '',
  value,                  /** @type {Theme | undefined} */
  onChange,               /** @type {(t: Theme) => void | undefined} */
  size = 34,
  moonSrc,                /** @type {string | undefined} custom moon image (square works best) */
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';
  /** @type {[Theme, (t: Theme)=>void]} */
  // @ts-ignore
  const [internal, setInternal] = useState/** @type {Theme} */('day');

  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // Uncontrolled boot
  useEffect(() => {
    if (!isControlled) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored === 'night' || stored === 'day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled]);

  // Always mirror onto <html>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme, isNight]);

  function setTheme(next /** @type {Theme} */) {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: next } })); } catch {}
  }
  const toggle = () => setTheme(isNight ? 'day' : 'night');

  // geometry from height
  const dims = useMemo(() => {
    const h = Math.max(30, size);
    const w = Math.round(h * (64 / 36));
    const knob = Math.round(h * (28 / 36));
    const inset = Math.round(h * (4 / 36));
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [size]);

  // refs for simple keyframe offset (for cloud parallax)
  const cloudWrapRef = useRef(null);

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
        background: isNight ? '#0d0f17' : '#cce8ff',
        boxShadow:
          '0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.03), inset 0 0 0 1px rgba(0,0,0,.08)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* BACKDROP: sky / stars */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: isNight
            ? 'radial-gradient(120% 120% at 30% 30%, #151a2a 0%, #0b0d16 55%, #06070c 100%)'
            : 'linear-gradient(180deg, #bfe2ff 0%, #e9f6ff 55%, #ffffff 100%)',
          transition: 'filter .35s ease, opacity .35s ease, background .35s ease',
        }}
      />

      {/* DECOR: Day clouds */}
      <span
        aria-hidden
        ref={cloudWrapRef}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          opacity: isNight ? 0 : 1,
          transition: 'opacity .35s ease',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <span className="dn-cloud c1" />
        <span className="dn-cloud c2" />
        <span className="dn-cloud c3" />
      </span>

      {/* DECOR: Night stars + a tiny constellation */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          opacity: isNight ? 1 : 0,
          transition: 'opacity .35s ease',
          pointerEvents: 'none',
        }}
      >
        {/* stars */}
        <span className="dn-stars">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className={`s s${(i % 12) + 1}`} />
          ))}
        </span>
        {/* constellation (simple “V” + line) */}
        <svg viewBox="0 0 100 56" preserveAspectRatio="none" style={{ position:'absolute', inset:0 }}>
          <g stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" fill="none" strokeLinecap="round">
            <path d="M18 34 L30 22 L42 34" />
            <path d="M42 34 L58 18 L76 28" />
          </g>
          <g fill="#fff">
            {[{x:18,y:34},{x:30,y:22},{x:42,y:34},{x:58,y:18},{x:76,y:28}].map((p,i)=>(
              <circle key={i} cx={p.x} cy={p.y} r="1.3" />
            ))}
          </g>
        </svg>
      </span>

      {/* KNOB */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: dims.inset,
          left: dims.inset,
          height: dims.knob,
          width: dims.knob,
          borderRadius: 9999,
          background: isNight ? '#0f1118' : '#fbfdff',
          boxShadow: '0 2px 6px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)',
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 300ms cubic-bezier(.22,.61,.21,.99), background 250ms',
          transform: `translateX(${isNight ? dims.shift : 0}px)`,
          overflow: 'hidden',
        }}
      >
        {/* Sun fills the knob */}
        <span
          style={{
            position: 'absolute',
            inset: '6%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, #fff6c9 0%, #ffd765 55%, #ffb300 100%)',
            boxShadow: '0 0 16px rgba(255,203,77,.55)',
            opacity: isNight ? 0 : 1,
            transition: 'opacity 200ms ease',
          }}
        />
        {/* Moon: use your image if provided */}
        <span
          style={{
            position: 'absolute',
            inset: '10%',
            borderRadius: '50%',
            opacity: isNight ? 1 : 0,
            transition: 'opacity 200ms ease',
            overflow: 'hidden',
            background: moonSrc ? `url(${moonSrc}) center/cover no-repeat` : 'none',
          }}
        >
          {!moonSrc && (
            <svg viewBox="0 0 64 64" aria-hidden="true" role="img" style={{ width:'100%', height:'100%' }}>
              <defs>
                <radialGradient id="m" cx="35%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#fff"/>
                  <stop offset="100%" stopColor="#cfd6e6"/>
                </radialGradient>
              </defs>
              <path d="M42 52c-11.046 0-20-8.954-20-20 0-6.87 3.46-12.91 8.72-16.47C28.3 16.16 26 20.86 26 26c0 11.05 8.95 20 20 20 5.14 0 9.85-2.3 10.47-4.72C54.91 48.54 48.87 52 42 52z" fill="url(#m)"/>
            </svg>
          )}
        </span>
      </span>

      {/* Local styles for clouds & stars */}
      <style jsx>{`
        .dn-cloud{
          position:absolute; background:#fff; filter:drop-shadow(0 3px 6px rgba(0,0,0,.10));
          border-radius:999px; opacity:.95;
          animation:cloud-drift 22s linear infinite;
        }
        .dn-cloud::before,.dn-cloud::after{ content:""; position:absolute; background:#fff; border-radius:999px; }
        .c1{ left:6%; top:28%; width:36%; height:46%; animation-delay:-4s; }
        .c1::before{ left:-22%; top:14%; width:45%; height:55%; }
        .c1::after { right:-18%; top:30%; width:38%; height:48%; }
        .c2{ left:54%; top:56%; width:28%; height:34%; opacity:.9; animation-delay:-11s; }
        .c2::before{ left:-24%; top:8%; width:40%; height:58%; }
        .c2::after { right:-18%; top:20%; width:34%; height:44%; }
        .c3{ left:34%; top:12%; width:22%; height:26%; opacity:.92; animation-delay:-17s; }
        .c3::before{ left:-28%; top:10%; width:32%; height:44%; }
        .c3::after { right:-20%; top:26%; width:28%; height:38%; }
        @keyframes cloud-drift { 0%{ transform:translateX(-8%);} 100%{ transform:translateX(8%);} }

        .dn-stars{ position:absolute; inset:0; }
        .dn-stars .s{
          position:absolute; width:2px; height:2px; background:#fff; border-radius:2px;
          box-shadow:0 0 8px rgba(255,255,255,.85);
          animation:twinkle 1.9s ease-in-out infinite;
        }
        @keyframes twinkle{ 0%,100%{ transform:scale(.7); opacity:.75; } 50%{ transform:scale(1.18); opacity:1; } }
        .s1{ left:12%; top:22%; animation-delay:.0s }
        .s2{ left:22%; top:64%; animation-delay:.25s }
        .s3{ left:36%; top:36%; animation-delay:.40s }
        .s4{ left:58%; top:18%; animation-delay:.65s }
        .s5{ left:72%; top:54%; animation-delay:.90s }
        .s6{ left:84%; top:30%; animation-delay:1.1s }
        .s7{ left:16%; top:58%; animation-delay:1.35s }
        .s8{ left:44%; top:72%; animation-delay:1.50s }
        .s9{ left:52%; top:12%; animation-delay:1.70s }
        .s10{ left:66%; top:40%; animation-delay:1.85s }
        .s11{ left:78%; top:68%; animation-delay:2.0s }
        .s12{ left:28%; top:34%; animation-delay:2.15s }
      `}</style>
    </button>
  );
}
