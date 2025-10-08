// @ts-check
// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useState } from 'react';

/** @param {{ className?: string }} props */
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

/** @param {{ className?: string }} props */
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

/** @typedef {'day'|'night'} Theme */

/** LocalStorage key used for theme persistence */
const THEME_KEY = 'theme';

/** @param {{ className?: string }} props */
export default function DayNightToggle({ className = '' }) {
  /** @type {[Theme, (t: Theme) => void]} */
  // @ts-ignore - React infers the setter; the JSDoc above narrows the value
  const [theme, setTheme] = useState(/** @type {Theme} */('day'));

  /** Whether we are in night mode */
  const isNight = theme === 'night';

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    /** @type {Theme} */
    const initial = stored === 'night' || stored === 'day' ? stored : 'day';
    setTheme(initial);
    apply(initial);
  }, []);

  /** Apply theme to <html> and notify listeners
   *  @param {Theme} next
   */
  function apply(next) {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'night'); // Tailwind v4 dark mode = 'class'
    root.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);

    /** @type {CustomEventInit<{ theme: Theme }>} */
    const evt = { detail: { theme: next } };
    window.dispatchEvent(new CustomEvent('theme-change', evt));
  }

  /** Toggle between 'day' and 'night' */
  function toggle() {
    /** @type {Theme} */
    const next = isNight ? 'day' : 'night';
    setTheme(next);
    apply(next);
  }

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Toggle day / night"
        role="switch"
        aria-checked={isNight}
        className={`lb-toggle ${className}`}
      >
        <span className="lb-track" />
        <span className={`lb-knob ${isNight ? 'is-night' : 'is-day'}`}>
          <span className={`lb-icon ${isNight ? 'hide' : 'show'}`}>
            <SunHaloIcon className="lb-svg" />
          </span>
          <span className={`lb-icon ${isNight ? 'show' : 'hide'}`}>
            <MoonIcon className="lb-svg" />
          </span>
        </span>
      </button>

      <style jsx>{`
        .lb-toggle {
          position: relative;
          display: inline-flex;
          height: 36px;
          width: 64px;
          border-radius: 9999px;
          background: ${isNight ? '#1e1e1e' : '#fff'};
          box-shadow:
            0 1px 2px rgba(0,0,0,.06),
            0 1px 1px rgba(0,0,0,.03),
            inset 0 0 0 1px rgba(0,0,0,.06);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .lb-track {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(${isNight ? 'to bottom, rgba(255,255,255,.08), rgba(0,0,0,.4)' : 'to bottom, rgba(255,255,255,.6), rgba(0,0,0,.05)'});
          pointer-events: none;
        }
        .lb-knob {
          position: absolute;
          top: 4px;
          left: 4px;
          height: 28px;
          width: 28px;
          border-radius: 9999px;
          background: ${isNight ? '#0e0f12' : '#f6f7f4'};
          box-shadow:
            0 2px 6px rgba(0,0,0,.18),
            inset 0 0 0 1px rgba(0,0,0,.06);
          display: grid;
          place-items: center;
          transition: transform 300ms ease-out, background 200ms ease;
          transform: translateX(${isNight ? '32px' : '0px'});
        }
        .lb-icon {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          transition: opacity 200ms ease;
        }
        .lb-icon.show { opacity: 1; }
        .lb-icon.hide { opacity: 0; }
        .lb-svg { height: 20px; width: 20px; }
      `}</style>
    </>
  );
}
