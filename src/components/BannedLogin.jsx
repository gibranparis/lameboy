// src/components/BannedLogin.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

export default function BannedLogin({ onProceed }) {
  // gateStep: 0 = default (chakra), 1 = red, 2 = yellow, 3 = green (then proceed)
  const [gateStep, setGateStep] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [locked, setLocked] = useState(false)

  const pressTimer = useRef(null)
  const proceedFired = useRef(false)
  const proceedDelayTimer = useRef(null)

  const RED = '#ff001a'
  const YELLOW = '#ffd400'
  const GREEN = '#00ff66'

  const triggerProceed = useCallback(() => {
    if (proceedFired.current) return
    proceedFired.current = true

    // Lock the gate immediately. The page-level WhiteLoader covers the transition,
    // so we do NOT switch this orb to black (that was causing overlap / “flash” artifacts).
    setLocked(true)

    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  const advanceGate = useCallback(() => {
    if (locked || proceedFired.current) return
    setGateStep((s) => (s >= 3 ? 3 : s + 1))
  }, [locked])

  const startPressTimer = () => {
    if (locked || proceedFired.current) return
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

  // Color override per step (keeps the orb where it belongs; no black state here)
  const orbOverride = useMemo(() => {
    if (gateStep === 1) return RED
    if (gateStep === 2) return YELLOW
    if (gateStep === 3) return GREEN
    return null
  }, [gateStep])

  // When we hit green, show it briefly, then proceed
  useEffect(() => {
    if (gateStep !== 3) return
    if (locked || proceedFired.current) return

    clearTimeout(proceedDelayTimer.current)
    proceedDelayTimer.current = setTimeout(() => {
      triggerProceed()
    }, 300)

    return () => clearTimeout(proceedDelayTimer.current)
  }, [gateStep, locked, triggerProceed])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#fff',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // This is the “proportionate” spacing you were asking for:
          // orb ↔ clock ↔ florida
          gap: 10,
          transform: 'translateZ(0)',
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
            if (locked || proceedFired.current) return
            triggerProceed()
          }}
          disabled={locked}
          style={{
            padding: 0,
            margin: 0,
            border: 'none',
            background: 'transparent',
            cursor: locked ? 'default' : 'pointer',
            lineHeight: 0,
            pointerEvents: locked ? 'none' : 'auto',
          }}
        >
          <BlueOrbCross3D
            rpm={44}
            geomScale={1.2}
            includeZAxis
            height="110px"
            // keep glow consistent so it never “dies” right before the loader covers
            glow
            glowOpacity={gateStep >= 1 ? 1.0 : 0.9}
            overrideAllColor={orbOverride}
            // no lingering click flash behavior on the gate
            interactive={!locked}
            flashDecayMs={0}
            // we only want “solidOverride” on GREEN so it reads clean
            solidOverride={gateStep === 3}
          />
        </button>

        {/* Clock */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#000',
            opacity: 0.9,
            textTransform: 'uppercase',
            lineHeight: 1.15,
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
            textAlign: 'center',
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#000',
            opacity: 0.9,
            textTransform: 'uppercase',
            cursor: locked ? 'default' : 'pointer',
            userSelect: 'none',
            outline: 'none',
            lineHeight: 1.15,
            paddingBottom: 2, // tiny breathing room (helps “feel” centered)
          }}
        >
          Florida, USA
        </div>
      </div>
    </div>
  )
}
