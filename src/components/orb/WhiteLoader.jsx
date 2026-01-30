// src/components/orb/WhiteLoader.jsx
'use client'

import React, { useEffect, useState } from 'react'

const WHITE_Z = 10002

function ClockNaples() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }).format(new Date())
      )
    fmt()
    // Align to next second boundary
    const msToNextSec = 1000 - (Date.now() % 1000)
    let intervalId
    const alignTimer = setTimeout(() => {
      fmt()
      intervalId = setInterval(fmt, 1000)
    }, msToNextSec)
    return () => {
      clearTimeout(alignTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])
  return <span>{now}</span>
}

export default function WhiteLoader({ show }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (!show && visible) {
      const t = setTimeout(() => setVisible(false), 260)
      return () => clearTimeout(t)
    }
    if (show && !visible) setVisible(true)
  }, [show, visible])

  if (!visible) return null

  const opacity = show ? 1 : 0

  return (
    <div
      aria-hidden
      className="white-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: WHITE_Z,
        pointerEvents: 'none',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity 260ms ease',
        opacity,
        contain: 'layout paint style',
      }}
    >
      {/* OrbShell renders the real orb above this layer (z-index 10050).
          Text matches BannedLogin positioning so the transition is seamless. */}
      <span
        style={{
          marginTop: 150,
          textAlign: 'center',
          color: '#000',
          fontWeight: 800,
          letterSpacing: '.06em',
          fontSize: 'clamp(12px,1.3vw,14px)',
          lineHeight: 1.2,
          opacity: 0.9,
        }}
      >
        <ClockNaples />
      </span>

      <span
        style={{
          marginTop: 6,
          textAlign: 'center',
          color: '#000',
          fontWeight: 800,
          letterSpacing: '.06em',
          fontSize: 'clamp(12px,1.3vw,14px)',
          lineHeight: 1.2,
          opacity: 0.9,
          textTransform: 'uppercase',
        }}
      >
        LAMEBOY, USA
      </span>
    </div>
  )
}
