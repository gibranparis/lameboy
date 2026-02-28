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
 */
export default function MusicPlayerButton({
  playlistId = 'PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd',
  size = 56,
  dayImgSrc = '/music/ipod classic day.png',
  nightImgSrc = '/music/ipod classic night.png',
}) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('day')
  // aspect ratio as padding-bottom % (56.25 = 16:9, 75 = 4:3, etc.)
  const [aspectPb, setAspectPb] = useState(56.25)

  // Stable player container ID across renders
  const playerIdRef = useRef(/** @type {string} */ (''))
  if (!playerIdRef.current) playerIdRef.current = `yt${Math.floor(Math.random() * 1e9)}`
  const ytPlayerRef = useRef(/** @type {any} */ (null))

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

  // YouTube IFrame API — init player and auto-detect each video's aspect ratio
  useEffect(() => {
    if (!open) return

    // Fetch oEmbed to get actual width/height of the current video
    const fetchAspectRatio = async (/** @type {string} */ videoId) => {
      if (!videoId) return
      try {
        const r = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        )
        const d = await r.json()
        if (d.width && d.height) setAspectPb((d.height / d.width) * 100)
      } catch {}
    }

    let player = /** @type {any} */ (null)

    const win = /** @type {any} */ (window)

    const initPlayer = () => {
      if (!document.getElementById(playerIdRef.current) || !win.YT?.Player) return

      player = new win.YT.Player(playerIdRef.current, {
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          fs: 0,
          color: 'white',
          disablekb: 1,
        },
        events: {
          onReady: (/** @type {any} */ e) => {
            // Explicitly start playback — autoplay param alone isn't reliable
            e.target.playVideo()
            const data = e.target.getVideoData()
            if (data?.video_id) fetchAspectRatio(data.video_id)
          },
          onStateChange: (/** @type {any} */ e) => {
            // PLAYING = 1 — detect format whenever a new video starts
            if (e.data === win.YT?.PlayerState?.PLAYING) {
              const data = e.target.getVideoData()
              if (data?.video_id) fetchAspectRatio(data.video_id)
            }
          },
        },
      })
      ytPlayerRef.current = player
    }

    if (win.YT?.Player) {
      initPlayer()
    } else {
      // Chain onto any existing callback so we don't clobber other listeners
      const prev = win.onYouTubeIframeAPIReady
      win.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev()
        initPlayer()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      if (player) { try { player.destroy() } catch {} }
      ytPlayerRef.current = null
    }
  }, [open, playlistId])

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
      {open && (
        <div
          className="yt-overlay"
          onClick={(/** @type {any} */ e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="yt-panel">
            {/*
              yt-wrap: padding-bottom trick for aspect ratio.
              Transitions smoothly when aspectPb changes (e.g. 4:3 ↔ 16:9).
              YT API replaces #playerIdRef div with an <iframe>, which ends up
              as a direct child of yt-wrap → targeted via :global(.yt-wrap iframe).
            */}
            <div className="yt-wrap" style={{ paddingBottom: `${aspectPb}%` }}>
              <div id={playerIdRef.current} />
              {/* Transparent blocker — sits on top of the iframe, intercepts
                  mouse events so YouTube never shows Watch Later / Share overlays */}
              <div className="yt-blocker" />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ipod-btn {
          transition: transform 0.1s ease;
        }
        .ipod-btn:hover {
          transform: scale(1.06) translateY(-1px);
        }
        .ipod-btn:active {
          transform: scale(0.97);
        }
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
          .ipod-btn[data-playing='1'] { animation: none !important; }
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
          pointer-events: none;
        }

        .yt-panel {
          pointer-events: all;
          width: min(480px, calc(100vw - 24px));
          background: #000;
          animation: yt-drop 260ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes yt-drop {
          from { opacity: 0; transform: translateY(-18px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Aspect ratio container — padding-bottom animates when video format changes */
        .yt-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          transition: padding-bottom 0.35s ease;
        }

        /* YT API replaces the placeholder div with an iframe inside .yt-wrap */
        :global(.yt-wrap iframe) {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: block !important;
        }

        /* Intercepts all mouse events — prevents YouTube hover UI (Watch Later, Share, etc.) */
        .yt-blocker {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: all;
          cursor: default;
          background: transparent;
        }
      `}</style>
    </>
  )
}
