// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Layers & Timings =============================== */
export const CASCADE_MS = 2400
const LAYERS = {
  BASE: 10000, // gate content
  WHITE: 10002, // white enlightenment (black orb/time/label live here)
  BANDS: 10006, // color bands container
  BANDS_LABEL: 10007, // "LAMEBOY, USA" over bands
}
const SEAFOAM = '#32ffc7'
const ORB_PX = 88
const P_SWITCH = 0.77273 // violet crosses center

/* ---------------- helpers ---------------- */
function useCenter(ref) {
  const measure = useCallback(() => {
    void ref?.current
  }, [ref])
  useLayoutEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    const id = requestAnimationFrame(measure)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
    }
  }, [measure])
}

function getGlobal() {
  if (typeof window !== 'undefined') return window
  return globalThis
}

/* ====================== RAF CASCADE ==================================== */
function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform, onProgress }) {
  const [mounted, setMounted] = useState(true)
  const started = useRef(false) // StrictMode guard
  const frameRef = useRef(0)
  const doneIdRef = useRef(null)

  useEffect(() => {
    if (started.current) return // prevent StrictMode double-run
    started.current = true

    let startTs
    const ease = t => 1 - Math.pow(1 - t, 3)
    const step = ts => {
      if (startTs == null) startTs = ts
      const raw = Math.min(1, (ts - startTs) / durationMs)
      const eased = ease(raw)
      onProgress?.(eased)
      if (raw < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        doneIdRef.current = setTimeout(() => setMounted(false), 80)
      }
    }
    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (doneIdRef.current) clearTimeout(doneIdRef.current)
    }
  }, [durationMs, onProgress])

  if (!mounted) return null

  const COLOR_VW = 120
  // travel right -> left
  const tx = t => (1 - t) * (100 + COLOR_VW) - COLOR_VW

  return createPortal(
    <>
      {/* Color pack above the white enlightenment */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: `${COLOR_VW}vw`,
          transform: `translate3d(${tx(0)}vw,0,0)`,
          zIndex: LAYERS.BANDS,
          pointerEvents: 'none',
          willChange: 'transform',
          background: 'transparent',
        }}
        ref={el => {
          if (!el) return
          // StrictMode-safe RAF: track local started flag
          let startedLocal = false
          let start, id
          const ease = t => 1 - Math.pow(1 - t, 3)
          const step = ts => {
            if (start == null) start = ts
            const raw = Math.min(1, (ts - start) / durationMs)
            const p = ease(raw)
            el.style.transform = `translate3d(${tx(p)}vw,0,0)`
            if (raw < 1) id = requestAnimationFrame(step)
          }
          if (!startedLocal) {
            startedLocal = true
            id = requestAnimationFrame(step)
          }
          return () => cancelAnimationFrame(id)
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
          }}
        >
          {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'].map(
            (c, i) => (
              <div key={i} style={{ position: 'relative', background: c }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: -18,
                    background: c,
                    filter: 'blur(28px)',
                    opacity: 0.95,
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* “LAMEBOY, USA” above bands */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: LAYERS.BANDS_LABEL, pointerEvents: 'none' }}
      >
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: labelTransform }}>
          <span
            className="chakra-label"
            style={{
              color: '#fff',
              mixBlendMode: 'difference',
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              fontSize: 'clamp(11px,1.3vw,14px)',
            }}
          >
            LAMEBOY, USA
          </span>
        </div>
      </div>
    </>,
    document.body
  )
}

/* =============================== Component ============================== */
export default function LandingGate({ onCascadeWhite, onCascadeComplete }) {
  // phases: idle → cascade → done
  const [phase, setPhase] = useState('idle')
  const labelRef = useRef(null)

  // singleton locks
  const global = getGlobal()
  if (!global.__lb) global.__lb = {}
  // true while a cascade is running anywhere
  const cascadeActiveRef = useRef(Boolean(global.__lb.cascadeActive))
  const pressedRef = useRef(false)
  const longPressFiredRef = useRef(false)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const whiteDispatchedRef = useRef(false) // ensure onCascadeWhite only once
  const cleanupDoneRef = useRef(false)

  /* Set "gate" mode */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode', 'gate')
    return () => {
      root.removeAttribute('data-mode')
      root.removeAttribute('data-cascade-active')
    }
  }, [])

  useCenter(labelRef)

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (cascadeActiveRef.current || global.__lb.cascadeActive) return // global singleton
    if (now - startedAtRef.current < 1200) return // debounce
    startedAtRef.current = now

    cascadeActiveRef.current = true
    global.__lb.cascadeActive = true

    document.documentElement.setAttribute('data-cascade-active', '1')
    setPhase('cascade')

    try {
      playChakraSequenceRTL()
    } catch {}

    try {
      sessionStorage.setItem('fromCascade', '1')
    } catch {}
  }, [global])

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  /* Unified pointer handling prevents touch→mouse double-firing */
  const onPointerDown = useCallback(
    e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      longPressFiredRef.current = false
      pressedRef.current = true

      clearTimers()
      timerRef.current = setTimeout(() => {
        longPressFiredRef.current = true
        if (!cascadeActiveRef.current) reallyStart()
      }, 650)
    },
    [reallyStart]
  )

  const onPointerUp = useCallback(
    e => {
      if (!pressedRef.current) return
      pressedRef.current = false
      const wasLong = longPressFiredRef.current
      longPressFiredRef.current = false
      clearTimers()
      // short tap starts (if long already fired, do nothing)
      if (!wasLong) {
        e.preventDefault()
        if (!cascadeActiveRef.current) reallyStart()
      }
    },
    [reallyStart]
  )

  const onPointerCancel = useCallback(() => {
    pressedRef.current = false
    longPressFiredRef.current = false
    clearTimers()
  }, [])

  // cascade → when near center, bring up white; then handoff to shop (once)
  const onCascadeProgress = useCallback(
    p => {
      if (!whiteDispatchedRef.current && p >= P_SWITCH - 0.06 && phase === 'cascade') {
        whiteDispatchedRef.current = true
        onCascadeWhite?.()
      }
      if (p >= P_SWITCH && phase === 'cascade') {
        setPhase('done')
        // release the global + data attr after the white has mounted
        setTimeout(() => {
          if (cleanupDoneRef.current) return
          cleanupDoneRef.current = true
          document.documentElement.removeAttribute('data-cascade-active')
          cascadeActiveRef.current = false
          global.__lb.cascadeActive = false
          onCascadeComplete?.()
        }, 60)
      }
    },
    [phase, onCascadeWhite, onCascadeComplete, global]
  )

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '1.5rem',
        position: 'relative',
        visibility: phase === 'idle' ? 'visible' : 'hidden',
        zIndex: LAYERS.BASE,
      }}
    >
      {/* Bands */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={`translate(-50%, calc(-50% + ${Math.round(ORB_PX / 2 + 6 + 8)}px))`}
          onProgress={onCascadeProgress}
        />
      )}

      {/* ORB */}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        title="Enter"
        aria-label="Enter"
        style={{
          position: 'relative',
          zIndex: LAYERS.BASE + 1,
          lineHeight: 0,
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.95}
          includeZAxis
          height="88px"
          interactive={false}
          flashDecayMs={140}
        />
      </button>

      {/* TIME (clickable) */}
      {phase === 'idle' && (
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="gate-white time-link"
          title="Enter"
          aria-label="Enter"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            fontFamily: 'inherit',
            lineHeight: 1.2,
            touchAction: 'manipulation',
          }}
        >
          <ClockNaples />
        </button>
      )}

      {/* Florida label */}
      <button
        ref={labelRef}
        type="button"
        className="gate-white florida-link"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        title="Enter"
        style={{
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          fontWeight: 800,
          letterSpacing: '.06em',
          fontSize: 'clamp(12px,1.3vw,14px)',
          fontFamily: 'inherit',
          color: '#ffffff',
          textShadow: `0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)`,
          touchAction: 'manipulation',
        }}
      >
        Florida, USA
      </button>

      <style jsx>{`
        :global(:root[data-mode='gate']) .chakra-band {
          min-height: 100%;
        }
      `}</style>
    </div>
  )
}

function ClockNaples() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }).format(new Date())
      )
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{now}</span>
}
