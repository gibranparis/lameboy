// src/components/BottomZoomOrb.jsx
// Fixed bottom-center orb that handles grid density zoom
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'

const FIRE_COOLDOWN_MS = 150
const SEAFOAM = '#32ffc7'
const GREEN_ZOOM = '#11ff4f'
const ORB_HEIGHT = '52px'

export default function BottomZoomOrb() {
  const lastFireRef = useRef(0)
  const [pressColor, setPressColor] = useState(null)

  const pulse = useCallback((c) => {
    setPressColor(c)
    const t = setTimeout(() => setPressColor(null), 210)
    return () => clearTimeout(t)
  }, [])

  const fireZoom = useCallback(() => {
    const now = performance.now()
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return
    lastFireRef.current = now

    pulse(GREEN_ZOOM)

    const detail = { step: 1, dir: 'out' }
    document.dispatchEvent(new CustomEvent('lb:zoom', { detail }))
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
    document.dispatchEvent(new CustomEvent('grid-density', { detail }))
  }, [pulse])

  // Mirror external zoom pulses visually
  useEffect(() => {
    const onExternal = (ev) => {
      if (ev?.detail?.dir) pulse(GREEN_ZOOM)
    }
    document.addEventListener('lb:zoom', onExternal)
    return () => document.removeEventListener('lb:zoom', onExternal)
  }, [pulse])

  const onClick = useCallback(() => fireZoom(), [fireZoom])
  const onContextMenu = useCallback((e) => { e.preventDefault() }, [])
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fireZoom()
      }
    },
    [fireZoom]
  )
  const onWheel = useCallback(
    (e) => {
      try { e.preventDefault() } catch {}
      fireZoom()
    },
    [fireZoom]
  )

  const rpmValue = 44

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 600,
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        aria-label="Zoom products"
        title="Zoom products (Click = Smart IN/OUT · Right-click = OUT · Wheel = IN/OUT)"
        data-orb="zoom"
        style={{
          padding: 0,
          margin: 0,
          border: 0,
          background: 'transparent',
          lineHeight: 0,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
      >
        <BlueOrbCross3D
          height={ORB_HEIGHT}
          rpm={rpmValue}
          color={SEAFOAM}
          geomScale={1.0}
          offsetFactor={2.25}
          armRatio={0.35}
          glow
          glowOpacity={pressColor ? 1.0 : 0.85}
          includeZAxis
          respectReducedMotion={false}
          interactive
          onActivate={onClick}
          overrideAllColor={pressColor || null}
          haloTint={pressColor || null}
          flashDecayMs={140}
          solidOverride={false}
        />
      </button>
    </div>
  )
}
