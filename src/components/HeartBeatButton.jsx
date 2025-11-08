// src/components/HeartBeatButton.jsx
'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Pure heart FAB — no circle background.
 * Positioning/z-index come from the passed className (e.g. "heart-submit").
 * This component itself does NOT set right/bottom so it won't fight your CSS.
 */
export default function HeartBeatButton({
  onClick,
  size = 44,                  // heart SVG size in px
  title = 'submit',
  ariaLabel = 'submit',
  style,
  className = '',             // pass "heart-submit" from caller
}) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!btnRef.current) return;
    // ensure no parent styles add a circle or border
    btnRef.current.style.background = 'transparent';
    btnRef.current.style.border = 'none';
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={[
        'hb',
        // Do NOT force positioning here; let .heart-submit handle it.
        // Keep interaction/visual basics only.
        'p-0 m-0 border-0 outline-none',
        'cursor-pointer select-none bg-transparent',
        'active:scale-[0.97]',
        className,
      ].join(' ')}
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform .08s ease',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* HEART ONLY — NO CIRCLE */}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        aria-hidden="true"
        className="lb-heart"
        style={{ display: 'block', pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="lbHeartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe8ee" />
            <stop offset="55%" stopColor="#ff9db0" />
            <stop offset="100%" stopColor="var(--banned-neon, #ff073a)" />
          </linearGradient>
        </defs>
        <path
          d="M32 51c-1.2 0-2.5-.4-3.4-1.2C22.3 45.9 14 39.3 10.8 33.4 8.4 29 9 23.5 12.4 20.1c3.6-3.6 9.5-3.9 13.6-.8 1.5 1.1 2.8 2.6 4 4.5 1.2-1.9 2.5-3.4 4-4.5 4.1-3.1 10-2.8 13.6.8 3.4 3.4 4 8.9 1.6 13.3-3.2 5.9-11.5 12.5-17.8 16.4-.9.6-2.2 1.2-3.4 1.2z"
          fill="url(#lbHeartGrad)"
        />
      </svg>

      <style jsx>{`
        .lb-heart {
          animation: lbBeat 1.15s ease-in-out infinite;
          filter:
            drop-shadow(0 0 6px var(--heart-neon, #ff2a4f))
            drop-shadow(0 0 14px var(--heart-neon, #ff2a4f));
        }
        @keyframes lbBeat {
          0%, 100% { transform: scale(1); }
          15%      { transform: scale(1.12); }
          30%      { transform: scale(1.03); }
          45%      { transform: scale(1.14); }
          60%      { transform: scale(1.02); }
          75%      { transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-heart { animation: none; }
        }

        /* focus ring for keyboard users */
        .hb:focus-visible {
          outline: 2px solid rgba(255, 255, 255, .85);
          outline-offset: 4px;
          border-radius: 12px;
        }
        :global(html[data-theme="day"]) .hb:focus-visible {
          outline-color: rgba(0, 0, 0, .85);
        }
      `}</style>
    </button>
  );
}
