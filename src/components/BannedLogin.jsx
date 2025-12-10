// src/components/BannedLogin.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

export default function BannedLogin({ onProceed }) {
  const [orbRed, setOrbRed] = useState(false)
  const pressTimer = useRef(null)

  const SEAFOAM = '#32ffc7'
  const RED = '#ff001a'

  const triggerProceed = useCallback(() => {
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  const startPressTimer = () => {
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(triggerProceed, 650)
  }

  const clearPressTimer = () => clearTimeout(pressTimer.current)

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
      }}
    >
      {/* ORB */}
      <button
        aria-label="Orb"
        type="button"
        onClick={() => setOrbRed((v) => !v)}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          lineHeight: 0,
        }}
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.2}
          glow
          glowOpacity={orbRed ? 1.0 : 0.9}
          includeZAxis
          height="110px"
          overrideAllColor={orbRed ? RED : null}
          interactive
        />
      </button>

      {/* Florida, USA */}
      <div
        style={{
          marginTop: 28,
          textAlign: 'center',
          fontSize: 'clamp(13px, 1.4vw, 16px)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
        }}
      >
        Florida, USA
      </div>
    </div>
  )
}
