// src/components/YoutubePlayer.jsx
'use client'

import { useEffect, useRef, useState } from 'react'

const PLAYLIST_ID = 'PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd'
const REVEAL_DELAY_MS = 2000

export default function YoutubePlayer({ open }) {
  const playerRef = useRef(null)       // YT.Player instance
  const containerRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const revealTimer = useRef(null)
  const hasOpenedOnce = useRef(false)
  const pendingPlay = useRef(false)    // play once player is ready

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }, [])

  // Create player once API is ready
  useEffect(() => {
    const create = () => {
      if (playerRef.current) return
      playerRef.current = new window.YT.Player('lb-yt-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: PLAYLIST_ID,
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          fs: 1,
        },
        events: {
          onReady: (e) => {
            if (pendingPlay.current) {
              pendingPlay.current = false
              try { e.target.playVideo() } catch {}
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
  }, [])

  // React to open/close
  useEffect(() => {
    clearTimeout(revealTimer.current)

    if (open) {
      hasOpenedOnce.current = true

      // Play immediately (audio starts right away)
      const player = playerRef.current
      if (player?.playVideo) {
        try { player.playVideo() } catch {}
      } else {
        // Player not ready yet — flag it to play on ready
        pendingPlay.current = true
      }

      // Reveal visually after delay
      revealTimer.current = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    } else {
      // Hide visually immediately
      setRevealed(false)
      pendingPlay.current = false
      // Pause video
      try { playerRef.current?.pauseVideo?.() } catch {}
    }

    return () => clearTimeout(revealTimer.current)
  }, [open])

  // Don't render until opened at least once (keeps DOM clean initially)
  if (!hasOpenedOnce.current && !open) return null

  return (
    <div
      ref={containerRef}
      aria-hidden={!open}
      style={{
        width: '100%',
        // Height collapses when closed — keeps layout tight
        height: open ? 'clamp(180px, 32vw, 340px)' : 0,
        overflow: 'hidden',
        transition: open
          ? 'height 0.4s cubic-bezier(.4,0,.2,1)'
          : 'height 0.35s cubic-bezier(.4,0,.2,1)',
        willChange: 'height',
        background: '#000',
      }}
    >
      {/* Opacity layer — delays the visual reveal by REVEAL_DELAY_MS */}
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: revealed ? 1 : 0,
          transition: revealed ? 'opacity 0.5s ease' : 'opacity 0.15s ease',
          pointerEvents: revealed ? 'auto' : 'none',
        }}
      >
        <div id="lb-yt-player" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
