// @ts-check
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

export default function DayNightToggle({
  id,
  className = '',
  value,                         /** @type {Theme | undefined} */
  onChange,                      /** @type {(t: Theme) => void | undefined} */
  circlePx = 28,                 // knob diameter
  trackPad = 1,                  // slim glove
  moonImages = ['/toggle/moon-red.png','/toggle/moon-blue.png'],
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';

  /** @type {[Theme, (t: Theme)=>void]} */
  // @ts-ignore
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // uncontrolled boot from localStorage
  useEffect(() => {
    if (!isControlled) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored === 'night' || stored === 'day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
  }, [isControlled]);

  // reflect on <html> + persist + broadcast
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    try { window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } })); } catch {}
  }, [theme, isNight]);

  const setTheme = (next /** @type {Theme} */) => {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
  };
  const toggle = () => setTheme(isNight ? 'day' : 'night');

  // Sizing
  const dims = useMemo(() => {
    const knob  = Math.max(20, Math.round(circlePx));
    const padPx = Math.max(1, Math.min(6, Math.round(trackPad)));
    const h     = Math.max(knob + padPx * 2, 28);
    const w     = Math.round(h * (64 / 36));
    const inset = padPx;
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [circlePx, trackPad]);

  const moonSrc = moonImages?.[0] ?? '/toggle/moon-red.png';

  // ===== Night sky canvas (twinkling + “LAMEBOY” constellation) ======
  const skyRef = useRef/** @type {React.RefObject<HTMLCanvasElement>} */(null);
  useEffect(() => {
    if (!isNight) return;
    const canvas = skyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;

    const resizeCanvas = () => {
      DPR = Math.max(1, Math.round(window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width * DPR));
      H = Math.max(1, Math.floor(rect.height * DPR));
      canvas.width = W;
      canvas.height = H;
    };
    resizeCanvas();

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    const stars = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      a: Math.random() * Math.PI * 2,
      as: 0.004 + Math.random() * 0.006,
      r: 0.8 * DPR,
    }));

    /** “LAMEBOY” path normalized */
    /** @type {[number,number][]} */
    const C = [
      [0.08,0.28],[0.08,0.72],[0.16,0.72],[0.24,0.70],[0.28,0.30],[0.32,0.70],[0.38,0.70],
      [0.38,0.30],[0.45,0.50],[0.52,0.30],[0.52,0.70],[0.60,0.30],[0.60,0.72],[0.68,0.72],
      [0.77,0.50],[0.84,0.40],[0.90,0.40],[0.94,0.50],[0.90,0.60],[0.82,0.60],
    ];

    let raf=0;
    const LOOP = () => {
      const g = canvas.getContext('2d');
      if (!g) return;
      g.clearRect(0,0,W,H);

      // twinkle
      for (const s of stars) {
        s.a += s.as;
        const tw = 0.5 + 0.5*Math.sin(s.a);
        g.globalAlpha = 0.7*tw;
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI*2); g.fill();
      }
      g.globalAlpha = 1;

      // constellation
      g.lineWidth = 1 * DPR;
      g.strokeStyle = 'rgba(255,255,255,.55)';
      g.fillStyle = 'rgba(255,255,255,.95)';
      g.beginPath();
      for (let i=0;i<C.length;i++){
        const [nx,ny]=C[i]; const x=nx*W, y=ny*H;
        if(i===0) g.moveTo(x,y); else g.lineTo(x,y);
      }
      g.stroke();
      for (const [nx,ny] of C) {
        const x=nx*W, y=ny*H; g.beginPath(); g.arc(x,y,1.2*DPR,0,Math.PI*2); g.fill();
      }

      raf=requestAnimationFrame(LOOP);
    };
    raf=requestAnimationFrame(LOOP);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [isNight]);

  return (
    <button
      id={id}
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        position:'relative', display:'inline-flex',
        height:dims.h, width:dims.w, borderRadius:9999,
        overflow:'hidden',
        border: isNight ? '1px solid rgba(90,170,255,.45)' : '1px solid rgba(0,0,0,.10)',
        boxShadow: isNight
          ? '0 0 0 2px rgba(90,170,255,.55), 0 0 16px rgba(90,170,255,.45)'
          : '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer', WebkitTapHighlightColor:'transparent', isolation:'isolate', outline:'none',
      }}
    >
      {/* DAY BACKDROP */}
      <span aria-hidden style={{
        position:'absolute', inset:0, borderRadius:9999,
        background:'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
        opacity: isNight ? 0 : 1, transition:'opacity 400ms ease',
      }}/>

      {/* NIGHT SKY (canvas) */}
      {isNight && (
        <canvas ref={skyRef} aria-hidden style={{ position:'absolute', inset:0, borderRadius:9999, pointerEvents:'none' }}/>
      )}

      {/* KNOB */}
      <span aria-hidden style={{
        position:'absolute', top:dims.inset, left:dims.inset,
        height:dims.knob, width:dims.knob, borderRadius:'50%',
        background:'transparent', boxShadow:'0 6px 16px rgba(0,0,0,.18)',
        display:'grid', placeItems:'center',
        transform:`translateX(${isNight ? dims.shift : 0}px)`,
        transition:'transform 320ms cubic-bezier(.22,.61,.21,.99)',
        overflow:'hidden',
      }}>
        {/* Sun */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity: isNight ? 0 : 1, transition:'opacity 180ms ease',
          filter:'drop-shadow(0 0 18px rgba(255,210,80,.65))',
        }}>
          <span style={{
            width: dims.knob, height: dims.knob, borderRadius:'50%',
            background:'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)',
            display:'block',
          }}/>
        </span>

        {/* Moon */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity: isNight ? 1 : 0, transition:'opacity 180ms ease',
        }}>
          <img
            src={moonSrc}
            alt=""
            style={{ width: dims.knob, height: dims.knob, borderRadius:'50%', display:'block', objectFit:'cover', mixBlendMode:'screen', filter:'saturate(1.15) brightness(1.02)' }}
            draggable={false}
          />
        </span>
      </span>
    </button>
  );
}
