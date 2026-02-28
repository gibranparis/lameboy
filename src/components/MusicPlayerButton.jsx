// src/components/MusicPlayerButton.jsx
// @ts-check
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * iPod-style music player button — top-left of the shop view.
 * Click opens an embedded YouTube playlist player at the top of the page.
 *
 * @param {{ playlistId?: string, size?: number, dayImgSrc?: string, nightImgSrc?: string }} props
 *   playlistId  — YouTube playlist ID (default: LaMEBOY playlist)
 *   size        — rendered image size in px (default 56)
 *   dayImgSrc   — iPod image for day mode
 *   nightImgSrc — iPod image for night mode
 */
export default function MusicPlayerButton({
  playlistId = 'PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd',
  size = 56,
  dayImgSrc = '/music/ipod classic day.png',
  nightImgSrc = '/music/ipod classic night.png',
}) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('day')
  const overlayRef = useRef(/** @type {HTMLDivElement|null} */ (null))

  // Sync with the day/night toggle
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'night' ? 'night' : 'day')
    const onThemeChange = (/** @type {any} */ e) => {
      setTheme(e.detail?.theme === 'night' ? 'night' : 'day')
    }
    document.addEventListener('theme-change', onThemeChange)
    return () => document.removeEventListener('theme-change', onThemeChange)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Close when clicking outside the player panel
  const handleOverlayClick = (/** @type {React.MouseEvent<HTMLDivElement>} */ e) => {
    if (e.target === overlayRef.current) setOpen(false)
  }

  const embedSrc = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&autoplay=1&color=white&fs=0&controls=0`
    : ''

  return (
    <>
      {/* iPod button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close music player' : 'Open music player'}
        title={open ? 'Close' : 'Play'}
        data-playing={open ? '1' : '0'}
        className="ipod-btn"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          display: 'block',
          lineHeight: 0,
        }}
      >
        <Image
          src={theme === 'night' ? nightImgSrc : dayImgSrc}
          alt={open ? 'Now playing' : 'Play music'}
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
      </button>

      {/* YouTube player panel — fixed, centered at top of page */}
      {open && embedSrc && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="yt-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Music player"
        >
          <div className="yt-panel">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="yt-close"
              aria-label="Close music player"
            >
              ×
            </button>
            <div className="yt-frame-wrap">
              <iframe
                src={embedSrc}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen={false}
                title="Music player"
                className="yt-frame"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ipod-btn {
          transition: transform 0.1s ease;
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

        /* ---- YouTube overlay ---- */
        .yt-overlay {
          position: fixed;
          inset: 0;
          z-index: 19999;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: calc(var(--header-ctrl, 64px) + 12px);
          background: transparent;
          pointer-events: none;
        }

        .yt-panel {
          pointer-events: all;
          position: relative;
          width: min(480px, calc(100vw - 24px));
          border-radius: 14px;
          overflow: hidden;
          background: #000;
          animation: yt-drop 260ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes yt-drop {
          from { opacity: 0; transform: translateY(-18px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }

        .yt-close {
          position: absolute;
          top: 8px;
          right: 10px;
          z-index: 2;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          font-size: 22px;
          line-height: 1;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.15s;
        }
        .yt-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* 16:9 aspect ratio wrapper — oversize iframe to crop black bars */
        .yt-frame-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          overflow: hidden;
        }

        .yt-frame {
          position: absolute;
          top: -8%;
          left: -8%;
          width: 116%;
          height: 116%;
          border: none;
          display: block;
        }
      `}</style>
    </>
  )
}
