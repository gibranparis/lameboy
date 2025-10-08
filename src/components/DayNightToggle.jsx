// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

/* ---- Icons (self-contained SVGs; no external colors) ---- */
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

/* ---- Toggle ---- */
export default function DayNightToggle({ className = '' }) {
  const [theme, setTheme] = useState('day'); // 'day' | 'night'
  const isNight = theme === 'night';

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const initial = stored === 'night' || stored === 'day' ? stored : 'day';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(next) {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'night'); // Tailwind dark mode = 'class'
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: next } }));
  }

  function toggle() {
    const next = isNight ? 'day' : 'night';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={clsx(
        'relative inline-flex h-9 w-16 items-center rounded-full transition-colors',
        'ring-1 ring-black/5 dark:ring-white/10 shadow-sm',
        isNight ? 'bg-[#1e1e1e]' : 'bg-white',
        // remove tap highlight without using hyphenated object keys:
        'select-none [--tap:none] touch-manipulation',
        className
      )}
    >
      {/* glossy track */}
      <span
        className={clsx(
          'absolute inset-0 rounded-full pointer-events-none',
          'bg-gradient-to-b from-white/60 to-black/5 dark:from-white/10 dark:to-black/40'
        )}
      />
      {/* knob */}
      <span
        className={clsx(
          'relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 ease-out',
          'shadow-md ring-1 ring-black/5 dark:ring-white/10',
          isNight ? 'translate-x-8 bg-[#0e0f12]' : 'translate-x-1 bg-[#f6f7f4]'
        )}
      >
        {/* crossfade icons to avoid “white dot” */}
        <span className={clsx('absolute inset-0 grid place-items-center transition-opacity duration-200', isNight ? 'opacity-0' : 'opacity-100')}>
          <SunHaloIcon className="h-5 w-5" />
        </span>
        <span className={clsx('absolute inset-0 grid place-items-center transition-opacity duration-200', isNight ? 'opacity-100' : 'opacity-0')}>
          <MoonIcon className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
}
