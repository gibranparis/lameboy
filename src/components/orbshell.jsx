// src/components/OrbShell.jsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'

export default function OrbShell({
  mode, // 'gate' | 'shop'
  loaderShow, // boolean
  gateStep, // 0..3
  isProceeding, // boolean
  onAdvanceGate, // fn
  onProceed, // fn
  ctrlPx, // number
}) {
  const inGateLike = mode === 'gate' || loaderShow
  const inShop = mode === 'shop' && !loaderShow

  /* ===================== Shared sizing/position ===================== */

  // Gate: match your current 110px
  // Shop: match prior HeaderBar sizing (headerPx * 1.12)
  const height = useMemo(() => {
    if (inGateLike) return '110px'
    const n = Number(ctrlPx)
    const px = Number.isFinite(n) && n > 0 ? n : 64
    return `${Math.round(px * 1.12)}px`
  }, [ctrlPx, inGateLike])

  // Position the orb without moving it in the tree (no remount)
  const shellStyle = useMemo(() => {
    if (inGateLike) {
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10050,
        pointerEvents: 'auto',
      }
    }

    // Shop: center column of header
    // We rely on your header being fixed and height = var(--header-ctrl)
    return {
      position: 'fixed',
      left: '50%',
      top: 'calc(var(--safe-top) + (var(--header-ctrl) / 2))',
      transform: 'translate(-50%, -50%)',
      zIndex: 650,
      pointerEvents: 'auto',
    }
  }, [inGateLike])

  /* ===================== Gate colors ===================== */

  const SEAFOAM = '#32ffc7'
  const RED = '#cc0014'
  const YELLOW = '#ffd400'
  const GREEN = '#0bf05f'
  const BLACK = '#000'

  const gateOverride = useMemo(() => {
    if (loaderShow || isProceeding) return BLACK
    if (gateStep === 1) return RED
    if (gateStep === 2) return YELLOW
    if (gateStep === 3) return GREEN
    return null
  }, [gateStep, isProceeding, loaderShow])

  const gateSolid = gateStep === 1 || gateStep === 3 || isProceeding || loaderShow

  /* ===================== Gate interactions ===================== */

  const pressTimer = useRef(null)

  const startPressTimer = useCallback(() => {
    if (!inGateLike) return
    if (isProceeding) return
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      onProceed && onProceed()
    }, 650)
  }, [inGateLike, isProceeding, onProceed])

  const clearPressTimer = useCallback(() => clearTimeout(pressTimer.current), [])

  const onGateClick = useCallback(() => {
    if (!inGateLike) return
    if (isProceeding) return
    onAdvanceGate && onAdvanceGate()
  }, [inGateLike, isProceeding, onAdvanceGate])

  const onGateDouble = useCallback(() => {
    if (!inGateLike) return
    if (isProceeding) return
    onProceed && onProceed()
  }, [inGateLike, isProceeding, onProceed])

  /* ===================== Shop density logic (ported from ChakraOrbButton) ===================== */

  const lastFireRef = useRef(0)
  const FIRE_COOLDOWN_MS = 150

  const [pressColor, setPressColor] = useState(null) // '#11ff4f' | '#ff001a' | null
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [nextDir, setNextDir] = useState('in')

  const MIN = 1
  const MAX = 5
  const GREEN_ZOOM = '#11ff4f'
  const RED_ZOOM = '#ff001a'

  // watch overlay-open attribute
  useEffect(() => {
    const read = () =>
      setOverlayOpen(document.documentElement.getAttribute('data-overlay-open') === '1')
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-overlay-open'],
    })
    return () => mo.disconnect()
  }, [])

  // read density to set "edge behavior"
  useEffect(() => {
    const onDensity = (e) => {
      const mode = e?.detail?.viewMode
      // In stacks mode, orb should always zoom "in" (to reveal grid)
      if (mode === 'stacks') { setNextDir('in'); return }
      const d = Number(e?.detail?.density ?? e?.detail?.value)
      if (!Number.isFinite(d)) return
      // Only change direction at minimum (1 item) - this creates the flow:
      // stacks → 5 → 4 → 3 → 2 → 1 → reverse → 2 → 3 → 4 → 5 → stacks
      if (d <= MIN) setNextDir('out')
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
      document.dispatchEvent(new CustomEvent('grid-density', { detail })) // legacy
      setNextDir(dir)
    },
    [pulse]
  )

  // external zoom pulses
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

  const onShopClick = useCallback(() => fireZoom(nextDir), [fireZoom, nextDir])
  const onShopContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      fireZoom('out')
    },
    [fireZoom]
  )

  const onShopKeyDown = useCallback(
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

  const onShopWheel = useCallback(
    (e) => {
      e.preventDefault()
      const y = e.deltaY
      if (y < 0) fireZoom('in')
      if (y > 0) fireZoom('out')
    },
    [fireZoom]
  )

  // reverse spin when overlay open or when “next action” is OUT (matches your prior feel)
  const rpmValue = useMemo(() => {
    const base = 44
    if (inGateLike) return 44
    return (overlayOpen || nextDir === 'out' ? -1 : 1) * base
  }, [inGateLike, overlayOpen, nextDir])

  /* ===================== Unified render ===================== */

  // Which click behavior is active depends on mode.
  const buttonHandlers = inGateLike
    ? {
        onClick: onGateClick,
        onMouseDown: startPressTimer,
        onMouseUp: clearPressTimer,
        onMouseLeave: clearPressTimer,
        onTouchStart: startPressTimer,
        onTouchEnd: clearPressTimer,
        onDoubleClick: onGateDouble,
      }
    : {
        onClick: onShopClick,
        onContextMenu: onShopContextMenu,
        onKeyDown: onShopKeyDown,
        onWheel: onShopWheel,
      }

  const orbOverrideAllColor = inGateLike ? gateOverride : pressColor || null
  const orbHaloTint = inGateLike
    ? gateOverride === RED
      ? '#880011'        // deep blood-crimson — evil moon glow
      : gateOverride === BLACK
        ? '#444444'      // visible dark aura instead of near-invisible #111
        : null
    : pressColor || null

  // Always keep glow meshes mounted so the visual footprint stays consistent
  // across color transitions. Opacity (orbGlowOpacity) already goes to 0
  // during black/proceeding/loader states, making halos invisible without
  // unmounting them (which caused a perceived vertical shift).
  const orbGlow = true
  const orbGlowOpacity = inGateLike
    ? loaderShow || isProceeding
      ? 0.12   // subtle halo survives into black phase (lerped smooth by useFrame)
      : gateSolid
        ? 1.0
        : gateStep >= 1
          ? 1.0
          : 0.9
    : pressColor
      ? 1.0
      : 0.9

  const orbColor = inGateLike
    ? gateSolid
      ? loaderShow || isProceeding
        ? BLACK
        : gateStep === 1
          ? RED
          : GREEN
      : SEAFOAM
    : SEAFOAM
  const orbSolidOverride = inGateLike ? gateSolid : false

  return (
    <div style={shellStyle}>
      <button
        type="button"
        aria-label={inGateLike ? 'Orb' : 'Zoom products'}
        title={
          inGateLike
            ? 'Advance gate (click) • Proceed (hold or double-click)'
            : 'Zoom products (Click = Smart IN/OUT • Right-click = OUT • Wheel = IN/OUT)'
        }
        data-orb={inGateLike ? 'gate' : 'density'}
        style={{
          padding: 0,
          margin: 0,
          border: 0,
          background: 'transparent',
          lineHeight: 0,
          cursor: inGateLike && isProceeding ? 'default' : 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        {...buttonHandlers}
      >
        <BlueOrbCross3D
          height={height}
          rpm={rpmValue}
          color={orbColor}
          geomScale={inGateLike ? 1.2 : 1.12}
          offsetFactor={inGateLike ? 2.05 : 2.25}
          armRatio={inGateLike ? 0.33 : 0.35}
          glow={orbGlow}
          glowOpacity={orbGlowOpacity}
          includeZAxis
          respectReducedMotion={false}
          interactive={!inGateLike || (!isProceeding && !loaderShow)}
          onActivate={null}
          overrideAllColor={orbOverrideAllColor}
          haloTint={orbHaloTint}
          flashDecayMs={inGateLike ? 0 : 140}
          solidOverride={orbSolidOverride}
        />
      </button>
    </div>
  )
}
