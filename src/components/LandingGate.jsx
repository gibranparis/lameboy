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
  BASE: 10000, // gate content (black)
  WHITE: 10002, // white enlightenment (lives in Page via WhiteLoader)
  BANDS: 10006, // color bands container
}

const SEAFOAM = '#32ffc7'
const ORB_PX = 88
const GAP_BELOW_ORB_PX = 12
const LABEL_TRACK_Y = Math.round(ORB_PX / 2 + GAP_BELOW_ORB_PX + 8)

/**
 * We trigger WHITE at the very end (after the bands have fully crossed).
 * Choose a conservative threshold to avoid early “peek”:
 */
const P_WHITE = 0.998 // reveal WHITE only when sweep is effectively finished
const P_DONE = 1.0 // done when 100% (RAF clamps to 1)

/* ---------------- helpers ---------------- */
function useCenter(ref) {
  const measure = useCallback(() => void ref?.current, [ref])
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
function CascadeOverlay({ durationMs = CASCADE_MS, onProgress }) {
  const [mounted, setMounted] = useState(true)
  const started = useRef(false)
  const frameRef = useRef(0)
  const doneIdRef = useRef(null)

  useEffect(() => {
    if (started.current) return
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
        doneIdRef.current = setTimeout(() => setMounted(false), 60)
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
  const tx = t => (1 - t) * (100 + COLOR_VW) - COLOR_VW // right → left

  return createPortal(
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
        let start, id
        const ease = t => 1 - Math.pow(1 - t, 3)
        const step = ts => {
          if (start == null) start = ts
          const raw = Math.min(1, (ts - start) / durationMs)
          const p = ease(raw)
          el.style.transform = `translate3d(${tx(p)}vw,0,0)`
          if (raw < 1) id = requestAnimationFrame(step)
        }
        id = requestAnimationFrame(step)
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
    </div>,
    document.body
  )
}

/* =============================== Component ============================== */
export default function LandingGate({ onCascadeWhite, onCascadeComplete }) {
  // phases: idle → cascade → done
  const [phase, setPhase] = useState('idle')
  const labelRef = useRef(null)

  // global locks to kill double-fires (touch+mouse, StrictMode remount, etc.)
  const global = getGlobal()
  if (!global.__lb) global.__lb = {}
  const startedRef = useRef(Boolean(global.__lb.cascadeStarted))
  const activeRef = useRef(Boolean(global.__lb.cascadeActive))
  const pressedRef = useRef(false)
  const longPressFiredRef = useRef(false)
  const timerRef = useRef(null)
  const lastStartAt = useRef(0)
  const whiteSentRef = useRef(false)
  const doneSentRef = useRef(false)

  /* Gate mode */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode', 'gate')
    return () => {
      root.removeAttribute('data-mode')
      root.removeAttribute('data-cascade-active')
      root.removeAttribute('data-cascade-done')
    }
  }, [])

  useCenter(labelRef)

  const reallyStart = useCallback(() => {
    const now = performance.now()

    // hard one-shot guard
    if (startedRef.current || global.__lb.cascadeStarted) return
    if (activeRef.current || global.__lb.cascadeActive) return
    if (now - lastStartAt.current < 900) return
    lastStartAt.current = now

    startedRef.current = true
    global.__lb.cascadeStarted = true
    activeRef.current = true
    global.__lb.cascadeActive = true

    // mark active (bands visible via CSS; WHITE still hidden at this point)
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

  /* unified pointer to avoid touch→mouse duplicate start */
  const onPointerDown = useCallback(
    e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      longPressFiredRef.current = false
      pressedRef.current = true
      clearTimers()
      timerRef.current = setTimeout(() => {
        longPressFiredRef.current = true
        if (!activeRef.current) reallyStart()
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
      if (!wasLong) {
        e.preventDefault()
        if (!activeRef.current) reallyStart()
      }
    },
    [reallyStart]
  )

  const onPointerCancel = useCallback(() => {
    pressedRef.current = false
    longPressFiredRef.current = false
    clearTimers()
  }, [])

  // cascade → send WHITE only at the very end; finish when fully complete
  const onCascadeProgress = useCallback(
    p => {
      if (!whiteSentRef.current && p >= P_WHITE && phase === 'cascade') {
        whiteSentRef.current = true
        // WHITE appears now (bands just finished sweeping)
        try {
          onCascadeWhite?.()
        } catch {}
      }

      if (!doneSentRef.current && p >= P_DONE && phase === 'cascade') {
        doneSentRef.current = true
        setPhase('done')
        setTimeout(() => {
          const root = document.documentElement
          root.removeAttribute('data-cascade-active')
          root.setAttribute('data-cascade-done', '1')
          activeRef.current = false
          global.__lb.cascadeActive = false
          try {
            onCascadeComplete?.()
          } catch {}
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
        // keep the landing content visible in idle and cascade (BLACK) — only hidden once we’re done
        visibility: phase === 'done' ? 'hidden' : 'visible',
        zIndex: LAYERS.BASE,
      }}
    >
      {/* Bands only during cascade (over the black landing; UNDER the future WHITE) */}
      {phase === 'cascade' && (
        <CascadeOverlay durationMs={CASCADE_MS} onProgress={onCascadeProgress} />
      )}

      {/* ORB (landing enter button) */}
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
          height={`${ORB_PX}px`}
          interactive={false}
          flashDecayMs={70}
        />
      </button>

      {/* TIME */}
      {(phase === 'idle' || phase === 'cascade') && (
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
          visibility: phase === 'done' ? 'hidden' : 'visible',
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
