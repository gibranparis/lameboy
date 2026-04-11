// src/components/BottomZoomOrb.jsx
// Fixed bottom-center orb that handles grid density zoom
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'

const MIN = 1
const MAX = 5
const FIRE_COOLDOWN_MS = 150
const SEAFOAM = '#32ffc7'
const GREEN_ZOOM = '#11ff4f'
const RED_ZOOM = '#ff001a'
const ORB_HEIGHT = '52px'

export default function BottomZoomOrb() {
  const lastFireRef = useRef(0)
  const [pressColor, setPressColor] = useState(null)
  const [nextDir, setNextDir] = useState('in')

  // Track current density to know which direction to go next
  useEffect(() => {
    const onDensity = (e) => {
      const d = Number(e?.detail?.density ?? e?.detail?.value)
      if (!Number.isFinite(d)) return
      if (d <= MIN) setNextDir('out')
      else if (d >= MAX) setNextDir('in')
    }
    document.addEventListener('lb:grid-density', onDensity)
    return () => document.removeEventListener('lb:grid-density', onDensity)
  }, [])

  const pulse = useCallback((c) => {
    setPressColor(c)
    const t = setTimeout(() => setPressColor(null), 210)
    return () => clearTimeout(t)
  }, [])

  const fireZoom = useCallback(
    (dir) => {
      const now = performance.now()
      if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return
      lastFireRef.current = now

      pulse(dir === 'in' ? GREEN_ZOOM : RED_ZOOM)

      const detail = { step: 1, dir }
      document.dispatchEvent(new CustomEvent('lb:zoom', { detail }))
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
      document.dispatchEvent(new CustomEvent('grid-density', { detail }))
      setNextDir(dir)
    },
    [pulse]
  )

  // Mirror external zoom pulses visually
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {}
      if (d.dir === 'in') pulse(GREEN_ZOOM)
      if (d.dir === 'out') pulse(RED_ZOOM)
      if (d.dir === 'in' || d.dir === 'out') setNextDir(d.dir)
    }
    document.addEventListener('lb:zoom', onExternal)
    return () => document.removeEventListener('lb:zoom', onExternal)
  }, [pulse])

  const onClick = useCallback(() => fireZoom(nextDir), [fireZoom, nextDir])

  const onContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      fireZoom('out')
    },
    [fireZoom]
  )

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fireZoom(nextDir)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        fireZoom('in')
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        fireZoom('out')
      }
    },
    [fireZoom, nextDir]
  )

  const onWheel = useCallback(
    (e) => {
      e.preventDefault()
      if (e.deltaY < 0) fireZoom('in')
      if (e.deltaY > 0) fireZoom('out')
    },
    [fireZoom]
  )

  const rpmValue = nextDir === 'out' ? -44 : 44

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
