// src/components/DayNightToggle.jsx
'use client';

import { useEffect, useState } from 'react';

/**
 * Day/Night pill toggle
 * - Controlled via `value` ("day" | "night") and `onChange`
 * - Persists to localStorage ("lb-theme") so a reload keeps your choice
 * - Accessible: role="switch" with aria-checked
 */
export default function DayNightToggle({
  value,
  onChange,
  persistKey = 'lb-theme',
  size = 84,
}) {
  const [internal, setInternal] = useState(value || 'day');

  // keep internal in sync with parent
  useEffect(() => {
    if (value && value !== internal) setInternal(value);
  }, [value]); // eslint-disable-line

  // optional persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(persistKey);
      if (!value && (saved === 'day' || saved === 'night')) {
        setInternal(saved);
        onChange?.(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNight = (value ?? internal) === 'night';

  const toggle = () => {
    const next = isNight ? 'day' : 'night';
    setInternal(next);
    try { localStorage.setItem(persistKey, next); } catch {}
    onChange?.(next);
  };

  const W = Math.max(84, size);
  const H = Math.round(W * 0.48);
  const knob = Math.round(H * 0.76);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isNight}
      onClick={toggle}
      className="lb-switch"
      style={{
        width: W,
        height: H,
        borderRadius: H,
      }}
      title={isNight ? 'Switch to Day' : 'Switch to Night'}
    >
      {/* sky / stars backdrop */}
      <div className="lb-switch-bg" aria-hidden />
      {/* decorative clouds / stars */}
      <div className="lb-switch-decor" aria-hidden>
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
        <div className="stars">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`s s${i + 1}`} />
          ))}
        </div>
      </div>

      {/* knob (sun / moon) */}
      <div
        className="lb-switch-knob"
        style={{
          width: knob,
          height: knob,
          borderRadius: knob,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="icon"
          aria-hidden
          focusable="false"
        >
          {/* Sun (day) */}
          <defs>
            <radialGradient id="sunGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="65%" stopColor="#ffe066" />
              <stop offset="100%" stopColor="#ffcf33" />
            </radialGradient>
          </defs>
          <circle className="sun" cx="50" cy="50" r="28" fill="url(#sunGrad)" />
          {/* Moon (night) */}
          <g className="moon">
            <circle cx="50" cy="50" r="28" fill="#d9d9e3" />
            <circle cx="63" cy="42" r="5" fill="#b8b8c6" />
            <circle cx="43" cy="60" r="4" fill="#b8b8c6" />
            <circle cx="53" cy="68" r="3" fill="#b8b8c6" />
            <circle cx="38" cy="45" r="3.6" fill="#b8b8c6" />
          </g>
        </svg>
      </div>
    </button>
  );
}
