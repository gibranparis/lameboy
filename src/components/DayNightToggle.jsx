// src/components/DayNightToggle.jsx
'use client';

import { memo, useMemo } from 'react';

/**
 * DayNightToggle
 * Props:
 *  - value: 'day' | 'night'
 *  - onChange(next) => void
 *  - size: px height of the control
 *  - showVirgo: boolean to overlay Virgo constellation on night
 */
function DayNightToggleImpl({ value = 'day', onChange, size = 40, showVirgo = false }) {
  const w = Math.max(44, size * 2.1);     // width feels nice ~2.1x height
  const h = Math.max(32, size);           // exact “visual” height
  const r = Math.round(h / 2);            // full pill radius

  const isNight = value === 'night';

  // Hard-coded Virgo constellation (a simple line drawing of key stars)
  const virgo = useMemo(() => ({
    viewBox: '0 0 200 100',
    // star points (approximate, tuned to fit visually in the switch background)
    stars: [
      [20, 60], [38, 46], [58, 58], [76, 44], [94, 34],
      [118, 46], [140, 36], [160, 50], [180, 40]
    ],
    links: [
      [0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8]
    ]
  }), []);

  return (
    <button
      type="button"
      aria-label="day-night"
      className="lb-switch"
      onClick={() => onChange?.(isNight ? 'day' : 'night')}
      data-theme={isNight ? 'night' : 'day'}
      style={{
        width: w, height: h, borderRadius: r
      }}
    >
      {/* background gradients */}
      <div className="lb-switch-bg" style={{ borderRadius: r }} />

      {/* deco layer: clouds (day) + stars (night) */}
      <div className="lb-switch-decor" style={{ borderRadius: r }}>
        {/* Clouds (day only; they fade out in CSS when night) */}
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />

        {/* Simple stars scatter */}
        <div className="stars">
          <span className="s s1" /><span className="s s2" /><span className="s s3" />
          <span className="s s4" /><span className="s s5" /><span className="s s6" />
          <span className="s s7" /><span className="s s8" /><span className="s s9" />
          <span className="s s10" /><span className="s s11" /><span className="s s12" />
        </div>

        {/* Virgo constellation (night only) */}
        {showVirgo && (
          <svg
            className="constellation"
            viewBox={virgo.viewBox}
            aria-hidden="true"
            style={{
              position:'absolute', inset:0, opacity:isNight ? 1 : 0,
              transition:'opacity .45s ease', pointerEvents:'none',
              mixBlendMode:'screen'
            }}
          >
            {/* links */}
            <g stroke="#9cc4ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
              {virgo.links.map(([a,b], i) => {
                const [x1,y1] = virgo.stars[a];
                const [x2,y2] = virgo.stars[b];
                return <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
            {/* star dots */}
            <g fill="#dff0ff">
              {virgo.stars.map(([x,y], i) => (
                <circle key={`s-${i}`} cx={x} cy={y} r="2.4">
                  <animate attributeName="r" values="2.2;3;2.2" dur="2s" repeatCount="indefinite" begin={`${i*0.12}s`} />
                </circle>
              ))}
            </g>
          </svg>
        )}
      </div>

      {/* knob */}
      <div
        className="lb-switch-knob"
        style={{
          width: h - 6, height: h - 6, borderRadius: r,
          left: 6
        }}
      >
        {/* Sun / Moon icon sized to knob */}
        <svg className="icon sun" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#fff799"/>
              <stop offset="55%" stopColor="#ffd74d"/>
              <stop offset="100%" stopColor="#ffb400"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="6.5" fill="url(#sunGlow)">
            <animate attributeName="r" values="6.2;6.8;6.2" dur="2.2s" repeatCount="indefinite"/>
          </circle>
        </svg>

        <svg className="icon moon" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <radialGradient id="moonCore" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#9fc7ff"/>
              <stop offset="100%" stopColor="#5fa0ff"/>
            </radialGradient>
          </defs>
          <path
            fill="url(#moonCore)"
            d="M16.5 12.5a6.5 6.5 0 1 1-9.2-5.9 7.8 7.8 0 1 0 9.2 9.2 6.45 6.45 0 0 1 0-3.3z"
          />
        </svg>
      </div>
    </button>
  );
}

export default memo(DayNightToggleImpl);
