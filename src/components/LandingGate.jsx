// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings / Layers =============================== */
export const CASCADE_MS = 2400
const WHITE_CALL_PCT = 0.985 // call white near the very end (after the pack clears)
const LAYERS = {
  BASE: 10000,
  WHITE: 10002, // white enlightenment lives above content, bands sit above this
  BANDS: 10006,
  BANDS_LABEL: 10007,
}

const SEAFOAM = '#32ffc7'
const ORB_PX = 88

/* ========================== Utils / guards ========================== */
function getGlobal() {
  if (typeof window !== 'undefined') return window
  return globalThis
}

function useNoLayoutMeasure(ref) {
  // keep for future layout reads; currently a no-op (prevents extra reflows)
  useLayoutEffect(() => {
    void ref?.current
  }, [ref])
}

/* ========================== Right→Left sweep ========================== */
/**
 * A single moving "pack" of 7 vertical columns (chakra colors) that travels
 * from right → left across the whole viewport. We drive it with RAF using
 * a cubic ease, so it matches your old feel and is jank-free on mobile.
 */
function ChakraSweep({ durationMs = CASCADE_MS, onProgress }) {
  const startedRef = useRef(false)
  const rafRef = useRef(0)
  const rootRef = useRef(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const ease = t => 1 - Math.pow(1 - t, 3)
    let t0

    const COLOR_VW = 120 // pack width so it fully covers the screen
    const tx = p => (1 - p) * (100 + COLOR_VW) - COLOR_VW // 120vw → -20vw

    const step = ts => {
      if (t0 == null) t0 = ts
      const raw = Math.min(1, (ts - t0) / durationMs)
      const p = ease(raw)
      const el = rootRef.current
      if (el) {
        el.style.transform = `translate3d(${tx(p)}vw,0,0)`
      }
      onProgress?.(p)
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [durationMs, onProgress])

  // Render the moving pack in a fixed container
  return createPortal(
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: '0 auto 0 0',
        height: '100vh',
        width: '120vw',
        zIndex: LAYERS.BANDS,
        pointerEvents: 'none',
        willChange: 'transform',
        transform: 'translate3d(120vw,0,0)', // start fully off-screen on the right
        background: 'transparent',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)', // vertical columns
      }}
    >
      {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'].map((c, i) => (
        <div key={i} style={{ position: 'relative', background: c }}>
          <span
            style={{
              position: 'absolute',
              inset: -20,
              background: c,
              filter: 'blur(26px)',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          />
        </div>
      ))}
    </div>,
    document.body
  )
}

/* =============================== Component ============================== */
export default function LandingGate({ onCascadeWhite, onCascadeComplete }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'cascade' | 'done'
  const labelRef = useRef(null)
  useNoLayoutMeasure(labelRef)

  // singleton lock to prevent double starts
  const global = getGlobal()
  if (!global.__lb) global.__lb = {}
  const localLockRef = useRef(Boolean(global.__lb.cascadeActive))

  // press handling (tap or long press)
  const pressedRef = useRef(false)
  const longPressRef = useRef(false)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const whiteCalledRef = useRef(false)
  const cleanedRef = useRef(false)

  /* Mode tokens */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode', 'gate')
    return () => {
      root.removeAttribute('data-mode')
      root.removeAttribute('data-cascade-active')
      root.removeAttribute('data-cascade-done')
    }
  }, [])

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (localLockRef.current || global.__lb.cascadeActive) return
    if (now - startedAtRef.current < 800) return // debounce
    startedAtRef.current = now

    localLockRef.current = true
    global.__lb.cascadeActive = true

    const root = document.documentElement
    root.setAttribute('data-cascade-active', '1')

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

  const onPointerDown = useCallback(
    e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      longPressRef.current = false
      pressedRef.current = true
      clearTimers()
      timerRef.current = setTimeout(() => {
        longPressRef.current = true
        if (!localLockRef.current) reallyStart()
      }, 650)
    },
    [reallyStart]
  )

  const onPointerUp = useCallback(
    e => {
      if (!pressedRef.current) return
      pressedRef.current = false
      const wasLong = longPressRef.current
      longPressRef.current = false
      clearTimers()
      if (!wasLong) {
        e.preventDefault()
        if (!localLockRef.current) reallyStart()
      }
    },
    [reallyStart]
  )

  const onPointerCancel = useCallback(() => {
    pressedRef.current = false
    longPressRef.current = false
    clearTimers()
  }, [])

  /* Sweep progress → call white very late, then finish */
  const handleProgress = useCallback(
    p => {
      if (!whiteCalledRef.current && p >= WHITE_CALL_PCT && phase === 'cascade') {
        whiteCalledRef.current = true
        onCascadeWhite?.() // parent shows WHITE & flips shop to day behind it
      }
      if (p >= 1 && phase === 'cascade') {
        setPhase('done')
        const root = document.documentElement
        root.removeAttribute('data-cascade-active')
        root.setAttribute('data-cascade-done', '1')
        // small async tick so DOM attributes settle
        setTimeout(() => {
          if (cleanedRef.current) return
          cleanedRef.current = true
          localLockRef.current = false
          global.__lb.cascadeActive = false
          onCascadeComplete?.()
        }, 40)
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
        zIndex: LAYERS.BASE,
        // While the sweep runs, keep landing content visible (your spec),
        // the pack visually covers it because it sits on higher z-index.
        visibility: 'visible',
      }}
    >
      {/* Moving right→left pack (only during cascade) */}
      {phase === 'cascade' && <ChakraSweep durationMs={CASCADE_MS} onProgress={handleProgress} />}

      {/* “LAMEBOY, USA” label riding with the pack (difference blend for legibility) */}
      {phase === 'cascade' &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: LAYERS.BANDS_LABEL,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, calc(-50% + 56px))',
              }}
            >
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
          </div>,
          document.body
        )}

      {/* ORB button (landing) */}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        title="Enter"
        aria-label="Enter"
        style={{
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
          height={`${ORB_PX}px`}
          interactive={false}
          flashDecayMs={70}
        />
      </button>

      {/* TIME */}
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
          marginTop: 8,
          touchAction: 'manipulation',
        }}
      >
        <ClockNaples />
      </button>

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
          marginTop: 6,
          transition: 'color .12s linear, text-shadow .12s linear',
          mixBlendMode: 'difference',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#faff00'
          e.currentTarget.style.textShadow =
            '0 0 10px rgba(250, 255, 0, .45), 0 0 18px rgba(250, 255, 0, .30)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#ffffff'
          e.currentTarget.style.textShadow =
            '0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)'
        }}
      >
        Florida, USA
      </button>
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
