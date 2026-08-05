// src/components/SplashVideoBackground.jsx
'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEO_ID = 'UJEBdsASj_0'
const START_SECONDS = 4900
// How long to keep the video hidden behind black while it buffers/starts,
// so no player chrome, thumbnail flash, or caption flicker is ever visible
const REVEAL_DELAY_MS = 5000

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

export default function SplashVideoBackground({ onRevealed }) {
  const playerRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const readyAtRef = useRef(0)
  const isPlayingRef = useRef(false)
  const revealedRef = useRef(false)

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
        width: '100%',
        height: '100%',
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
          start: START_SECONDS,
        },
        events: {
          onReady: (e) => {
            readyAtRef.current = Date.now()
            try {
              e.target.mute()
              e.target.playVideo()
            } catch {}
            killCaptions(e.target)
            // Re-assert a few times — the captions module can silently
            // re-attach itself right after playback actually starts
            ;[300, 800, 1500, 2500].forEach((ms) =>
              setTimeout(() => killCaptions(e.target), ms)
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
          // Loop back to the chosen start point rather than 0
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              killCaptions(e.target)
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
                e.target.seekTo(START_SECONDS, true)
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
        {/* Oversized 16:9 iframe, centered, so it always covers the viewport
            like background-size: cover (classic full-bleed YT bg technique) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '124vw',
            height: '69.75vw', // 16:9 of 124vw
            minHeight: '124vh',
            minWidth: '220.4vh', // 16:9 of 124vh
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div id="lb-splash-yt-bg" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}
