// src/components/DayNightToggle.jsx
'use client';

import React from 'react';

export default function DayNightToggle({
  size = 32,              // HEIGHT of the control
  value = 'day',          // 'day' | 'night'
  onChange,
  showVirgo = true,       // stars path decoration
}) {
  const h = Math.max(24, Number(size) || 32);
  const w = Math.round(h * 2.15);
  const r = h / 2;
  const isNight = value === 'night';

  const handle = () => onChange?.(isNight ? 'day' : 'night');

  return (
    <button
      type="button"
      aria-label="Toggle day and night theme"
      className="lb-switch"
      data-theme={isNight ? 'night' : 'day'}
      onClick={handle}
      // explicit sizing so it never inherits anything weird
      style={{ width: w, height: h, borderRadius: 9999, padding: 0 }}
    >
      {/* background sky */}
      <div className="lb-switch-bg" />

      {/* clouds by day, stars by night */}
      <div className="lb-switch-decor">
        {/* clouds (day) */}
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />

        {/* stars (night) */}
        {showVirgo && (
          <svg className="stars" viewBox="0 0 200 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <g fill="#eaf1ff">
              <circle cx="36" cy="20" r="2" /><circle cx="58" cy="42" r="1.6" />
              <circle cx="84" cy="30" r="2" /><circle cx="106" cy="46" r="1.8" />
              <circle cx="128" cy="40" r="2" /><circle cx="150" cy="52" r="1.6" />
              <circle cx="176" cy="66" r="2.2" />
            </g>
            <g stroke="#9cc4ff" strokeWidth="1.5" strokeLinecap="round" opacity=".9">
              <line x1="36" y1="20" x2="58" y2="42" />
              <line x1="58" y1="42" x2="84" y2="30" />
              <line x1="84" y1="30" x2="106" y2="46" />
              <line x1="106" y1="46" x2="128" y2="40" />
              <line x1="128" y1="40" x2="150" y2="52" />
              <line x1="150" y1="52" x2="176" y2="66" />
            </g>
          </svg>
        )}
      </div>

      {/* knob
         DAY  : big white circle (the sun)
         NIGHT: dark knob with a crescent 'moon' svg shown via CSS
      */}
      <div
        className="lb-switch-knob"
        style={{
          width: h - 8,
          height: h - 8,
          borderRadius: r,
          left: 6,
          // subtle halo so the “sun” feels bright without an inner dot
          boxShadow: isNight
            ? '0 6px 18px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.08)'
            : '0 6px 18px rgba(0,0,0,.18), 0 0 22px rgba(255,255,255,.65), inset 0 0 0 1px rgba(0,0,0,.06)',
          background: isNight ? '#0e0e16' : '#fff',
        }}
      >
        {/* Only render the moon; the day “sun” is the white knob itself */}
        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill="#a6c8ff" />
          <circle cx="14" cy="12" r="6" fill="black" />
        </svg>
      </div>
    </button>
  );
}
