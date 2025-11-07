// src/components/HeartBeatButton.jsx
'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Bottom-right floating heart (no background circle).
 * - Safe-area aware (right/bottom)
 * - Pure heart SVG with neon glow + heartbeat
 * - No dependency on global styles
 */
export default function HeartBeatButton({
  onClick,
  size = 44,                  // pure heart pixel size
  title = 'submit',
  ariaLabel = 'submit',
  style,
  className = '',
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
        // fixed FAB at bottom-right
        'fixed z-[10010]',
        'p-0 m-0 border-0 outline-none',
        'cursor-pointer select-none bg-transparent',
        'active:scale-[0.97]',
        className,
      ].join(' ')}
      style={{
        // position with safe-area + runner height buffer
        right: `calc(16px + env(safe-area-inset-right, 0px))`,
        bottom: `calc(16px + var(--runner-h, 10px) + env(safe-area-inset-bottom, 0px))`,
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform .08s ease',
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
        style={{ display: 'block' }}
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
      `}</style>
    </button>
  );
}
