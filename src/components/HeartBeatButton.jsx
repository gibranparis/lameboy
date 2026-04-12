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
  mode = 'heart', // 'heart' | 'close'
}) {
  const btnRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [boosted, setBoosted] = useState(false)
  const [isNight, setIsNight] = useState(false)

  useEffect(() => {
    const onTheme = (e) => setIsNight(e?.detail?.theme === 'night')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    setIsNight(document.documentElement.dataset.theme === 'night')
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

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
      {mode === 'close' ? (
        /* X icon for closing cart */
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          aria-hidden="true"
          className="lb-close"
          style={{ display: 'block', pointerEvents: 'none' }}
        >
          <line x1="18" y1="18" x2="46" y2="46" stroke="#ff9db0" strokeWidth="4" strokeLinecap="round" />
          <line x1="46" y1="18" x2="18" y2="46" stroke="#ff9db0" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : (
        /* HEART ONLY — NO CIRCLE */
        <img
          src="/human heart zero.png"
          width={size}
          height={size}
          aria-hidden="true"
          className="lb-heart"
          data-paused={paused ? '1' : '0'}
          data-boost={boosted ? '1' : '0'}
          style={{ display: 'block', pointerEvents: 'none', ...(isNight ? { filter: 'brightness(0) invert(1)' } : {}) }}
          alt="heart"
        />
      )}

      <style jsx>{`
        .lb-heart {
          --hb-duration: ${beatMs}ms; /* base tempo from bpm */
          --hb-scale-a: 1.05; /* first thump - more subtle */
          --hb-scale-b: 1.02; /* aftershock - more subtle */

          animation: lbBeat var(--hb-duration) ease-in-out infinite;
          transform-origin: 50% 58%;
        }

        /* Boost = slightly faster & a hair brighter, no oversized scale */
        .lb-heart[data-boost='1'] {
          --hb-duration: calc(${beatMs}ms * 0.82);
        }

        /* Pause animation cleanly (visibility or overlay) */
        .lb-heart[data-paused='1'] {
          animation-play-state: paused;
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
            transform: scale(1.01);
          }
          48% {
            transform: scale(var(--hb-scale-b));
          }
          64% {
            transform: scale(1.005);
          }
          80% {
            transform: scale(1.015);
          }
        }

        .lb-close {
          filter: drop-shadow(0 0 3px #ff2a4f) drop-shadow(0 0 6px rgba(255, 42, 79, 0.55));
          transition: transform 0.15s ease;
        }
        .hb:hover .lb-close {
          transform: rotate(90deg) scale(1.1);
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
