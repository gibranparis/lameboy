// src/components/MusicPlayerButton.jsx
// @ts-check
'use client'

import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * @param {{ playlistId?: string, size?: number, dayImgSrc?: string, nightImgSrc?: string }} props
 */
export default function MusicPlayerButton({
  playlistId = 'PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd',
  size = 56,
  dayImgSrc = '/music/ipod classic day.png',
  nightImgSrc = '/music/ipod classic night.png',
}) {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [theme, setTheme] = useState('day')
  const [aspectPb, setAspectPb] = useState(56.25)
  // True when checkout/overlay is open — hide video but keep audio
  const [overlayOpen, setOverlayOpen] = useState(false)
  // Set after first commit so portal finds #yt-panel-anchor in DOM
  const [portalTarget, setPortalTarget] = useState(/** @type {Element|null} */ (null))

  const playerIdRef = useRef(/** @type {string} */ (''))
  if (!playerIdRef.current) playerIdRef.current = `yt${Math.floor(Math.random() * 1e9)}`
  const ytPlayerRef = useRef(/** @type {any} */ (null))
  const clickTimerRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))
  // If user clicks before onReady fires, queue the play for when it does
  const pendingPlayRef = useRef(false)

  // Theme sync
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'night' ? 'night' : 'day')
    const onChange = (/** @type {any} */ e) => setTheme(e.detail?.theme === 'night' ? 'night' : 'day')
    document.addEventListener('theme-change', onChange)
    return () => document.removeEventListener('theme-change', onChange)
  }, [])

  // Escape closes player + pauses
  useEffect(() => {
    if (!open) return
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        ytPlayerRef.current?.pauseVideo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Watch for checkout OR product overlay — hide panel visually but keep audio running
  useEffect(() => {
    const check = () => {
      const html = document.documentElement
      setOverlayOpen(
        html.hasAttribute('data-checkout-open') ||
        html.hasAttribute('data-overlay-open')
      )
    }
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-checkout-open', 'data-overlay-open'],
    })
    return () => obs.disconnect()
  }, [])

  // Grab portal anchor synchronously on mount — both elements are committed together
  useLayoutEffect(() => {
    setPortalTarget(document.getElementById('yt-panel-anchor'))
  }, [])

  // Pre-initialize the YouTube player as soon as the anchor div is in the DOM.
  // This is critical for mobile (iOS): playVideo() must be called synchronously
  // inside a user-gesture handler, which is only possible if the player already exists.
  useEffect(() => {
    if (!portalTarget) return

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
    let active = true
    const win = /** @type {any} */ (window)

    const initPlayer = () => {
      if (!active || !document.getElementById(playerIdRef.current) || !win.YT?.Player) return

      player = new win.YT.Player(playerIdRef.current, {
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 0,     // No auto-play — we call playVideo() on first user click
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
            ytPlayerRef.current = player
            // If the user clicked before the player was ready, honour that intent.
            // Note: on iOS this async path may still be blocked — the synchronous
            // path in handleClick is the reliable one.
            if (pendingPlayRef.current) {
              pendingPlayRef.current = false
              e.target.playVideo()
            }
            const data = e.target.getVideoData()
            if (data?.video_id) fetchAspectRatio(data.video_id)
          },
          onStateChange: (/** @type {any} */ e) => {
            const S = win.YT?.PlayerState
            if (e.data === S?.PLAYING) {
              setPlaying(true)
              const data = e.target.getVideoData()
              if (data?.video_id) fetchAspectRatio(data.video_id)
            } else if (e.data === S?.PAUSED || e.data === S?.ENDED) {
              setPlaying(false)
            }
          },
        },
      })
      ytPlayerRef.current = player
    }

    if (win.YT?.Player) {
      initPlayer()
    } else {
      const prev = win.onYouTubeIframeAPIReady
      win.onYouTubeIframeAPIReady = () => {
        if (!active) return
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
      active = false
      if (player) { try { player.destroy() } catch {} }
      ytPlayerRef.current = null
      setPlaying(false)
    }
  }, [playlistId, portalTarget]) // no 'open' — player lives independently of panel visibility

  // First click: open panel + play synchronously within the gesture (required on iOS).
  // Subsequent clicks when open: single = pause/resume, double = skip.
  const handleClick = () => {
    if (!open) {
      setOpen(true)
      if (ytPlayerRef.current) {
        // Synchronous call inside user gesture — this is what makes iOS work
        ytPlayerRef.current.playVideo()
      } else {
        // Player not ready yet (very fast first click); play when onReady fires
        pendingPlayRef.current = true
      }
      return
    }
    if (clickTimerRef.current) return
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      if (playing) {
        ytPlayerRef.current?.pauseVideo()
      } else {
        ytPlayerRef.current?.playVideo()
      }
    }, 220)
  }

  // Double-click: skip to next video
  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.nextVideo()
    } else {
      setOpen(true)
    }
  }

  // Tapping the video area pauses/resumes — user gesture, works on mobile
  const handleBlockerClick = () => {
    if (!ytPlayerRef.current) return
    if (playing) {
      ytPlayerRef.current.pauseVideo()
    } else {
      ytPlayerRef.current.playVideo()
    }
  }

  const panelClass = [
    'yt-panel',
    open ? 'yt-panel--open' : 'yt-panel--closed',
    overlayOpen ? 'yt-panel--overlay' : '',
  ].filter(Boolean).join(' ')

  const panel = (
    <div className={panelClass}>
      <div className="yt-wrap" style={{ paddingBottom: `${aspectPb}%` }}>
        {/* YT API replaces this div with an iframe */}
        <div id={playerIdRef.current} />
        {/* Intercepts YouTube hover UI; tap = play/pause */}
        <div className="yt-blocker" onClick={handleBlockerClick} />
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        aria-label={!open ? 'Open music player' : playing ? 'Pause music' : 'Resume music'}
        data-playing={playing ? '1' : '0'}
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
      </button>

      {/* Always portal when anchor exists — player stays alive across open/close */}
      {portalTarget && createPortal(panel, portalTarget)}

      {/* Scoped — iPod button only */}
      <style jsx>{`
        .ipod-btn { transition: transform 0.1s ease; }
        .ipod-btn:hover { transform: scale(1.06) translateY(-1px); }
        .ipod-btn:active { transform: scale(0.97); }
        .ipod-btn[data-playing='1'] { animation: ipod-float 2.4s ease-in-out infinite; }
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
      `}</style>

      {/* Global — panel lives outside component tree via portal */}
      <style jsx global>{`
        @keyframes yt-drop {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .yt-panel {
          width: min(480px, calc(100vw - 32px));
          background: #000;
          pointer-events: all;
        }
        /* Visible state */
        .yt-panel--open {
          animation: yt-drop 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        /* Collapsed — zero layout height, player iframe stays alive */
        .yt-panel--closed {
          height: 0;
          overflow: hidden;
          pointer-events: none;
        }
        /* Overlay open — hide visually but keep layout + audio */
        .yt-panel--overlay {
          opacity: 0;
          visibility: hidden;
          pointer-events: none !important;
        }
        .yt-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          transition: padding-bottom 0.35s ease;
        }
        .yt-wrap iframe {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: block !important;
        }
        .yt-blocker {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: all;
          cursor: pointer;
        }
      `}</style>
    </>
  )
}
