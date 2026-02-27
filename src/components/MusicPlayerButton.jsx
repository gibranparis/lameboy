// src/components/MusicPlayerButton.jsx
// @ts-check
'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Floating music player button — top-left of the shop view.
 * Shows animated equalizer bars while playing, static note when paused.
 *
 * @param {{ src?: string, size?: number }} props
 *   src  — URL of the audio file to play (add your track to /public and reference it here)
 *   size — button hit-area size in px (default 44)
 */
export default function MusicPlayerButton({ src = '', size = 44 }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(/** @type {HTMLAudioElement|null} */ (null))

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio || !src) return
    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }

  const iconSize = Math.round(size * 0.75)

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause music' : 'Play music'}
        title={playing ? 'Pause' : 'Play'}
        className="music-btn"
        style={{
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: src ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
        }}
      >
        <svg
          viewBox="0 0 36 36"
          width={iconSize}
          height={iconSize}
          aria-hidden="true"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {playing ? (
            /* Equalizer bars — animate when playing */
            <g className="eq-bars" transform="translate(4, 4)">
              <rect className="bar bar1" x="0" y="0" width="5" height="28" rx="2.5" />
              <rect className="bar bar2" x="9" y="0" width="5" height="28" rx="2.5" />
              <rect className="bar bar3" x="18" y="0" width="5" height="28" rx="2.5" />
            </g>
          ) : (
            /* Music note — static when paused */
            <g transform="translate(5, 3)" opacity="0.85">
              {/* Note head */}
              <ellipse cx="7" cy="26" rx="6" ry="4.5" />
              {/* Stem */}
              <rect x="12" y="4" width="2.5" height="22" rx="1.25" />
              {/* Flag */}
              <path d="M14.5 4 C20 6, 24 10, 22 18 C20 14, 17 11, 14.5 10 Z" />
            </g>
          )}
        </svg>

        {src && (
          <audio ref={audioRef} src={src} loop preload="none" style={{ display: 'none' }} />
        )}
      </button>

      <style jsx>{`
        .music-btn {
          transition: transform 0.08s ease, opacity 0.15s ease;
          opacity: ${src ? '1' : '0.35'};
        }
        .music-btn:hover {
          transform: scale(1.08);
        }
        .music-btn:active {
          transform: scale(0.96);
        }
        .music-btn:focus-visible {
          outline: 2px solid rgba(0, 0, 0, 0.7);
          outline-offset: 4px;
          border-radius: 8px;
        }
        :global(html[data-theme='night']) .music-btn:focus-visible {
          outline-color: rgba(255, 255, 255, 0.8);
        }

        /* Icon fill — theme-aware */
        svg rect,
        svg ellipse,
        svg path {
          fill: #111;
          filter: drop-shadow(0 0 2px rgba(0,0,0,0.18));
        }
        :global(html[data-theme='night']) svg rect,
        :global(html[data-theme='night']) svg ellipse,
        :global(html[data-theme='night']) svg path {
          fill: #fff;
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.3));
        }

        /* Equalizer bar animation */
        .bar {
          transform-origin: center bottom;
          transform-box: fill-box;
        }
        .bar1 {
          animation: eq1 0.7s ease-in-out infinite alternate;
        }
        .bar2 {
          animation: eq2 0.55s ease-in-out infinite alternate;
          animation-delay: 0.12s;
        }
        .bar3 {
          animation: eq3 0.65s ease-in-out infinite alternate;
          animation-delay: 0.24s;
        }

        @keyframes eq1 {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes eq2 {
          0%   { transform: scaleY(0.6); }
          100% { transform: scaleY(0.2); }
        }
        @keyframes eq3 {
          0%   { transform: scaleY(0.9); }
          100% { transform: scaleY(0.4); }
        }

        @media (prefers-reduced-motion: reduce) {
          .bar1, .bar2, .bar3 {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
