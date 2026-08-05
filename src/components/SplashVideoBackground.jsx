// src/components/SplashVideoBackground.jsx
'use client'

import { useEffect, useRef } from 'react'

const VIDEO_ID = 'UJEBdsASj_0'
const START_SECONDS = 4900

export default function SplashVideoBackground() {
  const playerRef = useRef(null)

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
          fs: 0,
          start: START_SECONDS,
        },
        events: {
          onReady: (e) => {
            try {
              e.target.mute()
              e.target.playVideo()
            } catch {}
          },
          // Loop back to the chosen start point rather than 0
          onStateChange: (e) => {
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
        background: '#000',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Oversized 16:9 iframe, centered, so it always covers the viewport
          like background-size: cover (classic full-bleed YT bg technique) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100vw',
          height: '56.25vw', // 16:9
          minHeight: '100vh',
          minWidth: '177.78vh', // 16:9
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div id="lb-splash-yt-bg" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Soft veil so the white/black gate text stays readable over footage */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.55)',
        }}
      />
    </div>
  )
}
