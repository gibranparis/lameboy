// src/components/DayNightToggle.jsx
'use client';

import React from 'react';

export default function DayNightToggle(props) {
  // Backward/forward compatible prop mapping
  const size    = props.size ?? props.height ?? 34;   // one number drives both dims
  const width   = props.width ?? Math.round(size * 2.2);
  const height  = size;
  const isNight = ('isNight' in props) ? props.isNight : (props.value === 'night');
  const onToggle = props.onToggle ?? (props.onChange
    ? () => props.onChange(isNight ? 'day' : 'night')
    : undefined);

  const r = height / 2;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle day and night theme"
      className="lb-switch"
      data-theme={isNight ? 'night' : 'day'}
      style={{
        width,
        height,
        borderRadius: 999,
        padding: 0,
      }}
    >
      {/* background sky */}
      <div className="lb-switch-bg" />

      {/* decoration */}
      <div className="lb-switch-decor">
        {/* clouds (stay visible in day) */}
        <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
        {/* thin line-stars (kept subtle) */}
        <svg className="stars" viewBox="0 0 200 100" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
          <g stroke="#9cc4ff" strokeWidth="1.5" strokeLinecap="round" opacity=".9">
            <line x1="36" y1="20" x2="58" y2="42"/>
            <line x1="58" y1="42" x2="84"  y2="30"/>
            <line x1="84"  y1="30" x2="106" y2="46"/>
            <line x1="106" y1="46" x2="128" y2="40"/>
            <line x1="128" y1="40" x2="150" y2="52"/>
            <line x1="150" y1="52" x2="176" y2="66"/>
          </g>
        </svg>
      </div>

      {/* knob — make the white circle itself the sun */}
      <div
        className="lb-switch-knob"
        style={{
          width: height - 8,
          height: height - 8,
          borderRadius: r,
          left: 6,
        }}
      >
        {/* WHITE = sun (no small yellow dot anymore) */}
        <svg className="icon sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="#ffffff"/>
        </svg>
        {/* Moon appears only at night via CSS opacity */}
        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" fill="#a6c8ff"/>
          <circle cx="14" cy="12" r="7" fill="black"/>
        </svg>
      </div>
    </button>
  );
}
