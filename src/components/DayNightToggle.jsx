// src/components/DayNightToggle.jsx
'use client';

import React, { useMemo } from 'react';

export default function DayNightToggle({
  size = 36,                 // overall HEIGHT of the switch
  value = 'day',             // 'day' | 'night'
  onChange = () => {},
}) {
  const isNight = value === 'night';
  const h = Math.max(26, Number(size) || 36);
  const w = Math.round(h * 1.8);
  const pad = 4;
  const knob = h - pad * 2;  // the KNOB is the sun

  // move knob left↔right
  const knobX = isNight ? w - pad - knob : pad;

  const toggle = () => onChange(isNight ? 'day' : 'night');

  const bgStyle = useMemo(
    () => ({
      position: 'absolute',
      inset: 0,
      borderRadius: 999,
      overflow: 'hidden',
      transition: 'opacity .35s ease, filter .35s ease, background .35s ease',
      background: isNight
        ? 'radial-gradient(120% 120% at 30% 30%, #1a1a2b 0%, #0b0b14 55%, #000 100%)'
        : 'linear-gradient(180deg, #bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
    }),
    [isNight]
  );

  return (
    <button
      type="button"
      aria-label="Toggle day and night theme"
      onClick={toggle}
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        position: 'relative',
        border: '1.5px solid rgba(0,0,0,.14)',
        background: '#fff',
        boxShadow: '0 4px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.6)',
        cursor: 'pointer',
        -webkitTapHighlightColor: 'transparent',
        padding: 0,
      }}
    >
      {/* background sky / night */}
      <div style={bgStyle} />

      {/* KNOB = SUN (day) / MOON CRESCENT (night) */}
      <div
        style={{
          position: 'absolute',
          top: pad,
          left: knobX,
          width: knob,
          height: knob,
          borderRadius: knob,
          background: isNight
            ? '#0e0e16'
            : 'radial-gradient(60% 60% at 40% 40%, #fff 0%, #fff 60%, #f8f8f8 61%, #f3f3f3 100%)',
          boxShadow: isNight
            ? '0 6px 18px rgba(0,0,0,.30), inset 0 0 0 1px rgba(255,255,255,.05)'
            : '0 6px 18px rgba(0,0,0,.18), inset 0 0 0 1px rgba(255,255,255,.6)',
          transition:
            'left .45s cubic-bezier(.22,.61,.21,.99), background .3s ease, box-shadow .3s ease',
        }}
      >
        {/* Sun rays (day only) */}
        {!isNight && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 999,
              boxShadow:
                '0 0 0 4px rgba(255,220,80,.35), 0 0 18px rgba(255,220,80,.45)',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Crescent cutout (night only) */}
        {isNight && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -knob * 0.28,
              top: knob * 0.18,
              width: knob * 0.72,
              height: knob * 0.72,
              borderRadius: 999,
              background: '#000',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
            }}
          />
        )}
      </div>
    </button>
  );
}
