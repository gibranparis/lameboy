// src/components/MusicPlayerButton.jsx
// @ts-check
'use client'

import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { attachDragSnap, pinball, GRID_MOVED } from '@/lib/dragSnap'
import { haptic } from '@/lib/haptics'

// YouTube flashes its title bar / "More videos" panel for a moment after
// playback resumes, so the cover stays up this long past PLAYING
const UNCOVER_DELAY_MS = 150
// The iPod's pop-out controls (back, play / pause, forward): round pills like
// the cart's size pills, stacked under the iPod
const CTRL_PILL = 30
const CTRL_GAP = 8
const CTRL_EDGE = 8
// The video's size once resized (px wide), remembered on this device
const VIDEO_W_KEY = 'lb:video-w'
/** Never smaller than a thumbnail, never wider than the screen */
const clampVideoW = (/** @type {number} */ w) =>
  Math.round(Math.max(160, Math.min(w, typeof window === 'undefined' ? 960 : Math.min(1000, window.innerWidth - 16))))

/**
 * @param {{ playlistId?: string, size?: number, dayImgSrc?: string, nightImgSrc?: string }} props
 */
export default function MusicPlayerButton({
  playlistId = 'PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd',
  size = 56,
  dayImgSrc = '/music/ipod classic day.png',
  nightImgSrc = '/music/ipod classic night.png',
  autoOpen = false, // true once the splash has cleared into the shop
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
  // Ref on the panel div — used by ResizeObserver to track player height
  const panelRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  // Resized by the corner handle, a pinch or ⌘ / ctrl + scroll (px; null:
  // its usual size). Remembered on this device.
  const [videoW, setVideoW] = useState(/** @type {number|null} */ (null))
  // The pop-out controls while they're out: where the column sits, and the
  // iPod's centre they pop out of (null: tucked away)
  const ipodBtnRef = useRef(/** @type {HTMLButtonElement|null} */ (null))
  const [controls, setControls] = useState(/** @type {null | { left: number, top: number, cx: number, cy: number, key: number }} */ (null))
  const controlsRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  // Poster over the iframe whenever it isn't playing, so YouTube's paused /
  // buffering / end-screen UI never shows. Shows the current video's thumbnail.
  const [covered, setCovered] = useState(true)
  const [posterId, setPosterId] = useState('')
  const coverTimerRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))

  // Cover goes up at once; it comes down only once PLAYING has settled
  const coverFor = (/** @type {boolean} */ isPlaying) => {
    if (coverTimerRef.current) clearTimeout(coverTimerRef.current)
    coverTimerRef.current = null
    if (isPlaying) {
      coverTimerRef.current = setTimeout(() => setCovered(false), UNCOVER_DELAY_MS)
    } else {
      setCovered(true)
    }
  }

  // The YT.Player object exists from the moment it's created, but its
  // methods (playVideo, …) only arrive once YouTube has loaded it; calling
  // one before then throws and took the whole page down
  const playerReady = () => typeof ytPlayerRef.current?.playVideo === 'function'

  // Cover before pausing — the PAUSED event lands a beat after YouTube
  // has already drawn its paused UI
  const pause = () => {
    coverFor(false)
    if (playerReady()) ytPlayerRef.current.pauseVideo()
  }

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
        pause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // lb:reset closes player + pauses
  useEffect(() => {
    const onReset = () => {
      setOpen(false)
      pause()
    }
    window.addEventListener('lb:reset', onReset)
    return () => window.removeEventListener('lb:reset', onReset)
  }, [])


  // Watch for product overlay — hide panel visually but keep audio running.
  // Checkout open is intentionally excluded: let the panel fade naturally with the backdrop.
  useEffect(() => {
    const check = () => {
      const html = document.documentElement
      setOverlayOpen(html.hasAttribute('data-overlay-open'))
    }
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-overlay-open'],
    })
    return () => obs.disconnect()
  }, [])

  // Grab portal anchor synchronously on mount — both elements are committed together
  useLayoutEffect(() => {
    setPortalTarget(document.getElementById('yt-panel-anchor'))
  }, [])

  // Broadcast panel height as --yt-panel-h so <main> can clip content behind the player.
  // Depends on portalTarget: panelRef.current is null until the portal first renders.
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const h = entry?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight
      document.documentElement.style.setProperty('--yt-panel-h', `${Math.round(h)}px`)
    })
    obs.observe(el)
    return () => {
      obs.disconnect()
      document.documentElement.style.setProperty('--yt-panel-h', '0px')
    }
  }, [portalTarget]) // re-run once portal is in DOM so panelRef.current is set

  // The player opens as the splash clears into the shop and starts playing
  // (browsers may hold the sound until the first tap; the poster shows meanwhile)
  useEffect(() => {
    if (!autoOpen) return
    setOpen(true)
    if (playerReady()) {
      if (!playing) ytPlayerRef.current.playVideo()
    } else {
      pendingPlayRef.current = true // played as soon as the player is ready
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen])

  // Drag the video anywhere and it stays there, still playing, and it opens
  // there again after being closed (its own spot, never under a moved iPod).
  // A tap on it plays / pauses and sends it home; a tap on open space or the
  // grid folding into stacks does too. Flicked, it pinballs home on its own.
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    // While it's lifted or parked away from home its anchor goes see-through
    // (dragSnap lifts the anchor to the top layer: last dragged wins)
    const anchor = portalTarget
    const onLift = (/** @type {boolean} */ lifted) => {
      if (!anchor) return
      if (lifted) anchor.setAttribute('data-video-lifted', '1')
      else anchor.removeAttribute('data-video-lifted')
    }
    const detach = attachDragSnap(el, {
      touchAction: 'none',
      onLift,
      fling: pinball,
      ring: false, // no ring of clones for the video
      ignore: '.yt-resize', // the corner handle resizes it instead
    })
    return () => {
      detach()
      onLift(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalTarget])

  // Resizing: the corner handle, a two-finger pinch on it, or ⌘ / ctrl +
  // scroll. It stays the shape of the video; the grid re-centres under it
  // (its height feeds --yt-panel-h).
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(VIDEO_W_KEY))
      if (saved > 0) setVideoW(clampVideoW(saved))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      if (videoW) localStorage.setItem(VIDEO_W_KEY, String(Math.round(videoW)))
      else localStorage.removeItem(VIDEO_W_KEY)
    } catch {}
  }, [videoW])
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const widthNow = () => el.getBoundingClientRect().width
    const onWheel = (/** @type {WheelEvent} */ e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setVideoW(clampVideoW(widthNow() * Math.exp(-e.deltaY * 0.003)))
    }
    // Two fingers on it: pinch its size (dragSnap lets go of the drag)
    let pinch = /** @type {null | { d: number, w: number }} */ (null)
    const dist = (/** @type {TouchList} */ t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onTouchStart = (/** @type {TouchEvent} */ e) => {
      if (e.touches.length === 2) pinch = { d: dist(e.touches), w: widthNow() }
    }
    const onTouchMove = (/** @type {TouchEvent} */ e) => {
      if (!pinch || e.touches.length !== 2) return
      if (e.cancelable) e.preventDefault()
      setVideoW(clampVideoW(pinch.w * (dist(e.touches) / pinch.d)))
    }
    const onTouchEnd = (/** @type {TouchEvent} */ e) => {
      if (e.touches.length < 2) pinch = null
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [portalTarget])

  // The corner handle: drag it out to grow the video, in to shrink it
  // (sideways counts double, as the video grows from its middle); a
  // double-tap puts it back to its usual size
  const resizeRef = useRef(/** @type {null | { id: number, x: number, y: number, w: number }} */ (null))
  const onResizeDown = (/** @type {React.PointerEvent<HTMLDivElement>} */ e) => {
    e.stopPropagation()
    const el = panelRef.current
    if (!el) return
    resizeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, w: el.getBoundingClientRect().width }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }
  const onResizeMove = (/** @type {React.PointerEvent<HTMLDivElement>} */ e) => {
    const r = resizeRef.current
    if (!r || r.id !== e.pointerId) return
    e.stopPropagation()
    const fromX = 2 * (e.clientX - r.x)
    const fromY = (e.clientY - r.y) / (aspectPb / 100)
    setVideoW(clampVideoW(r.w + (Math.abs(fromX) > Math.abs(fromY) ? fromX : fromY)))
  }
  const onResizeUp = (/** @type {React.PointerEvent<HTMLDivElement>} */ e) => {
    if (resizeRef.current?.id !== e.pointerId) return
    e.stopPropagation()
    resizeRef.current = null
  }

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
            // Strip the iframe's native fullscreen capability outright —
            // fs:0 alone doesn't stop iOS Safari from taking a played
            // video fullscreen (e.g. on a double-tap), which exposes
            // YouTube's own title/controls. No allowfullscreen = no way in.
            try {
              const iframe = document.getElementById(playerIdRef.current)
              if (iframe && iframe.tagName === 'IFRAME') {
                iframe.removeAttribute('allowfullscreen')
                iframe.setAttribute('webkit-playsinline', '1')
                iframe.setAttribute('playsinline', '1')
                const allow = (iframe.getAttribute('allow') || '')
                  .split(';')
                  .map((s) => s.trim())
                  .filter((s) => s && !s.toLowerCase().startsWith('fullscreen'))
                  .join('; ')
                iframe.setAttribute('allow', allow)
              }
            } catch {}
            // Pick a random starting track so each page load begins on a different song
            const list = e.target.getPlaylist()
            const randomIdx = (list && list.length > 1)
              ? Math.floor(Math.random() * list.length)
              : 0
            // If the user clicked before the player was ready, honour that intent.
            // Note: on iOS this async path may still be blocked — the synchronous
            // path in handleClick is the reliable one.
            if (pendingPlayRef.current) {
              pendingPlayRef.current = false
              e.target.playVideoAt(randomIdx)
            } else if (randomIdx > 0) {
              e.target.cuePlaylist({ list: playlistId, listType: 'playlist', index: randomIdx })
            }
            const data = e.target.getVideoData()
            if (data?.video_id) {
              fetchAspectRatio(data.video_id)
              setPosterId(data.video_id)
            }
          },
          onStateChange: (/** @type {any} */ e) => {
            const S = win.YT?.PlayerState
            coverFor(e.data === S?.PLAYING)
            // Keep the poster on whatever is loaded (track changes, random cue)
            const vid = e.target.getVideoData?.()?.video_id
            if (vid) setPosterId(vid)
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
      if (coverTimerRef.current) clearTimeout(coverTimerRef.current)
      coverTimerRef.current = null
      setCovered(true)
    }
  }, [playlistId, portalTarget]) // no 'open' — player lives independently of panel visibility

  // The controls pop out of the iPod into a column under it (over it when
  // the iPod is near the bottom), kept on screen
  const showControls = () => {
    const r = ipodBtnRef.current?.getBoundingClientRect()
    if (!r) return
    const colH = 3 * CTRL_PILL + 2 * CTRL_GAP
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const below = r.bottom + CTRL_GAP
    const top = below + colH <= window.innerHeight - CTRL_EDGE ? below : Math.max(CTRL_EDGE, r.top - CTRL_GAP - colH)
    const left = Math.max(CTRL_EDGE, Math.min(window.innerWidth - CTRL_EDGE - CTRL_PILL, cx - CTRL_PILL / 2))
    setControls({ left, top, cx, cy, key: Date.now() })
  }

  // Single click: opens the player, starts the music and pops the controls
  // out. With the player open, it brings the controls back out, or, when
  // they're already out, tucks them away and hides the player (the music
  // keeps playing; tap the video to pause). Opening plays right away, inside
  // the tap, which iOS needs; the rest waits a beat so a double-click can
  // still skip a track instead.
  const handleClick = () => {
    if (clickTimerRef.current) return // second click of a double-click
    if (!open) {
      setOpen(true)
      if (playerReady()) {
        if (!playing) ytPlayerRef.current.playVideo()
      } else {
        // Player not ready yet (very fast first click); play when onReady fires
        pendingPlayRef.current = true
      }
      showControls()
      clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null }, 220)
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      if (controls) {
        setControls(null)
        setOpen(false)
      } else {
        showControls()
      }
    }, 220)
  }

  // The controls themselves: back, play / pause, forward. They stay out
  // (skip as many tracks as you like) until something else is touched.
  const onControl = (/** @type {'prev' | 'toggle' | 'next'} */ what) => {
    haptic(6)
    if (what === 'toggle') {
      if (playing) pause()
      else if (playerReady()) ytPlayerRef.current.playVideo()
      else pendingPlayRef.current = true
      return
    }
    if (!playerReady()) return
    if (what === 'prev') ytPlayerRef.current.previousVideo()
    else ytPlayerRef.current.nextVideo()
  }

  // Anything else on the page pressed (or the iPod itself dragged away), the
  // grid moved, Escape, or the player closed: the controls tuck back in
  useEffect(() => {
    if (!controls) return
    let press = /** @type {null | { id: number, x: number, y: number }} */ (null)
    const onDown = (/** @type {PointerEvent} */ e) => {
      const t = /** @type {Node} */ (e.target)
      if (controlsRef.current?.contains(t)) return
      if (ipodBtnRef.current?.contains(t)) {
        press = { id: e.pointerId, x: e.clientX, y: e.clientY }
        return
      }
      setControls(null)
    }
    const onMove = (/** @type {PointerEvent} */ e) => {
      if (press && press.id === e.pointerId && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) {
        press = null
        setControls(null)
      }
    }
    const onUp = () => { press = null }
    const hide = () => setControls(null)
    const onKey = (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Escape') hide() }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener(GRID_MOVED, hide)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener(GRID_MOVED, hide)
      window.removeEventListener('keydown', onKey)
    }
  }, [controls])
  useEffect(() => { if (!open) setControls(null) }, [open])

  // Double-click: skip to next video
  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    if (playerReady()) {
      ytPlayerRef.current.nextVideo()
    } else {
      setOpen(true)
    }
  }

  // Tapping the video area pauses/resumes — user gesture, works on mobile
  const handleBlockerClick = () => {
    if (!playerReady()) return
    if (playing) {
      pause()
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
    <div ref={panelRef} className={panelClass} style={videoW ? { width: videoW } : undefined}>
      <div className="yt-wrap" style={{ paddingBottom: `${aspectPb}%` }}>
        {/* YT API replaces this div with an iframe */}
        <div id={playerIdRef.current} />
        {/* Poster while not playing — hides YouTube's pause / resume UI */}
        <div
          className={covered ? 'yt-cover yt-cover--on' : 'yt-cover'}
          style={posterId ? { backgroundImage: `url(https://i.ytimg.com/vi/${posterId}/hqdefault.jpg)` } : undefined}
        />
        {/* Intercepts YouTube hover UI; tap = play/pause */}
        <div className="yt-blocker" onClick={handleBlockerClick} />
        {/* Corner handle: drag to resize, double-tap for the usual size */}
        <div
          className="yt-resize"
          role="slider"
          aria-label="Resize video"
          aria-valuenow={Math.round(videoW ?? 0)}
          title="Drag to resize · double-tap to reset"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
          onDoubleClick={(e) => { e.stopPropagation(); setVideoW(null) }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={ipodBtnRef}
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        aria-label={open ? 'Hide player' : 'Show player'}
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

      {/* Pop-out controls: back, play / pause, forward */}
      {controls && createPortal(
        <div
          ref={controlsRef}
          key={controls.key}
          className="ipod-ctrls"
          role="group"
          aria-label="Music controls"
          style={{ left: controls.left, top: controls.top }}
        >
          {/** @type {const} */ (['prev', 'toggle', 'next']).map((what, i) => {
            // Each pill pops out of the iPod's centre into its slot
            const slotX = controls.left + CTRL_PILL / 2
            const slotY = controls.top + i * (CTRL_PILL + CTRL_GAP) + CTRL_PILL / 2
            const label = what === 'prev' ? 'Previous track' : what === 'next' ? 'Next track' : playing ? 'Pause' : 'Play'
            return (
              <button
                key={what}
                type="button"
                className={`ipod-ctrl ${what === 'toggle' && playing ? 'is-on' : ''}`}
                aria-label={label}
                title={label}
                onClick={() => onControl(what)}
                style={/** @type {any} */ ({
                  '--fx': `${controls.cx - slotX}px`,
                  '--fy': `${controls.cy - slotY}px`,
                  animationDelay: `${i * 36}ms`,
                })}
              >
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  {what === 'prev' && <path d="M3 3h2v10H3zM13 3v10L6 8z" fill="currentColor" />}
                  {what === 'next' && <path d="M11 3h2v10h-2zM3 3v10l7-5z" fill="currentColor" />}
                  {what === 'toggle' && (playing
                    ? <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
                    : <path d="M4.5 2.5v11L13 8z" fill="currentColor" />)}
                </svg>
              </button>
            )
          })}
        </div>,
        document.body
      )}

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
        /* Pop-out controls, styled like the cart's size pills */
        .ipod-ctrls {
          position: fixed;
          display: flex;
          flex-direction: column;
          gap: ${CTRL_GAP}px;
          z-index: 2147483002; /* with the other pop-ups, above the dragged video */
        }
        .ipod-ctrl {
          width: ${CTRL_PILL}px;
          height: ${CTRL_PILL}px;
          padding: 0;
          border: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: #fff;
          color: #0f1115;
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.14),
            inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          -webkit-tap-highlight-color: transparent;
          transition: background 0.12s ease, color 0.12s ease, transform 0.08s ease;
          animation: ipod-ctrl-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        :global(:root[data-theme='night']) .ipod-ctrl {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.14),
            inset 0 0 0 1px rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .ipod-ctrl:hover,
        .ipod-ctrl.is-on {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow:
            inset 0 0 0 1px rgba(0, 0, 0, 0.18),
            0 2px 10px rgba(0, 0, 0, 0.12);
        }
        .ipod-ctrl:active { transform: scale(0.9); }
        .ipod-ctrl:focus-visible {
          outline: 2px solid rgba(0, 0, 0, 0.6);
          outline-offset: 3px;
        }
        @keyframes ipod-ctrl-pop {
          from { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(0.2); }
          to { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ipod-ctrl { animation: none; }
        }
      `}</style>

      {/* Global — panel lives outside component tree via portal */}
      <style jsx global>{`
        @keyframes yt-drop {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .yt-panel {
          position: relative; /* so it can rise above the grid while dragged */
          width: min(480px, calc(100vw - 2 * var(--header-ctrl, 64px)));
          background: #000;
          pointer-events: all;
          /* Soft rounded corners, floating just above the page */
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12);
        }
        /* At night the black letterbox meets a black page: a faint rim and
           glow keep its rounded shape */
        html[data-theme='night'] .yt-panel {
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14), 0 10px 32px rgba(255, 255, 255, 0.06);
        }
        /* Visible state */
        .yt-panel--open {
          animation: yt-drop 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        /* Collapsed — zero layout height, player iframe stays alive (and
           no shadow, or a faint smudge sits under the header) */
        .yt-panel--closed {
          height: 0;
          overflow: hidden;
          pointer-events: none;
          box-shadow: none;
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
          border-radius: inherit;
          /* Safari doesn't always clip a playing iframe to rounded corners
             without its own compositing layer */
          isolation: isolate;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          transition: padding-bottom 0.35s ease;
        }
        .yt-wrap iframe {
          /* YouTube's own buttons never get a touch; the blocker on top
             takes taps and drags (play/pause only) */
          pointer-events: none !important;
          position: absolute !important;
          /* 60px taller top and bottom: the video still fits the width
             exactly, but YouTube's title bar and corner logo sit in the
             letterbox, outside the wrap's overflow */
          top: -60px !important;
          left: 0 !important;
          width: 100% !important;
          height: calc(100% + 120px) !important;
          border: none !important;
          display: block !important;
        }
        .yt-cover {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: #000 center / cover no-repeat;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        /* Snaps on with no fade, so nothing of YouTube's UI shows first */
        .yt-cover--on {
          opacity: 1;
          transition: none;
        }
        .yt-blocker {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: all;
          cursor: pointer;
        }
        /* Resize handle: a small corner grip over the video */
        .yt-resize {
          position: absolute;
          /* tucked in from the rounded corner */
          right: 4px;
          bottom: 4px;
          width: 30px;
          height: 30px;
          z-index: 3;
          cursor: nwse-resize;
          touch-action: none;
          pointer-events: all;
          background:
            linear-gradient(135deg, transparent 52%, rgba(255,255,255,0.85) 52%, rgba(255,255,255,0.85) 58%, transparent 58%,
              transparent 68%, rgba(255,255,255,0.85) 68%, rgba(255,255,255,0.85) 74%, transparent 74%);
          filter: drop-shadow(0 0 2px rgba(0,0,0,0.7));
          opacity: 0.75;
          transition: opacity 0.15s ease;
        }
        .yt-resize:hover { opacity: 1; }
      `}</style>
    </>
  )
}
