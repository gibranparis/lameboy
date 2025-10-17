// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

export default function DayNightToggle({
  id,
  className = '',
  value,                         /** @type {Theme | undefined} */
  onChange,                      /** @type {(t: Theme) => void | undefined} */
  circlePx = 44,                 // knob diameter (match orb/cart square)
  trackPad = 8,                  // trims track height / “glove” tightness
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

  function setTheme(next /** @type {Theme} */) {
    if (isControlled && onChange) onChange(next);
    else setInternal(next);
  }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  // ----- Sizing (keep proportions tight to the knob) ----------------------
  // Moon/sun stays exactly circlePx. Track hugs the knob based on trackPad.
  const dims = useMemo(() => {
    const knob = Math.max(20, Math.round(circlePx));    // fixed moon size
    const gapPx = Math.max(2, Math.min(6, trackPad));   // 2..6px feels best
    const h = Math.max(28, knob + gapPx * 2);           // pill hugs knob
    const w = Math.round(h * (64 / 36));                // classic 64:36 pill
    const inset = Math.round((h - knob) / 2);           // centers knob
    const shift = Math.round(w - knob - inset * 2);     // knob travel
    return { h, w, knob, inset, shift };
  }, [circlePx, trackPad]);

  const moonSrc = moonImages?.[0] ?? '/toggle/moon-night.png';

  // ===== Night sky canvas (stars, LAMEBOY constellation, shooting star) ===
  const skyRef = useRef/** @type {React.RefObject<HTMLCanvasElement>} */(null);

  useEffect(() => {
    if (!isNight) return; // only animate at night
    const canvas = skyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
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

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas);

    const STAR_COUNT = 28;
    /** @type {{x:number,y:number,a:number,as:number,r:number}[]} */
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      a: 0.5 + Math.random() * 0.5,
      as: (0.5 + Math.random()) * 0.006,
      r: 0.8 * DPR
    }));

    /** @type {[number,number][]} */
    const C = [
      [0.10,0.25],[0.10,0.70],[0.18,0.70],
      [0.27,0.72],[0.30,0.25],[0.33,0.72],[0.29,0.52],[0.31,0.52],
      [0.40,0.72],[0.40,0.28],[0.44,0.55],[0.48,0.28],[0.48,0.72],
      [0.56,0.25],[0.56,0.70],[0.62,0.70],[0.56,0.48],[0.60,0.48],[0.62,0.25],
      [0.70,0.25],[0.70,0.70],[0.76,0.62],[0.70,0.52],[0.76,0.42],[0.70,0.35],
      [0.84,0.48],[0.86,0.42],[0.90,0.42],[0.92,0.48],[0.90,0.56],[0.86,0.56],
      [0.96,0.25],[0.94,0.40],[0.98,0.40],[0.96,0.70],
    ];

    let meteor = { t: -1, x0:0, y0:0, x1:0, y1:0, dur: 1200, born: 0 };
    const spawnMeteor = () => {
      const now = performance.now();
      meteor.born = now;
      meteor.dur = 900 + Math.random()*700;
      meteor.x0 = Math.random() < 0.5 ? -0.1 * W : 1.1 * W;
      meteor.y0 = Math.random() * (0.25 * H) + 0.15 * H;
      meteor.x1 = meteor.x0 < 0 ? 1.2 * W : -0.2 * W;
      meteor.y1 = meteor.y0 + (Math.random()*0.2 - 0.1) * H;
      meteor.t = 0;
    };
    let lastSpawn = performance.now();

    const LOOP = () => {
      ctx.clearRect(0,0,W,H);

      for (const s of stars) {
        s.a += s.as;
        const tw = 0.5 + 0.5*Math.sin(s.a);
        ctx.globalAlpha = 0.7*tw;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1 * DPR;
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.beginPath();
      for (let i=0;i<C.length;i++){
        const [nx,ny]=C[i];
        const x=nx*W, y=ny*H;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.stroke();
      for (const [nx,ny] of C) {
        const x=nx*W, y=ny*H;
        ctx.beginPath();
        ctx.arc(x,y,1.2*DPR,0,Math.PI*2);
        ctx.fill();
      }

      const now = performance.now();
      if (meteor.t < 0 && now - lastSpawn > 2400 + Math.random()*2600) {
        lastSpawn = now;
        spawnMeteor();
      }
      if (meteor.t >= 0) {
        const p = Math.min(1, (now - meteor.born)/meteor.dur);
        const x = meteor.x0 + (meteor.x1 - meteor.x0)*p;
        const y = meteor.y0 + (meteor.y1 - meteor.y0)*p;
        const trail = 80 * DPR;
        const ang = Math.atan2(meteor.y1-meteor.y0, meteor.x1-meteor.x0);
        const tx = x - Math.cos(ang)*trail;
        const ty = y - Math.sin(ang)*trail;

        const grad = ctx.createLinearGradient(tx,ty,x,y);
        grad.addColorStop(0,'rgba(255,255,255,0)');
        grad.addColorStop(1,'rgba(255,255,255,.9)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2*DPR;
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x,y,1.4*DPR,0,Math.PI*2); ctx.fill();

        if (p >= 1) meteor.t = -1;
      }

      raf = requestAnimationFrame(LOOP);
    };

    raf = requestAnimationFrame(LOOP);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
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
        position:'relative',
        display:'inline-flex',
        height:dims.h,
        width:dims.w,
        borderRadius:9999,
        overflow:'hidden',
        border: isNight ? '1px solid rgba(90,170,255,.45)' : '1px solid rgba(0,0,0,.10)',
        boxShadow: isNight
          ? '0 0 0 2px rgba(90,170,255,.55), 0 0 16px rgba(90,170,255,.45), inset 0 0 0 1px rgba(255,255,255,.5)'
          : '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer',
        WebkitTapHighlightColor:'transparent',
        isolation:'isolate',
        outline:'none',
      }}
    >
      {/* DAY BACKDROP */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          background:'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
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
                animation:`cloudMove 14s ${c.d}ms ease-in-out infinite alternate`,
              }}
            >
              <span style={{ position:'absolute', left:'-24%', top:'10%', width:'42%', height:'58%', background:'#fff', borderRadius:9999 }} />
              <span style={{ position:'absolute', right:'-18%', top:'22%', width:'36%', height:'46%', background:'#fff', borderRadius:9999 }} />
            </span>
          ))}
        </span>
      )}

      {/* NIGHT SKY (canvas) */}
      {isNight && (
        <canvas
          ref={skyRef}
          aria-hidden
          style={{ position:'absolute', inset:0, borderRadius:9999, pointerEvents:'none' }}
        />
      )}

      {/* KNOB (sun/moon) */}
      <span
        aria-hidden
        style={{
          position:'absolute',
          top:dims.inset,
          left:dims.inset,
          height:dims.knob,
          width:dims.knob,
          borderRadius:9999,
          background: isNight ? '#0e0f16' : '#fff7cc',
          boxShadow:'0 6px 16px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)',
          display:'grid',
          placeItems:'center',
          transform:`translateX(${isNight ? dims.shift : 0}px)`,
          transition:'transform 320ms cubic-bezier(.22,.61,.21,.99), background 220ms ease',
          overflow:'hidden',
        }}
      >
        {/* Sun */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 0 : 1, transition:'opacity 180ms ease',
            filter:'drop-shadow(0 0 18px rgba(255,210,80,.65))',
          }}
        >
          <span
            style={{
              width: Math.round(dims.knob * 0.74),
              height: Math.round(dims.knob * 0.74),
              borderRadius:'50%',
              background:'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)',
            }}
          />
        </span>

        {/* Moon */}
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
              mixBlendMode:'screen',
              filter:'saturate(1.15) brightness(1.02)',
            }}
            draggable={false}
          />
        </span>
      </span>

      <style jsx>{`
        @keyframes cloudMove { from { transform: translateX(-4%); } to { transform: translateX(6%); } }
      `}</style>
    </button>
  );
}
