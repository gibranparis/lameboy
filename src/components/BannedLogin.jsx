// src/components/BannedLogin.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

export default function BannedLogin({ onProceed }) {
  // gateStep: 0 = default (seafoam), 1 = red, 2 = yellow, 3 = green (proceed)
  const [gateStep, setGateStep] = useState(0)
  const [now, setNow] = useState(() => new Date())

  const pressTimer = useRef(null)
  const proceedFired = useRef(false)

  const SEAFOAM = '#32ffc7'
  const RED = '#ff001a'
  const YELLOW = '#ffd400'
  const GREEN = '#22ff7a'

  const triggerProceed = useCallback(() => {
    if (proceedFired.current) return
    proceedFired.current = true
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  const advanceGate = useCallback(() => {
    setGateStep((s) => {
      if (s >= 3) return 3
      return s + 1
    })
  }, [])

  const startPressTimer = () => {
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(triggerProceed, 650)
  }

  const clearPressTimer = () => clearTimeout(pressTimer.current)

  // clock tick
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

  const orbOverride = useMemo(() => {
    if (gateStep === 1) return RED
    if (gateStep === 2) return YELLOW
    if (gateStep === 3) return GREEN
    return null
  }, [gateStep])

  // When we hit green, automatically proceed (once)
  useEffect(() => {
    if (gateStep === 3) triggerProceed()
  }, [gateStep, triggerProceed])

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
        onClick={advanceGate}
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
          glowOpacity={gateStep >= 1 ? 1.0 : 0.9}
          includeZAxis
          height="110px"
          overrideAllColor={orbOverride}
          interactive
        />
      </button>

      {/* Clock + Florida, USA (clickable) */}
      <button
        aria-label="Florida, USA"
        type="button"
        onClick={advanceGate}
        style={{
          marginTop: 28,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#000',
            opacity: 0.9,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {clockText}
        </div>

        <div
          style={{
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
      </button>
    </div>
  )
}
