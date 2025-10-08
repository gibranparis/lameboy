// src/components/DayNightToggle.jsx
'use client';

import React from 'react';

/**
 * Back-compat API:
 * - Old: { width, height, isNight, onToggle }
 * - New: { size, value, onChange }
 *
 * We support both. If `size` is given, height = size and width = size * 1.62 (nice slim ratio).
 */
export default function DayNightToggle(props){
  const {
    // old API
    width,
    height,
    isNight,
    onToggle,
    // new API
    size,
    value,
    onChange,
  } = props;

  const heightPx = Math.round((size ?? height ?? 34));
  const widthPx  = Math.round((size ? size * 1.62 : (width ?? 88)));

  const night = typeof isNight === 'boolean'
    ? isNight
    : (value === 'night');

  const handle = () => {
    if (typeof onToggle === 'function') return onToggle();
    if (typeof onChange === 'function') return onChange(night ? 'day' : 'night');
  };

  const r = heightPx / 2;

  return (
    <button
      type="button"
      onClick={handle}
      aria-label="Toggle day and night theme"
      className="lb-switch"
      data-theme={night ? 'night' : 'day'}
      style={{
        width: widthPx,
        height: heightPx,
        borderRadius: 999,
        padding: 0,
        lineHeight: 0,
      }}
    >
      {/* background sky */}
      <div className="lb-switch-bg" />

      {/* decoration */}
      <div className="lb-switch-decor">
        {/* clouds (day) */}
        <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
        {/* Virgo constellation (night) */}
        <svg className="stars" viewBox="0 0 200 100" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
          <g fill="#dff0ff" opacity=".95">
            <circle cx="36" cy="20" r="2"/><circle cx="58" cy="42" r="1.6"/>
            <circle cx="84" cy="30" r="2"/><circle cx="106" cy="46" r="1.8"/>
            <circle cx="128" cy="40" r="2"/><circle cx="150" cy="52" r="1.6"/>
            <circle cx="176" cy="66" r="2.2"/>
          </g>
          <g stroke="#9cc4ff" strokeWidth="1.5" strokeLinecap="round" opacity=".9">
            <line x1="36" y1="20" x2="58" y2="42"/>
            <line x1="58" y1="42" x2="84" y2="30"/>
            <line x1="84" y1="30" x2="106" y2="46"/>
            <line x1="106" y1="46" x2="128" y2="40"/>
            <line x1="128" y1="40" x2="150" y2="52"/>
            <line x1="150" y1="52" x2="176" y2="66"/>
          </g>
        </svg>
      </div>

      {/* knob */}
      <div
        className="lb-switch-knob"
        style={{
          width: heightPx - 10,
          height: heightPx - 10,
          borderRadius: r,
          left: 6,
        }}
      >
        <svg className="icon sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="#ffdd55"/>
        </svg>
        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill="#b9d3ff"/>
          <circle cx="14" cy="12" r="6" fill="black"/>
        </svg>
      </div>
    </button>
  );
}
