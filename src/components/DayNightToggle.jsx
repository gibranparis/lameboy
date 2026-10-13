// src/components/DayNightToggle.jsx
// Clouds (day), Virgo constellation (night)
// NASA sun image and moon image
'use client';

import { useEffect, useMemo, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';
/** Window event that flips the toggle from outside (a swipe or a flick of it) */
export const THEME_FLIP = 'lb:theme-flip';

/* ---------- Tiny cloud layer (day) ---------- */
function Clouds() {
  return (
    <>
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999, overflow:'hidden', pointerEvents:'none',
          background:
            'linear-gradient(180deg, rgba(191,231,255,.3) 0%, rgba(223,244,255,.2) 60%, rgba(255,255,255,.15) 100%)',
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
  circlePx = 24,
  trackPad = 1,
  moonImages = ['/toggle/Blue%20hand-drawn%20symbol%20with%20_LAME_.png','/toggle/moon-blue.png'],
  sunImages = ['/toggle/sun.webp'],
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

  // Swiped or flicked (see HeaderBar): flips just like a tap
  useEffect(() => {
    const flip = () => setTheme(isNight ? 'day' : 'night');
    window.addEventListener(THEME_FLIP, flip);
    return () => window.removeEventListener(THEME_FLIP, flip);
  });

  // Each knob wears one of its set, picked at random once mounted (after
  // mount so the server and first client render agree): in day mode a moon
  // (tap for night), in night mode the sun or a sunlit planet (tap for day)
  const [moonPick, setMoonPick] = useState(0);
  const [sunPick, setSunPick] = useState(0);
  useEffect(() => {
    const pick = (list) => (Array.isArray(list) && list.length > 1 ? Math.floor(Math.random() * list.length) : 0);
    setMoonPick(pick(moonImages));
    setSunPick(pick(sunImages));
  }, [moonImages.length, sunImages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // preload moon, sun, and constellation to avoid first-switch flash
  useEffect(() => {
    const moonSrc = (Array.isArray(moonImages) && moonImages.length ? moonImages[moonPick] || moonImages[0] : '/toggle/Blue%20hand-drawn%20symbol%20with%20_LAME_.png');
    const sunSrc = sunImages?.[sunPick] || '/toggle/sun.webp';
    const constellationSrc = '/toggle/virgo-constellation.webp';
    const sunsetSrc = '/toggle/white%20cloud.png';
    [moonSrc, sunSrc, constellationSrc, sunsetSrc].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [moonImages, moonPick, sunImages, sunPick]);

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

  const moonSrc = Array.isArray(moonImages) && moonImages.length ? moonImages[moonPick] || moonImages[0] : '/toggle/moon-red.png';
  // The moons are lifted with a screen blend; planet photos keep their own colours
  const moonBlend = moonSrc.includes('/planet-') ? 'normal' : 'screen';
  const nightSrc = sunImages?.[sunPick] || '/toggle/sun.webp';
  const nightIsSun = nightSrc.endsWith('/sun.webp');

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
        border: 'none',
        boxShadow: '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer',
        WebkitTapHighlightColor:'transparent',
        isolation:'isolate',
        outline:'none',
        transition:'transform 120ms ease',
      }}
    >
      {/* DAY BACKDROP (white cloud + clouds) */}
      <span
        aria-hidden
        style={{
          position:'absolute', inset:0, borderRadius:9999,
          opacity: isNight ? 0 : 1,
          transition:'opacity 400ms ease',
          overflow:'hidden',
        }}
      >
        <img
          src="/toggle/white%20cloud.png"
          alt=""
          className="sunset-drift"
          style={{
            position:'absolute',
            width:'220%', height:'220%',
            objectFit:'cover',
            pointerEvents:'none',
          }}
          draggable={false}
        />
        {!isNight && <Clouds />}
      </span>

      {/* NIGHT SKY (Virgo constellation) */}
      {isNight && (
        <span
          aria-hidden
          style={{
            position:'absolute',
            inset:0,
            borderRadius:9999,
            overflow:'hidden',
            pointerEvents:'none',
            background:'#0a0a12',
          }}
        >
          <img
            src="/toggle/virgo-constellation.webp"
            alt=""
            className="constellation-drift"
            style={{
              width:'220%',
              height:'220%',
              objectFit:'cover',
              position:'absolute',
              opacity:0.85,
              mixBlendMode:'lighten',
            }}
            draggable={false}
          />
        </span>
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
          filter:'saturate(1.02)',
        }}
      >
        {/* Night knob: the sun or a sunlit planet */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 1 : 0, transition:'opacity 180ms ease',
          }}
        >
          <img
            src={nightSrc}
            alt=""
            style={{
              width: dims.knob,
              height: dims.knob,
              borderRadius: '50%',
              display: 'block',
              objectFit: 'cover',
              objectPosition: 'center',
              // the sun glows gold; a planet gets a soft pale glow
              filter: nightIsSun
                ? 'saturate(1.1) brightness(1.05) drop-shadow(0 0 12px rgba(255,210,80,.7))'
                : 'saturate(1.1) brightness(1.08) drop-shadow(0 0 8px rgba(200,220,255,.45))',
            }}
            draggable={false}
          />
        </span>

        {/* Moon */}
        <span
          style={{
            position:'absolute', inset:0, display:'grid', placeItems:'center',
            opacity: isNight ? 0 : 1, transition:'opacity 180ms ease',
          }}
        >
          <img
            src={moonSrc}
            alt=""
            style={{
              width: dims.knob, height: dims.knob, borderRadius:'50%',
              display:'block', objectFit:'cover',
              mixBlendMode:moonBlend, filter:'saturate(1.15) brightness(1.02)',
            }}
            draggable={false}
          />
        </span>
      </span>

      <style jsx>{`
        button:hover {
          transform: scale(1.05);
        }
        @keyframes cloudMove {
          from { transform: translateX(-4%); }
          to { transform: translateX(6%); }
        }
        @keyframes starDrift {
          0% { left: -100%; top: -100%; }
          25% { left: -100%; top: -20%; }
          50% { left: -20%; top: -20%; }
          75% { left: -20%; top: -100%; }
          100% { left: -100%; top: -100%; }
        }
        .constellation-drift {
          animation: starDrift 30s ease-in-out infinite;
        }
        @keyframes sunsetDrift {
          0%   { left: -100%; top: -100%; }
          25%  { left: -100%; top: -20%; }
          50%  { left: -20%;  top: -20%; }
          75%  { left: -20%;  top: -100%; }
          100% { left: -100%; top: -100%; }
        }
        .sunset-drift {
          animation: sunsetDrift 30s ease-in-out infinite;
        }
      `}</style>
    </button>
  );
}
