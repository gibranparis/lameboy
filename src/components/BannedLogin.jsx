// src/components/BannedLogin.jsx
'use client'

import { useEffect, useMemo, useState } from 'react'

export default function BannedLogin({ onAdvanceGate }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const clockText = useMemo(() => {
    return now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [now])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff',
        zIndex: 10,
        pointerEvents: 'none', // orb is now rendered by OrbShell above this
      }}
    >
      {/* Spacer so text sits under the orb (orb is fixed and centered) */}
      <div style={{ height: 110 }} />

      {/* Clock */}
      <div
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          pointerEvents: 'auto',
        }}
      >
        {clockText}
      </div>

      {/* Florida, USA */}
      <div
        role="button"
        tabIndex={0}
        onClick={onAdvanceGate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onAdvanceGate && onAdvanceGate()
        }}
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          pointerEvents: 'auto',
        }}
      >
        Florida, USA
      </div>
    </div>
  )
}
