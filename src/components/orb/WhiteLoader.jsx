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
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
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
        display: 'grid',
        placeItems: 'center',
        transition: 'opacity 260ms ease',
        opacity,
        contain: 'layout paint style',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          transform: 'translateY(-2px)',
        }}
      >
        {/* Enhanced black orb with glow effect */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#000',
            boxShadow:
              '0 0 20px rgba(0, 0, 0, 0.4), ' +
              '0 0 40px rgba(0, 0, 0, 0.25), ' +
              '0 0 60px rgba(0, 0, 0, 0.15), ' +
              'inset 0 0 20px rgba(255, 255, 255, 0.05)',
          }}
        />

        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
          }}
        >
          <ClockNaples />
        </span>

        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </div>
  )
}
