// src/components/SplashVideoBackground.jsx
'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEO_ID = 'UJEBdsASj_0'
// Fallback only — used if we can't read the real duration for some reason
const FALLBACK_START_SECONDS = 4158
// How long to keep the video hidden behind black while it buffers/starts,
// so no player chrome, thumbnail flash, or caption flicker is ever visible
const REVEAL_DELAY_MS = 5000

function randomStart(duration) {
  // Keep clear of the very end so a loop-seek isn't triggered instantly
  const safeMax = Math.max(duration - 60, 30)
  return Math.floor(Math.random() * safeMax)
}

// Aggressively strip captions — some viewers have a browser/account-level
// "always show captions" preference that overrides cc_load_policy, and the
// captions module can attach itself again a moment after onReady fires.
function killCaptions(player) {
  try {
    player.unloadModule?.('captions')
    player.unloadModule?.('cc')
    player.setOption?.('captions', 'track', {})
    player.setOption?.('captions', 'reload', false)
  } catch {}
}

// Push for the best quality YouTube will offer this connection — 'highres'
// requests the top of the available ladder (up to 4K on this source),
// falling back to whatever the viewer's bandwidth actually supports
// (YouTube still auto-adapts under the hood; this just biases it toward
// the top of that range instead of defaulting lower on capable connections).
function forceHighQuality(player) {
  try {
    player.setPlaybackQuality?.('highres')
  } catch {}
}

export default function SplashVideoBackground({ onRevealed, onHidden }) {
  const playerRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const readyAtRef = useRef(0)
  const isPlayingRef = useRef(false)
  const revealedRef = useRef(false)

  const unreveal = () => {
    if (!revealedRef.current) return
    revealedRef.current = false
    setRevealed(false)
    try {
      onHidden?.()
    } catch {}
  }

  const tryReveal = () => {
    if (revealedRef.current) return
    // Only ever reveal once the player has actually reported PLAYING —
    // otherwise we might unveil onto a paused frame with the big play
    // button still showing (autoplay can be briefly blocked/delayed)
    if (!isPlayingRef.current) return
    if (Date.now() - readyAtRef.current < REVEAL_DELAY_MS) return
    revealedRef.current = true
    setRevealed(true)
    try {
      onRevealed?.()
    } catch {}
  }

  // Load the YouTube IFrame API script once (safe alongside YoutubePlayer.jsx,
  // which does the same existence check + onYouTubeIframeAPIReady chaining)
  useEffect(() => {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    const create = () => {
      if (playerRef.current) return
      playerRef.current = new window.YT.Player('lb-splash-yt-bg', {
        width: '1920',
        height: '1080',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: VIDEO_ID, // required by YT for loop=1 on a single video
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          start: FALLBACK_START_SECONDS,
        },
        events: {
          onReady: (e) => {
            readyAtRef.current = Date.now()
            // Strip native fullscreen capability so iOS Safari can't take
            // the wallpaper fullscreen and expose YouTube's own chrome
            try {
              const iframe = document.getElementById('lb-splash-yt-bg')
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
            try {
              e.target.mute()
              const duration = e.target.getDuration?.() || 0
              const startAt = duration > 90 ? randomStart(duration) : FALLBACK_START_SECONDS
              e.target.seekTo(startAt, true)
              e.target.playVideo()
            } catch {}
            killCaptions(e.target)
            forceHighQuality(e.target)
            // Re-assert a few times — the captions module can silently
            // re-attach itself right after playback actually starts, and
            // YouTube can quietly downgrade quality once buffering begins
            ;[300, 800, 1500, 2500, 4000].forEach((ms) =>
              setTimeout(() => {
                killCaptions(e.target)
                forceHighQuality(e.target)
              }, ms)
            )
            // Re-attempt play in case autoplay was briefly blocked/delayed
            ;[200, 600, 1200].forEach((ms) =>
              setTimeout(() => {
                try {
                  if (!isPlayingRef.current) e.target.playVideo()
                } catch {}
              }, ms)
            )
            setTimeout(tryReveal, REVEAL_DELAY_MS)
            // Hard fallback — never leave the screen black forever, even
            // if PLAYING somehow never fires
            setTimeout(() => {
              isPlayingRef.current = true
              tryReveal()
            }, REVEAL_DELAY_MS + 4000)
          },
          onApiChange: (e) => killCaptions(e.target),
          onPlaybackQualityChange: (e) => forceHighQuality(e.target),
          // Loop back to a fresh random point rather than 0
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              killCaptions(e.target)
              forceHighQuality(e.target)
              isPlayingRef.current = true
              tryReveal()
            } else if (
              e.data === window.YT.PlayerState.PAUSED ||
              e.data === window.YT.PlayerState.BUFFERING ||
              e.data === window.YT.PlayerState.CUED
            ) {
              isPlayingRef.current = false
            }
            if (e.data === window.YT.PlayerState.ENDED) {
              try {
                const duration = e.target.getDuration?.() || 0
                const nextStart =
                  duration > 90 ? randomStart(duration) : FALLBACK_START_SECONDS
                e.target.seekTo(nextStart, true)
                e.target.playVideo()
              } catch {}
            }
          },
        },
      })
    }

    if (typeof window !== 'undefined' && window.YT?.Player) {
      create()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        create()
      }
    }

    return () => {
      try {
        playerRef.current?.destroy?.()
      } catch {}
      playerRef.current = null
    }
  }, [])

  // If the browser backgrounds this tab, YouTube can pause itself and — on
  // return — briefly show its own paused-state UI (center play button,
  // ±10s skip icons) even with controls disabled. Catch the tab regaining
  // focus, hide the video instantly if it's not actually playing, nudge
  // playback again, and let the normal PLAYING handler bring it back.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const player = playerRef.current
      if (!player) return
      try {
        const state = player.getPlayerState?.()
        const playing = state === window.YT?.PlayerState?.PLAYING
        if (!playing) {
          isPlayingRef.current = false
          unreveal()
          player.playVideo?.()
        }
      } catch {}
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Fully hidden (no transition) until the player has confirmed it's
          actually PLAYING — the page underneath stays plain white/black
          text until this snaps in, so there's nothing to "fade away" */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          visibility: revealed ? 'visible' : 'hidden',
        }}
      >
        {/* Classic full-bleed "cover" sizing: scales to match whichever
            axis the viewport needs, then overflows (and gets clipped by
            the wrapper) on the other. On typical/narrower-than-16:9 screens
            that means left/right get cropped and top/bottom stay untouched;
            on wider-than-16:9 (ultrawide) monitors it flips, so the frame
            still goes fully edge-to-edge instead of leaving side gaps. */}
        <div className="lb-splash-cover">
          <div id="lb-splash-yt-bg" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Plain vh/vw units are unreliable on iOS Safari — 100vh there is
          based on the browser-chrome-collapsed height, not the actual
          visible viewport, which left white strips top/bottom since the
          video came out shorter than the real screen. dvh/dvw track the
          real visible viewport instead; the vh/vw rules stay first as a
          fallback for browsers that don't support dvh/dvw at all. */}
      <style jsx>{`
        .lb-splash-cover {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 56.25vw; /* 16:9 of 100vw */
          min-width: 177.78vh; /* 16:9 of 100vh */
          min-height: 100vh;
          width: 100dvw;
          height: 56.25dvw;
          min-width: 177.78dvh;
          min-height: 100dvh;
          transform: translate(-50%, -50%);
        }
      `}</style>

      {/* Force the YT-generated <iframe> to always fill its wrapper exactly —
          the player's own width/height attributes are unreliable at
          non-16:9 or percentage sizes and can leave a sliver uncovered */}
      <style jsx global>{`
        #lb-splash-yt-bg iframe {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
          display: block !important;
        }
      `}</style>
    </div>
  )
}
