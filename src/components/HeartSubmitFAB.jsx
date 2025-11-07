// src/components/HeartSubmitFAB.jsx
'use client';

import React from 'react';

/**
 * Floating Action Button with a glossy glowing red heart.
 * - Compact, neon rim, soft pulse
 * - Fully self-contained (inline styles + keyframes)
 */
export default function HeartSubmitFAB({
  onClick,
  size = 58,          // dial this up/down
  title = 'Submit',
  ariaLabel = 'Submit',
  style,
  className = '',
}) {
  const S = Math.max(44, size);
  const ring = Math.round(S * 0.5);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={className}
      style={{
        height: S,
        width: S,
        borderRadius: '9999px',
        padding: 0,
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 35% 30%, #ff8aa3 0%, #ff2f4f 35%, #d60e2f 70%, #8e0017 100%)',
        boxShadow:
          '0 10px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -6px 12px rgba(0,0,0,.25)',
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 520,
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform .08s ease, box-shadow .18s ease, filter .18s ease',
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px) scale(.98)';
        e.currentTarget.style.boxShadow =
          '0 6px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.22), inset 0 -8px 14px rgba(0,0,0,.32)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow =
          '0 10px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -6px 12px rgba(0,0,0,.25)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow =
          '0 10px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -6px 12px rgba(0,0,0,.25)';
      }}
    >
      {/* rim glow */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 'inherit',
          boxShadow:
            '0 0 0 2px rgba(255,80,110,.5), 0 0 24px rgba(255,40,70,.45), 0 0 48px rgba(255,40,70,.25)',
          pointerEvents: 'none',
          animation: 'lbHeartPulse 2.2s ease-in-out infinite',
        }}
      />

      {/* spec highlight dot */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '26%',
          top: '24%',
          width: Math.round(S * 0.18),
          height: Math.round(S * 0.18),
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,.55) 60%, rgba(255,255,255,0) 100%)',
          filter: 'blur(0.3px)',
          opacity: 0.95,
          pointerEvents: 'none',
        }}
      />

      {/* heart glyph */}
      <svg
        viewBox="0 0 64 64"
        width={ring}
        height={ring}
        aria-hidden="true"
        style={{
          display: 'block',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.35))',
        }}
      >
        <defs>
          <linearGradient id="hgrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff2f5" />
            <stop offset="50%" stopColor="#ffd6de" />
            <stop offset="100%" stopColor="#ff9aae" />
          </linearGradient>
        </defs>
        <path
          d="M32 51c-1.2 0-2.5-.4-3.4-1.2C22.3 45.9 14 39.3 10.8 33.4 8.4 29 9 23.5 12.4 20.1c3.6-3.6 9.5-3.9 13.6-.8 1.5 1.1 2.8 2.6 4 4.5 1.2-1.9 2.5-3.4 4-4.5 4.1-3.1 10-2.8 13.6.8 3.4 3.4 4 8.9 1.6 13.3-3.2 5.9-11.5 12.5-17.8 16.4-.9.6-2.2 1.2-3.4 1.2z"
          fill="url(#hgrad)"
          stroke="rgba(0,0,0,.15)"
          strokeWidth="0.8"
        />
      </svg>

      <style jsx>{`
        @keyframes lbHeartPulse {
          0%, 100% { opacity: .85; }
          50% { opacity: 1; box-shadow: 0 0 0 2px rgba(255,80,110,.7), 0 0 36px rgba(255,40,70,.65), 0 0 72px rgba(255,40,70,.35); }
        }
        button:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(255,255,255,.3),
            0 10px 24px rgba(0,0,0,.35),
            inset 0 1px 0 rgba(255,255,255,.25),
            inset 0 -6px 12px rgba(0,0,0,.25) !important;
        }
      `}</style>
    </button>
  );
}
