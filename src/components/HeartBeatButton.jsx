// src/components/HeartBeatButton.jsx
// @ts-check
'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'

/**
 * Pure heart FAB — no circle background.
 * Positioning/z-index come from the passed className (e.g. "heart-submit").
 * This component itself does NOT set right/bottom so it won't fight your CSS.
 */
export default function HeartBeatButton({
  onClick,
  size = 44, // heart SVG size in px
  title = 'submit',
  ariaLabel = 'submit',
  className = '', // pass "heart-submit" from caller
  style,
  bpm = 66, // base beats per minute (controls pulse speed)
  boostMs = 520, // how long the temporary boost lasts
  pauseOnOverlay = false, // set true if you want to freeze while overlay open
}) {
  const btnRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [boosted, setBoosted] = useState(false)

  // clamp BPM and compute period
  const clampedBpm = Math.min(140, Math.max(40, bpm | 0))
  const beatMs = useMemo(() => 60000 / clampedBpm, [clampedBpm])

  useEffect(() => {
    if (!btnRef.current) return
    // harden against inherited backgrounds/borders
    btnRef.current.style.background = 'transparent'
    btnRef.current.style.border = 'none'
  }, [])

  // Visibility pause to avoid janky catch-up when tab returns
  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Optional overlay pause (listen for your existing event)
  useEffect(() => {
    if (!pauseOnOverlay) return
    const onOpen = () => setPaused(true)
    const onClose = () => setPaused(false)
    document.addEventListener('lb:overlay-open', onOpen)
    document.addEventListener('lb:overlay-close', onClose)
    return () => {
      document.removeEventListener('lb:overlay-open', onOpen)
      document.removeEventListener('lb:overlay-close', onClose)
    }
  }, [pauseOnOverlay])

  // External boost hook: dispatch new CustomEvent('lb:heart:boost')
  useEffect(() => {
    let to = 0
    const onBoost = () => {
      setBoosted(true)
      clearTimeout(to)
      to = window.setTimeout(() => setBoosted(false), boostMs)
    }
    document.addEventListener('lb:heart:boost', onBoost)
    return () => {
      document.removeEventListener('lb:heart:boost', onBoost)
      clearTimeout(to)
    }
  }, [boostMs])

  // Local hover/click micro-boost
  const microBoost = () => {
    setBoosted(true)
    window.setTimeout(() => setBoosted(false), Math.min(360, boostMs))
  }

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={e => {
        microBoost()
        onClick?.(e)
      }}
      onMouseDown={microBoost}
      onMouseEnter={microBoost}
      className={[
        'hb',
        'p-0 m-0 border-0 outline-none',
        'cursor-pointer select-none bg-transparent',
        'active:scale-[0.98]',
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
        data-paused={paused ? '1' : '0'}
        data-boost={boosted ? '1' : '0'}
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
          --hb-duration: ${beatMs}ms; /* base tempo from bpm */
          --hb-scale-a: 1.1; /* first thump */
          --hb-scale-b: 1.04; /* aftershock */
          --hb-glow1: var(--heart-neon, #ff2a4f);
          --hb-glow2: rgba(255, 42, 79, 0.55);

          /* Tighter glow: no big red bubble, just a crisp neon edge */
          filter: drop-shadow(0 0 6px var(--hb-glow1)) drop-shadow(0 0 12px var(--hb-glow2));

          animation: lbBeat var(--hb-duration) ease-in-out infinite;
          transform-origin: 50% 58%;
        }

        /* Boost = slightly faster & a hair brighter, no oversized scale */
        .lb-heart[data-boost='1'] {
          --hb-duration: calc(${beatMs}ms * 0.82);
          filter: drop-shadow(0 0 7px var(--hb-glow1)) drop-shadow(0 0 16px var(--hb-glow2));
        }

        /* Pause animation cleanly (visibility or overlay) */
        .lb-heart[data-paused='1'] {
          animation-play-state: paused;
          filter: drop-shadow(0 0 4px var(--hb-glow1)) drop-shadow(0 0 8px var(--hb-glow2));
        }

        @keyframes lbBeat {
          0%,
          100% {
            transform: scale(1);
          }
          16% {
            transform: scale(var(--hb-scale-a));
          }
          32% {
            transform: scale(1.02);
          }
          48% {
            transform: scale(var(--hb-scale-b));
          }
          64% {
            transform: scale(1.01);
          }
          80% {
            transform: scale(1.03);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lb-heart {
            animation: none !important;
          }
        }

        /* keyboard focus ring */
        .hb:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.9);
          outline-offset: 4px;
          border-radius: 12px;
        }
        :global(html[data-theme='day']) .hb:focus-visible {
          outline-color: rgba(0, 0, 0, 0.9);
        }
      `}</style>
    </button>
  )
}
