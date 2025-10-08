'use client';

import React from 'react';

/**
 * DayNightToggle
 * - Accepts EITHER the old API { width, height, isNight, onToggle }
 *   OR the new API   { size, value:'day'|'night', onChange(next) }.
 * - Optional: showVirgo (draw constellation lines).
 */
export default function DayNightToggle(props) {
  // ---- dimensions ----
  const size   = Number(props.size) || 0;               // if provided, height = size
  const height = size || Number(props.height) || 34;    // fallback to old prop or default
  const width  = Number(props.width) || Math.round(height * 1.8);

  // ---- state wiring (supports both signatures) ----
  const boolFromValue = props.value === 'night' ? true
                        : props.value === 'day' ? false
                        : undefined;

  const isNight = typeof boolFromValue === 'boolean'
    ? boolFromValue
    : !!props.isNight;

  const fireToggle = () => {
    // new signature
    if (typeof props.onChange === 'function') {
      props.onChange(isNight ? 'day' : 'night');
    }
    // legacy signature
    if (typeof props.onToggle === 'function') {
      props.onToggle(!isNight);
    }
  };

  const r = height / 2;

  return (
    <button
      type="button"
      onClick={fireToggle}
      aria-label="Toggle day and night theme"
      className="lb-switch"
      data-theme={isNight ? 'night' : 'day'}
      style={{ width, height, borderRadius: 999, padding: 0 }}
    >
      {/* background sky */}
      <div className="lb-switch-bg" />

      {/* decoration (clouds for day, stars for night) */}
      <div className="lb-switch-decor">
        {/* clouds */}
        <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />

        {/* stars + (optional) Virgo lines */}
        <svg className="stars" viewBox="0 0 200 100" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
          <g fill="#dff0ff" opacity="0.95">
            <circle cx="36" cy="20" r="2"/><circle cx="58" cy="42" r="1.6"/>
            <circle cx="84" cy="30" r="2"/><circle cx="106" cy="46" r="1.8"/>
            <circle cx="128" cy="40" r="2"/><circle cx="150" cy="52" r="1.6"/>
            <circle cx="176" cy="66" r="2.2"/>
          </g>
          {props.showVirgo && (
            <g stroke="#9cc4ff" strokeWidth="1.5" strokeLinecap="round" opacity=".9">
              <line x1="36" y1="20" x2="58" y2="42"/>
              <line x1="58" y1="42" x2="84" y2="30"/>
              <line x1="84" y1="30" x2="106" y2="46"/>
              <line x1="106" y1="46" x2="128" y2="40"/>
              <line x1="128" y1="40" x2="150" y2="52"/>
              <line x1="150" y1="52" x2="176" y2="66"/>
            </g>
          )}
        </svg>
      </div>

      {/* knob */}
      <div
        className="lb-switch-knob"
        style={{
          width: height - 8,
          height: height - 8,
          borderRadius: r,
          left: 6,
        }}
      >
        {/* bright sun */}
        <svg className="icon sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="#ffdd55"/>
        </svg>
        {/* cool moon */}
        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill="#a6c8ff"/>
          <circle cx="14" cy="12" r="6" fill="black"/>
        </svg>
      </div>
    </button>
  );
}
