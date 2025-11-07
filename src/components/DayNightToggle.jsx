// Clouds (day), starry sky + LAMEBOY constellation (night)
// Ridged sun with gradient + glow
'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

/* ---------- Ridged Sun SVG ---------- */
function SunIcon({ size = 28 }) {
  const id = useId();
  const spokes = 16;
  const rOuter = size * 0.52;
  const rInner = size * 0.40;
  const cx = size / 2;
  const cy = size / 2;

  const pts = [];
  for (let i = 0; i < spokes * 2; i++) {
    const a = (i * Math.PI) / spokes;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  const points = pts.join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ display:'block' }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="45%" cy="45%" r="65%">
          <stop offset="0%"  stopColor="#fff6c6"/>
          <stop offset="55%" stopColor="#ffd75e"/>
          <stop offset="100%" stopColor="#ffb200"/>
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon points={points} fill={`url(#${id}-g)`} filter={`url(#${id}-glow)`} />
      <circle cx={cx} cy={cy} r={size * 0.36} fill={`url(#${id}-g)`} style={{ filter:'drop-shadow(0 0 10px rgba(255,210,80,.55))' }}/>
    </svg>
  );
}

/* ---------- Tiny cloud layer (day) ---------- */
function Clouds() {
  return (
    <>
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999, overflow:'hidden', pointerEvents:'none',
          background:
            'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
        }}
      />
      {/* front cloud wisp */}
      <span
        aria-hidden
        style={{
          position:'absolute', top:'22%', left:'-25%', width:'60%', height:'40%',
          background:'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,.85), rgba(255,255,255,0))',
          filter:'blur(4px)', opacity:.8, borderRadius:9999,
          transform:'translateX(-4%)',
          animation:'cloudMove 12s ease-in-out infinite alternate',
          pointerEvents:'none',
        }}
      />
      {/* back cloud wisp */}
      <span
        aria-hidden
        style={{
          position:'absolute', bottom:'18%', right:'-20%', width:'55%', height:'36%',
          background:'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,.75), rgba(255,255,255,0))',
          filter:'blur(5px)', opacity:.7, borderRadius:9999,
          transform:'translateX(6%)',
          animation:'cloudMove 14s ease-in-out infinite alternate-reverse',
          pointerEvents:'none',
        }}
      />
    </>
  );
}

export default function DayNightToggle({
  id,
  className = '',
  value,                         /** @type {Theme | undefined} */
  onChange,                      /** @type {(t: Theme) => void | undefined} */
  circlePx = 28,
  trackPad = 1,
  moonImages = ['/toggle/moon-red.png','/toggle/moon-blue.png'],
  onThemeChange,                 /** @type {(t: Theme) => void | undefined} */
}) {
  const isControlled = value !== undefined && typeof onChange === 'function';

  /** @type {[Theme, (t: Theme)=>void]} */
  const [internal, setInternal] = useState/** @type {Theme} */('day');
  const theme = (isControlled ? value : internal) ?? 'day';
  const isNight = theme === 'night';

  // uncontrolled boot from localStorage / system
  useEffect(() => {
    if (!isControlled) {
      let initial = 'day';
      try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'night' || stored === 'day') initial = stored;
        else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) initial = 'night';
      } catch {}
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
    try {
      const evt = new CustomEvent('theme-change', { detail: { theme } });
      document.dispatchEvent(evt);
      window.dispatchEvent?.(evt);
    } catch {}
    onThemeChange?.(theme);
  }, [theme, isNight, onThemeChange]);

  function setTheme(next /** @type {Theme} */) { isControlled ? onChange?.(next) : setInternal(next); }
  function toggle() { setTheme(isNight ? 'day' : 'night'); }

  // preload moon to avoid first-switch flash
  useEffect(() => {
    const src = (Array.isArray(moonImages) && moonImages.length ? moonImages[0] : '/toggle/moon-red.png');
    const img = new Image();
    img.src = src;
  }, [moonImages]);

  // Sizing
  const dims = useMemo(() => {
    const knob  = Math.max(22, Math.round(circlePx));
    const padPx = Math.max(1, Math.min(8, Math.round(trackPad)));
    const h     = Math.max(knob + padPx * 2, 28);
    const w     = Math.round(h * (64 / 36));
    const inset = padPx;
    const shift = Math.round(w - knob - inset * 2);
    return { h, w, knob, inset, shift };
  }, [circlePx, trackPad]);

  const moonSrc = Array.isArray(moonImages) && moonImages.length ? moonImages[0] : '/toggle/moon-red.png';

  // ===== Night sky canvas (stars + constellation + meteor) =====
  const skyRef = useRef/** @type {React.RefObject<HTMLCanvasElement>} */(null);
  useEffect(() => {
    if (!isNight) return;
    const canvas = skyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;
    let rafId = 0;

    const resizeCanvas = () => {
      try {
        DPR = Math.max(1, Math.round(window.devicePixelRatio || 1));
        const rect = canvas.getBoundingClientRect();
        W = Math.max(1, Math.floor(rect.width * DPR));
        H = Math.max(1, Math.floor(rect.height * DPR));
        canvas.width = W;
        canvas.height = H;
      } catch {}
    };
    resizeCanvas();

    // RO with fallback
    let ro = null;
    try {
      ro = new ResizeObserver(resizeCanvas);
      ro.observe(canvas);
    } catch {
      window.addEventListener('resize', resizeCanvas);
    }

    const stars = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      a: Math.random() * Math.PI * 2,
      as: 0.004 + Math.random() * 0.006,
      r: (0.8 + Math.random()*0.6) * DPR,
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
    let lastSpawn = performance.now();

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

    const LOOP = () => {
      const g = ctx;
      g.clearRect(0,0,W,H);

      // twinkling stars
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
        const x=nx*W, y=ny*H;
        g.beginPath(); g.arc(x,y,1.2*DPR,0,Math.PI*2); g.fill();
      }

      // meteor sometimes
      const now = performance.now();
      if (meteor.t < 0 && now - lastSpawn > 2400 + Math.random()*2600) {
        lastSpawn = now; spawnMeteor();
      }
      if (meteor.t >= 0) {
        const p = Math.min(1, (now - meteor.born)/meteor.dur);
        const x = meteor.x0 + (meteor.x1 - meteor.x0)*p;
        const y = meteor.y0 + (meteor.y1 - meteor.y0)*p;
        const trail = 80 * DPR;
        const ang = Math.atan2(meteor.y1-meteor.y0, meteor.x1-meteor.x0);
        const tx = x - Math.cos(ang)*trail;
        const ty = y - Math.sin(ang)*trail;

        const grad = g.createLinearGradient(tx,ty,x,y);
        grad.addColorStop(0,'rgba(255,255,255,0)');
        grad.addColorStop(1,'rgba(255,255,255,.9)');
        g.strokeStyle = grad;
        g.lineWidth = 1.2*DPR;
        g.beginPath(); g.moveTo(tx,ty); g.lineTo(x,y); g.stroke();

        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x,y,1.4*DPR,0,Math.PI*2); g.fill();

        if (p >= 1) meteor.t = -1;
      }

      rafId = requestAnimationFrame(LOOP);
    };

    rafId = requestAnimationFrame(LOOP);
    return () => {
      try { cancelAnimationFrame(rafId); } catch {}
      try { ro ? ro.disconnect() : window.removeEventListener('resize', resizeCanvas); } catch {}
    };
  }, [isNight]);

  // keyboard a11y
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <button
      id={id}
      onClick={toggle}
      onKeyDown={onKeyDown}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        position:'relative',
        display:'inline-flex',
        height:dims.h, width:dims.w, borderRadius:9999, overflow:'hidden',
        border: isNight ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(0,0,0,.10)',
        boxShadow: '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer',
        WebkitTapHighlightColor:'transparent',
        isolation:'isolate',
        outline:'none',
      }}
    >
      {/* DAY BACKDROP (+ clouds) */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          opacity: isNight ? 0 : 1,
          transition:'opacity 400ms ease',
        }}
      >
        {!isNight && <Clouds />}
      </span>

      {/* NIGHT SKY (canvas) */}
      {isNight && (
        <canvas ref={skyRef} aria-hidden style={{ position:'absolute', inset:0, borderRadius:9999, pointerEvents:'none' }} />
      )}

      {/* KNOB (ridged sun / moon image) */}
      <span
        aria-hidden
        style={{
          position:'absolute',
          top:dims.inset, left:dims.inset,
          height:dims.knob, width:dims.knob, borderRadius:'50%',
          background:'transparent',
          display:'grid', placeItems:'center',
          transform:`translateX(${isNight ? dims.shift : 0}px)`,
          transition:'transform 320ms cubic-bezier(.22,.61,.21,.99)',
          overflow:'visible',
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
          <SunIcon size={dims.knob}/>
        </span>

        {/* Moon (no blue ring) */}
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
              width: dims.knob, height: dims.knob, borderRadius:'50%',
              display:'block', objectFit:'cover',
              mixBlendMode:'screen', filter:'saturate(1.15) brightness(1.02)',
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
