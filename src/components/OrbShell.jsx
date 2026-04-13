// src/components/OrbShell.jsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'

export default function OrbShell({
  mode, // 'gate' | 'shop'
  loaderShow, // boolean
  gateStep, // 0..7
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
  const CHAKRA_BURST_COLORS = useMemo(
    () => ['#cc0014', '#e05500', '#ffd400', '#00a832', '#0066ff', '#3a00b5', '#9333ea', '#000'],
    []
  )
  const burstTimers = useRef([])
  const [burstColor, setBurstColor] = useState(null)
  const [burstActive, setBurstActive] = useState(false)

  const clearBurstTimers = useCallback(() => {
    burstTimers.current.forEach((t) => clearTimeout(t))
    burstTimers.current = []
  }, [])

  const startChakraBurst = useCallback((callback) => {
    if (!inGateLike) return
    if (isProceeding) return
    clearBurstTimers()

    // Mark burst as active to block gate color overrides
    setBurstActive(true)

    // Set first color immediately (synchronously) for instant burst
    setBurstColor(CHAKRA_BURST_COLORS[0])

    // Set remaining colors with staggered delays
    for (let index = 1; index < CHAKRA_BURST_COLORS.length; index++) {
      burstTimers.current.push(
        window.setTimeout(() => {
          setBurstColor(CHAKRA_BURST_COLORS[index])
        }, index * 80)
      )
    }

    // After burst completes (all colors shown + black held for 80ms), trigger callback
    burstTimers.current.push(
      window.setTimeout(() => {
        setBurstActive(false)
        if (callback && typeof callback === 'function') {
          callback()
        }
      }, CHAKRA_BURST_COLORS.length * 80 + 80)
    )
  }, [CHAKRA_BURST_COLORS, clearBurstTimers, inGateLike, isProceeding])

  useEffect(() => {
    return () => {
      clearBurstTimers()
      setBurstActive(false)
      setBurstColor(null)
    }
  }, [clearBurstTimers])
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
    startChakraBurst(onAdvanceGate)
  }, [inGateLike, isProceeding, onAdvanceGate, startChakraBurst])

  const onGateDouble = useCallback(() => {
    if (!inGateLike) return
    if (isProceeding) return
    startChakraBurst(onProceed)
  }, [inGateLike, isProceeding, onProceed, startChakraBurst])

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
        onMouseDown: startPressTimer,
        onMouseUp: clearPressTimer,
        onMouseLeave: clearPressTimer,
        onTouchStart: startPressTimer,
        onTouchEnd: clearPressTimer,
        onDoubleClick: onGateDouble,
      }
    : {
        onClick: onShopClick,
        onTouchEnd: onShopTouchEnd,
        onContextMenu: onShopContextMenu,
        onKeyDown: onShopKeyDown,
        onWheel: onShopWheel,
      }

  const orbOverrideAllColor = inGateLike
    ? burstColor !== null
      ? burstColor
      : gateOverride
    : pressColor || (isNight ? WHITE : null)
  const orbHaloTint = inGateLike
    ? burstActive
      ? null
      : gateOverride === RED
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

  return (
    <div style={shellStyle}>
      <button
        type="button"
        aria-label={inGateLike ? 'Orb' : overlayOpen ? 'Back' : 'Zoom products'}
        title={
          inGateLike
            ? 'Advance gate (click) • Proceed (hold or double-click)'
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
          cursor: inGateLike && isProceeding ? 'default' : 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
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
