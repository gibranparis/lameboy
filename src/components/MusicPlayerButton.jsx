// src/components/MusicPlayerButton.jsx
// @ts-check
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * iPod-style music player button — top-left of the shop view.
 * Image: place your iPod PNG at /public/music/ipod.png
 *
 * @param {{ src?: string, size?: number, imgSrc?: string }} props
 *   src    — URL of the audio file to play (e.g. "/music/track.mp3")
 *   size   — rendered image size in px (default 56)
 *   imgSrc — iPod image path (default "/music/ipod.png")
 */
export default function MusicPlayerButton({
  src = '',
  size = 56,
  imgSrc = '/music/ipod classic day.png',
}) {
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

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause music' : 'Play music'}
        title={playing ? 'Pause' : 'Play'}
        data-playing={playing ? '1' : '0'}
        className="ipod-btn"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: src ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          display: 'block',
          lineHeight: 0,
        }}
      >
        <Image
          src={imgSrc}
          alt={playing ? 'Now playing' : 'Play music'}
          width={size}
          height={Math.round(size * 1.22)}
          style={{
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          priority
        />

        {src && (
          <audio ref={audioRef} src={src} loop preload="none" style={{ display: 'none' }} />
        )}
      </button>

      <style jsx>{`
        .ipod-btn {
          transition: transform 0.1s ease;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.22));
        }

        /* Paused — subtle lift on hover */
        .ipod-btn:hover {
          transform: scale(1.06) translateY(-1px);
        }
        .ipod-btn:active {
          transform: scale(0.97);
        }

        /* Playing — gentle floating bob */
        .ipod-btn[data-playing='1'] {
          animation: ipod-float 2.4s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))
                  drop-shadow(0 0 18px rgba(180, 200, 255, 0.25));
        }
        .ipod-btn[data-playing='1']:hover {
          animation-play-state: paused;
          transform: scale(1.06) translateY(-2px);
        }

        @keyframes ipod-float {
          0%   { transform: translateY(0px) rotate(-0.5deg); }
          30%  { transform: translateY(-5px) rotate(0.5deg); }
          60%  { transform: translateY(-2px) rotate(-0.3deg); }
          100% { transform: translateY(0px) rotate(-0.5deg); }
        }

        .ipod-btn:focus-visible {
          outline: 2px solid rgba(0, 0, 0, 0.6);
          outline-offset: 6px;
          border-radius: 6px;
        }
        :global(html[data-theme='night']) .ipod-btn:focus-visible {
          outline-color: rgba(255, 255, 255, 0.7);
        }

        @media (prefers-reduced-motion: reduce) {
          .ipod-btn[data-playing='1'] {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
