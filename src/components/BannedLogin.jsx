// src/components/BannedLogin.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

export default function BannedLogin({ onProceed }) {
  // gateStep: 0 = seafoam, 1 = red, 2 = yellow, 3 = green (then proceed)
  const [gateStep, setGateStep] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [isProceeding, setIsProceeding] = useState(false)

  const pressTimer = useRef(null)
  const proceedFired = useRef(false)
  const proceedDelayTimer = useRef(null)

  const SEAFOAM = '#32ffc7'
  const RED = '#ff001a'
  const YELLOW = '#ffd400'
  const GREEN = '#00ff66'

  const triggerProceed = useCallback(() => {
    if (proceedFired.current) return
    proceedFired.current = true
    setIsProceeding(true) // lock interactions ONLY (do not force black orb here)
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  const advanceGate = useCallback(() => {
    if (proceedFired.current || isProceeding) return
    setGateStep((s) => (s >= 3 ? 3 : s + 1))
  }, [isProceeding])

  const startPressTimer = () => {
    if (proceedFired.current || isProceeding) return
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(triggerProceed, 650)
  }

  const clearPressTimer = () => clearTimeout(pressTimer.current)

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

  const solidOverride = gateStep === 3

  // When we hit green, WAIT so green is visible, then proceed (once)
  useEffect(() => {
    if (gateStep !== 3) return
    if (proceedFired.current || isProceeding) return

    clearTimeout(proceedDelayTimer.current)
    proceedDelayTimer.current = setTimeout(() => {
      triggerProceed()
    }, 300)

    return () => clearTimeout(proceedDelayTimer.current)
  }, [gateStep, isProceeding, triggerProceed])

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
        onDoubleClick={() => {
          if (proceedFired.current || isProceeding) return
          triggerProceed()
        }}
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          cursor: proceedFired.current || isProceeding ? 'default' : 'pointer',
          lineHeight: 0,
        }}
      >
        <BlueOrbCross3D
          rpm={44}
          color={solidOverride ? GREEN : SEAFOAM}
          geomScale={1.2}
          glow
          glowOpacity={solidOverride ? 1.0 : gateStep >= 1 ? 1.0 : 0.9}
          includeZAxis
          height="110px"
          overrideAllColor={orbOverride}
          solidOverride={solidOverride}
          interactive={!isProceeding}
          // IMPORTANT: remove any click-flash linger while transitioning
          flashDecayMs={0}
        />
      </button>

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
        }}
      >
        {clockText}
      </div>

      {/* Florida, USA */}
      <div
        role="button"
        tabIndex={0}
        onClick={advanceGate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') advanceGate()
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
          cursor: proceedFired.current || isProceeding ? 'default' : 'pointer',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        Florida, USA
      </div>
    </div>
  )
}
