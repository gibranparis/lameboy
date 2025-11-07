// src/components/HeartSubmitFAB.jsx
'use client';

import React from 'react';

/**
 * Minimal glass FAB with a glowing red heart (no red “bubble” fill).
 * - Dark glass circle, thin rim
 * - Soft pulse on rim + heart only
 * - Self-contained (inline styles + keyframes)
 */
export default function HeartSubmitFAB({
  onClick,
  size = 56,                  // tweak if you want it smaller/larger
  title = 'Submit',
  ariaLabel = 'Submit',
  style,
  className = '',
}) {
  const S = Math.max(44, size);

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
        border: '1px solid rgba(255,255,255,.14)',
        outline: 'none',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        // glassy dark pad (not red)
        background:
          'linear-gradient(180deg, rgba(15,15,18,.85) 0%, rgba(10,10,14,.85) 100%)',
        boxShadow:
          '0 8px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 520,
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform .08s ease, box-shadow .18s ease, filter .18s ease, border-color .18s ease',
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px) scale(.98)';
        e.currentTarget.style.boxShadow =
          '0 6px 16px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.04)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow =
          '0 8px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow =
          '0 8px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)';
      }}
    >
      {/* subtle rim glow (no big bubble) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 'inherit',
          boxShadow:
            '0 0 0 1px rgba(255,70,100,.35), 0 0 14px rgba(255,50,80,.25)',
          pointerEvents: 'none',
          animation: 'lbHeartSoftPulse 2.2s ease-in-out infinite',
        }}
      />

      {/* red heart glyph only */}
      <svg
        viewBox="0 0 64 64"
        width={Math.round(S * 0.54)}
        height={Math.round(S * 0.54)}
        aria-hidden="true"
        style={{
          display: 'block',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))',
          animation: 'lbHeartInnerPulse 2.2s ease-in-out infinite',
        }}
      >
        <defs>
          <linearGradient id="hgrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe8ee" />
            <stop offset="55%" stopColor="#ff9db0" />
            <stop offset="100%" stopColor="#ff3a57" />
          </linearGradient>
        </defs>
        <path
          d="M32 51c-1.2 0-2.5-.4-3.4-1.2C22.3 45.9 14 39.3 10.8 33.4 8.4 29 9 23.5 12.4 20.1c3.6-3.6 9.5-3.9 13.6-.8 1.5 1.1 2.8 2.6 4 4.5 1.2-1.9 2.5-3.4 4-4.5 4.1-3.1 10-2.8 13.6.8 3.4 3.4 4 8.9 1.6 13.3-3.2 5.9-11.5 12.5-17.8 16.4-.9.6-2.2 1.2-3.4 1.2z"
          fill="url(#hgrad)"
          stroke="rgba(0,0,0,.18)"
          strokeWidth="0.8"
        />
      </svg>

      {/* tiny spec highlight to sell the glass */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '26%',
          top: '22%',
          width: Math.round(S * 0.18),
          height: Math.round(S * 0.18),
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,255,255,.35) 55%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      <style jsx>{`
        @keyframes lbHeartSoftPulse {
          0%, 100% { opacity: .85; box-shadow: 0 0 0 1px rgba(255,70,100,.35), 0 0 14px rgba(255,50,80,.25); }
          50%      { opacity: 1;   box-shadow: 0 0 0 1px rgba(255,90,120,.55), 0 0 22px rgba(255,60,90,.35); }
        }
        @keyframes lbHeartInnerPulse {
          0%, 100% { filter: drop-shadow(0 1px 2px rgba(0,0,0,.45)) drop-shadow(0 0 0 rgba(255,70,100,0)); }
          50%      { filter: drop-shadow(0 1px 2px rgba(0,0,0,.45)) drop-shadow(0 0 6px rgba(255,70,100,.45)); }
        }
        button:hover {
          border-color: rgba(255,255,255,.22);
        }
        button:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(255,255,255,.28),
            0 8px 20px rgba(0,0,0,.35),
            inset 0 1px 0 rgba(255,255,255,.06) !important;
        }
      `}</style>
    </button>
  );
}
