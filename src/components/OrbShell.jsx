// src/components/OrbShell.jsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'

export default function OrbShell({
  mode, // 'gate' | 'shop'
  loaderShow, // boolean
  gateStep, // 0..7
  isProceeding, // boolean
  onAdvanceGate, // fn — starts the chakra sequence (no-op once running)
  onHoldChange, // fn(bool) — true while the orb is dragged or snapping back
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
  /** @type {React.CSSProperties} */
  const shellStyle = useMemo(() => {
    if (inGateLike) {
      return /** @type {React.CSSProperties} */ ({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10050,
        pointerEvents: 'auto',
        transition: 'top 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), z-index 0s 0.6s',
      })
    }

    // Shop: center column of bottom header
    // Use top + calc to keep the same property for smooth CSS transition from gate center
    return /** @type {React.CSSProperties} */ ({
      position: 'fixed',
      left: '50%',
      top: 'calc(100% - var(--safe-bottom, 0px) - (var(--header-ctrl, 64px) / 2))',
      transform: 'translate(-50%, -50%)',
      zIndex: 650,
      pointerEvents: 'auto',
      transition: 'top 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), z-index 0s 0.6s',
    })
  }, [inGateLike])

  /* ===================== Gate colors ===================== */

  const SEAFOAM = '#32ffc7'
  const WHITE = '#ffffff'
  const RED    = '#cc0014'  // root chakra
  const ORANGE = '#e05500'  // sacral chakra
  const YELLOW = '#ffd400'  // solar chakra
  const GREEN  = '#00a832'  // heart chakra
  const BLUE   = '#0066ff'  // throat chakra
  const PURPLE = '#3a00b5'  // third-eye chakra
  const PINK   = '#9333ea'  // crown chakra (warm violet)
  const BLACK  = '#000'

  const [isNight, setIsNight] = useState(false)
  useEffect(() => {
    const onTheme = (e) => setIsNight(e?.detail?.theme === 'night')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    // sync with current html data-theme on mount
    setIsNight(document.documentElement.dataset.theme === 'night')
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  const gateOverride = useMemo(() => {
    if (loaderShow || isProceeding) return BLACK
    if (gateStep === 1) return RED
    if (gateStep === 2) return ORANGE
    if (gateStep === 3) return YELLOW
    if (gateStep === 4) return GREEN
    if (gateStep === 5) return BLUE
    if (gateStep === 6) return PURPLE
    if (gateStep === 7) return PINK
    return null
  }, [gateStep, isProceeding, loaderShow])

  const gateSolid = gateStep >= 1 || isProceeding || loaderShow

  /* ===================== Gate motion ===================== */
  // One spring system drives the orb on the gate: it squeezes when pressed,
  // lifts while dragged, springs back to center on release, and pulses on
  // every chakra step. It runs in JS because gate mode disables CSS
  // transitions (globals.css), and writes the transform straight to the
  // shell so the 3D orb doesn't re-render per frame.

  const DRAG_THRESHOLD_PX = 8
  const POS_K = 260 // position stiffness
  const POS_C = 18 // position damping (≈0.56: one small overshoot)
  const SCALE_K = 420 // scale stiffness
  const SCALE_C = 20 // scale damping (≈0.5: a crisp bounce)
  const PRESS_SCALE = 0.9
  const ARRIVE_PX = 6 // released orb counts as home within this distance
  const LIFT_SCALE = 1.06
  const canDrag = mode === 'gate' && !loaderShow && !isProceeding

  const shellRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(/** @type {{id:number,x:number,y:number,active:boolean}|null} */ (null))
  // Set when a drag ends so the click the browser fires after it is ignored
  const suppressClick = useRef(false)
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, held: false })
  const motionRaf = useRef(0)
  const onSettle = useRef(/** @type {null | (() => void)} */ (null))
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(motionRaf.current)
  }, [])

  const writeShell = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    const m = motion.current
    el.style.transform = `translate(calc(-50% + ${m.x}px), calc(-50% + ${m.y}px)) scale(${m.s})`
  }, [])

  const runMotion = useCallback(() => {
    if (motionRaf.current) return
    const el = shellRef.current
    // Keep any CSS transition on the shell from smoothing the per-frame writes
    if (el) el.style.transition = 'none'
    let last = performance.now()
    const tick = (now) => {
      const m = motion.current
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (!m.held) {
        m.vx += (-POS_K * m.x - POS_C * m.vx) * dt
        m.vy += (-POS_K * m.y - POS_C * m.vy) * dt
        m.x += m.vx * dt
        m.y += m.vy * dt
      }
      m.vs += (-SCALE_K * (m.s - m.ts) - SCALE_C * m.vs) * dt
      m.s += m.vs * dt
      // Start whatever waits on the release as the orb snaps into place,
      // rather than after its bounce has fully died out
      if (onSettle.current && !m.held && Math.hypot(m.x, m.y) < ARRIVE_PX) {
        const done = onSettle.current
        onSettle.current = null
        done()
      }
      const settled =
        !m.held &&
        Math.hypot(m.x, m.y) < 0.5 && Math.hypot(m.vx, m.vy) < 10 &&
        Math.abs(m.s - m.ts) < 0.002 && Math.abs(m.vs) < 0.02
      if (settled) {
        m.x = m.y = m.vx = m.vy = m.vs = 0
        m.s = m.ts
        if (el) {
          el.style.transform = m.s === 1 ? 'translate(-50%, -50%)' : `translate(-50%, -50%) scale(${m.s})`
          el.style.transition = shellStyle.transition || ''
        }
        motionRaf.current = 0
        const done = onSettle.current
        onSettle.current = null
        if (done) done()
        return
      }
      writeShell()
      motionRaf.current = requestAnimationFrame(tick)
    }
    motionRaf.current = requestAnimationFrame(tick)
  }, [shellStyle.transition, writeShell])

  // Push the scale spring: a positive kick makes the orb swell, then settle
  const kickScale = useCallback((v) => {
    if (reducedMotion.current) return
    motion.current.vs += v
    runMotion()
  }, [runMotion])

  const setScaleTarget = useCallback((ts) => {
    motion.current.ts = reducedMotion.current ? 1 : ts
    runMotion()
  }, [runMotion])

  const buzz = useCallback((ms) => {
    try { navigator.vibrate?.(ms) } catch {}
  }, [])

  // A crisp pulse and haptic tick on every chakra beat, a fuller one on black
  const prevStep = useRef(gateStep)
  useEffect(() => {
    if (!inGateLike) return
    if (gateStep !== prevStep.current && gateStep >= 2) {
      kickScale(0.8)
      buzz(5)
    }
    prevStep.current = gateStep
  }, [buzz, gateStep, inGateLike, kickScale])

  useEffect(() => {
    if (!isProceeding) return
    kickScale(2.2)
    buzz(14)
  }, [isProceeding, kickScale, buzz])

  /* ===================== Gate interactions ===================== */
  // Every gesture starts the same sequence: all seven chakras, then black,
  // then the shop. Touching the orb starts it at once (red on contact); a
  // drag holds the current colour until the orb is back home. Once it's
  // running, more taps never skip a colour.

  const onGateClick = useCallback(() => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (!inGateLike || isProceeding) return
    if (gateStep === 0) buzz(8)
    onAdvanceGate && onAdvanceGate()
  }, [buzz, gateStep, inGateLike, isProceeding, onAdvanceGate])

  const onGatePointerDown = useCallback((e) => {
    suppressClick.current = false
    if (!canDrag) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false }
    setScaleTarget(PRESS_SCALE)
    if (gateStep === 0) {
      buzz(8)
      onAdvanceGate && onAdvanceGate()
    }
  }, [buzz, canDrag, gateStep, onAdvanceGate, setScaleTarget])

  const onGatePointerMove = useCallback((e) => {
    const s = dragStart.current
    if (!s || s.id !== e.pointerId || !canDrag) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    const m = motion.current
    if (!s.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      s.active = true
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
      m.held = true
      setDragging(true)
      setScaleTarget(LIFT_SCALE)
      onHoldChange && onHoldChange(true)
    }
    m.x = dx
    m.y = dy
    m.vx = m.vy = 0
    writeShell()
  }, [canDrag, onHoldChange, setScaleTarget, writeShell])

  const onGatePointerEnd = useCallback((e) => {
    const s = dragStart.current
    if (!s || s.id !== e.pointerId) return
    dragStart.current = null
    setScaleTarget(1)
    if (!s.active) return // a tap: the sequence already started on press

    // Drag released: spring home, then resume the sequence
    suppressClick.current = true
    setDragging(false)
    const m = motion.current
    m.held = false
    const start = () => {
      onHoldChange && onHoldChange(false)
      onAdvanceGate && onAdvanceGate() // no-op unless the press didn't start it
    }
    if (reducedMotion.current) {
      m.x = m.y = 0
      writeShell()
      start()
      return
    }
    onSettle.current = start
    runMotion()
  }, [buzz, gateStep, onAdvanceGate, onHoldChange, runMotion, setScaleTarget, writeShell])

  /* ===================== Shop density logic (ported from ChakraOrbButton) ===================== */

  const lastFireRef = useRef(0)
  const FIRE_COOLDOWN_MS = 150

  const [pressColor, setPressColor] = useState(null) // '#00a832' | null
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [cycleStep, setCycleStep] = useState(0)

  const GREEN_ZOOM = '#00a832'
  const BLACK_GLOW = '#000000'
  const cycleLabels = ['5', '4', '3', '4', '5', 'stack']
  const nextCycleLabel = cycleLabels[cycleStep] || '5'

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

  const pulse = useCallback((c) => {
    setPressColor(c)
    const t = setTimeout(() => setPressColor(null), 210)
    return () => clearTimeout(t)
  }, [])

  const fireZoom = useCallback(
    (dir = null) => {
      const now = performance.now()
      if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return
      lastFireRef.current = now

      pulse(BLACK_GLOW)

      const detail = { step: 1, ...(dir ? { dir } : {}) }
      document.dispatchEvent(new CustomEvent('lb:zoom', { detail }))
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
      document.dispatchEvent(new CustomEvent('grid-density', { detail })) // legacy
    },
    [pulse]
  )

  const actions = [
    () => fireZoom('in'),  // stacks -> 5
    () => fireZoom('in'),  // 5 -> 4
    () => fireZoom('in'),  // 4 -> 3
    () => fireZoom('out'), // 3 -> 4
    () => fireZoom('out'), // 4 -> 5
    () => fireZoom('out'), // 5 -> stacks
  ]

  // mirror external zoom pulses visually
  useEffect(() => {
    const onExternal = (ev) => {
      if (ev?.detail?.dir) pulse(BLACK_GLOW)
    }
    document.addEventListener('lb:zoom', onExternal)
    return () => document.removeEventListener('lb:zoom', onExternal)
  }, [pulse])

  const onShopClick = useCallback(() => {
    actions[cycleStep]()
    setCycleStep((prev) => (prev + 1) % actions.length)
  }, [actions, cycleStep])

  const onShopTouchEnd = useCallback(
    (e) => {
      try { e.preventDefault() } catch {} // prevent subsequent onClick from double-firing
      actions[cycleStep]()
      setCycleStep((prev) => (prev + 1) % actions.length)
    },
    [actions, cycleStep]
  )
  const onShopContextMenu = useCallback((e) => { e.preventDefault() }, [])

  const onShopKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        actions[cycleStep]()
        setCycleStep((prev) => (prev + 1) % actions.length)
      }
    },
    [actions, cycleStep]
  )

  const onShopWheel = useCallback(
    (e) => {
      try { e.preventDefault() } catch {}
      actions[cycleStep]()
      setCycleStep((prev) => (prev + 1) % actions.length)
    },
    [actions, cycleStep]
  )

  const rpmValue = useMemo(() => {
    if (inGateLike) return 44
    return cycleStep === 0 || cycleStep >= 4 ? 44 : -44
  }, [inGateLike, cycleStep])

  /* ===================== Unified render ===================== */

  // Which click behavior is active depends on mode.
  const buttonHandlers = inGateLike
    ? {
        onClick: onGateClick,
        onPointerDown: onGatePointerDown,
        onPointerMove: onGatePointerMove,
        onPointerUp: onGatePointerEnd,
        onPointerCancel: onGatePointerEnd,
      }
    : {
        onClick: onShopClick,
        onTouchEnd: onShopTouchEnd,
        onContextMenu: onShopContextMenu,
        onKeyDown: onShopKeyDown,
        onWheel: onShopWheel,
      }

  const orbOverrideAllColor = inGateLike
    ? gateOverride
    : pressColor || (isNight ? WHITE : null)
  const orbHaloTint = inGateLike
    ? gateOverride === RED
      ? '#880011'        // deep blood-crimson — evil moon glow
      : gateOverride === BLACK
        ? '#444444'      // visible dark aura instead of near-invisible #111
        : null
    : pressColor === BLACK_GLOW
      ? '#444444'
      : pressColor || (isNight ? WHITE : null)

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
        : gateStep === 1 ? RED
        : gateStep === 2 ? ORANGE
        : gateStep === 3 ? YELLOW
        : gateStep === 4 ? GREEN
        : gateStep === 5 ? BLUE
        : gateStep === 6 ? PURPLE
        : gateStep === 7 ? PINK
        : SEAFOAM
      : SEAFOAM
    : isNight
      ? WHITE
      : SEAFOAM
  const orbSolidOverride = inGateLike ? gateSolid : false

  // Chakra steps blend into each other; on arrival in the shop the black orb
  // blooms back into its colours instead of cutting
  const GATE_FADE_MS = 60
  const LANDING_FADE_MS = 500
  const [landing, setLanding] = useState(false)
  const wasGateLike = useRef(inGateLike)
  useEffect(() => {
    if (wasGateLike.current && !inGateLike) {
      setLanding(true)
      const t = setTimeout(() => setLanding(false), 800)
      wasGateLike.current = inGateLike
      return () => clearTimeout(t)
    }
    wasGateLike.current = inGateLike
  }, [inGateLike])

  return (
    <div ref={shellRef} style={shellStyle}>
      <button
        type="button"
        aria-label={inGateLike ? 'Orb' : overlayOpen ? 'Back' : 'Zoom products'}
        title={
          inGateLike
            ? 'Enter (tap or drag)'
            : overlayOpen
              ? 'Back to grid'
              : 'Zoom products (Click = Smart IN/OUT • Right-click = OUT • Wheel = IN/OUT)'
        }
        data-orb={inGateLike ? 'gate' : 'density'}
        style={{
          padding: 0,
          margin: 0,
          border: 0,
          background: 'transparent',
          lineHeight: 0,
          cursor: dragging ? 'grabbing' : inGateLike && isProceeding ? 'default' : 'pointer',
          WebkitTapHighlightColor: 'transparent',
          // 'none' on the gate so touch moves reach the drag instead of panning
          touchAction: canDrag ? 'none' : 'manipulation',
          position: 'relative',
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
          includeYAxis={inGateLike ? true : cycleStep === 0 || cycleStep >= 4}
          includeZAxis={true}
          respectReducedMotion={false}
          interactive={!inGateLike || (!isProceeding && !loaderShow)}
          onActivate={null}
          overrideAllColor={orbOverrideAllColor}
          haloTint={orbHaloTint}
          flashDecayMs={inGateLike ? 0 : 140}
          solidOverride={orbSolidOverride}
          colorFadeMs={inGateLike ? GATE_FADE_MS : landing ? LANDING_FADE_MS : 0}
        />
        {!inGateLike && !overlayOpen && (
          <span
            style={{
              position: 'absolute',
              bottom: '-18px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              lineHeight: 1,
              color: 'white',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '2px 6px',
              borderRadius: '999px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {`Next: ${nextCycleLabel}`}
          </span>
        )}
      </button>
    </div>
  )
}
