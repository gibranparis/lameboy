// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings / Layers =============================== */
export const CASCADE_MS = 2600
// Call WHITE a bit past halfway so black orb is already there as bands exit
const WHITE_CALL_PCT = 0.6
const FLASH_MS = 200
const LAYERS = {
  BASE: 10000,
  WHITE: 10002, // white page (black orb) lives above base; bands sit above WHITE
  BANDS: 10006,
  BANDS_LABEL: 10007,
}

const SEAFOAM = '#32ffc7'
const ORB_PX = 88
const GATE_MONO =
  '"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", monospace'

/* ========================== Utils / guards ========================== */
function getGlobal() {
  if (typeof window !== 'undefined') return window
  return globalThis
}
function useNoLayoutMeasure(ref) {
  useLayoutEffect(() => {
    void ref?.current
  }, [ref])
}

// defensively wrap callbacks so they can’t kill the sweep
function safeCall(fn, label) {
  if (typeof fn !== 'function') return
  try {
    fn()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[LandingGate] ${label} error`, err)
  }
}

/* ========================== Right→Left sweep ========================== */
function ChakraSweep({ durationMs = CASCADE_MS, onProgress }) {
  const startedRef = useRef(false)
  const rafRef = useRef(0)
  const rootRef = useRef(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const ease = (t) => 1 - Math.pow(1 - t, 3) // cubic ease-out
    let t0

    // Wider pack → guarantees complete coverage; prevents visual stall near end
    const COLOR_VW = 160
    const tx = (p) => (1 - p) * (100 + COLOR_VW) - COLOR_VW // 160vw → -60vw

    const step = (ts) => {
      if (t0 == null) t0 = ts
      const raw = Math.min(1, (ts - t0) / durationMs)
      const p = ease(raw)
      const el = rootRef.current
      if (el) el.style.transform = `translate3d(${tx(p)}vw,0,0)`

      try {
        onProgress?.(p)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[LandingGate] onProgress error', err)
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [durationMs, onProgress])

  return createPortal(
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: '0 auto 0 0',
        height: '100vh',
        width: '160vw',
        zIndex: LAYERS.BANDS,
        pointerEvents: 'none',
        willChange: 'transform',
        transform: 'translate3d(160vw,0,0)',
        background: 'transparent',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
      }}
    >
      {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'].map((c, i) => (
        <div key={i} style={{ position: 'relative', background: c }}>
          <span
            style={{
              position: 'absolute',
              inset: -24,
              background: c,
              filter: 'blur(28px)',
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
  const phaseRef = useRef('idle')
  const [phaseState, setPhaseState] = useState('idle')
  const setPhase = useCallback((next) => {
    const value = typeof next === 'function' ? next(phaseRef.current) : next
    phaseRef.current = value
    setPhaseState(value)
  }, [])

  const labelRef = useRef(null)
  useNoLayoutMeasure(labelRef)

  const [labelVisible, setLabelVisible] = useState(true)

  // put document into "gate" mode while this component is mounted
  useEffect(() => {
    const root = document.documentElement
    const prevMode = root.getAttribute('data-mode')

    root.setAttribute('data-mode', 'gate')

    return () => {
      // only restore if nothing else changed it
      if (root.getAttribute('data-mode') === 'gate') {
        if (prevMode) root.setAttribute('data-mode', prevMode)
        else root.removeAttribute('data-mode')
      }
    }
  }, [])

  // singleton lock
  const global = getGlobal()
  if (!global.__lb) global.__lb = {}
  const localLockRef = useRef(Boolean(global.__lb.cascadeActive))

  // presses
  const pressedRef = useRef(false)
  const longPressRef = useRef(false)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const whiteCalledRef = useRef(false)
  const cleanedRef = useRef(false)

  const callWhitePhase = useCallback(() => {
    if (whiteCalledRef.current) return
    whiteCalledRef.current = true
    try {
      document.documentElement.setAttribute('data-white-phase', '1')
    } catch {}
    safeCall(onCascadeWhite, 'onCascadeWhite')
  }, [onCascadeWhite])

  // tokens
  useEffect(() => {
    const root = document.documentElement
    return () => {
      root.removeAttribute('data-cascade-active')
      root.removeAttribute('data-cascade-done')
      root.removeAttribute('data-white-phase')
    }
  }, [])

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const flashGate = useCallback(() => {
    try {
      document.documentElement.setAttribute('data-gate-flash', '1')
      setTimeout(() => {
        document.documentElement.removeAttribute('data-gate-flash')
      }, FLASH_MS)
    } catch {}
  }, [])

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (localLockRef.current || global.__lb.cascadeActive) return
    if (now - startedAtRef.current < 400) return
    startedAtRef.current = now

    localLockRef.current = true
    global.__lb.cascadeActive = true
    whiteCalledRef.current = false
    setLabelVisible(true)

    document.documentElement.setAttribute('data-cascade-active', '1')
    flashGate()
    setPhase('cascade')

    try {
      playChakraSequenceRTL()
    } catch {}
    try {
      sessionStorage.setItem('fromCascade', '1')
    } catch {}
  }, [flashGate, global, setPhase])

  const onPointerDown = useCallback(
    (e) => {
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
    (e) => {
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

  const handleProgress = useCallback(
    (p) => {
      const phase = phaseRef.current

      // Show WHITE under bands & start mounting black orb page
      if (!whiteCalledRef.current && p >= WHITE_CALL_PCT && phase === 'cascade') {
        callWhitePhase()
      }

      // Let "LAMEBOY, USA" ride with the pack then disappear before the end
      if (p >= 0.82 && phase === 'cascade') {
        setLabelVisible(false)
      }

      // End
      if (p >= 1 && phase === 'cascade') {
        setPhase('done')
        const root = document.documentElement
        root.removeAttribute('data-cascade-active')
        root.setAttribute('data-cascade-done', '1')
        if (cleanedRef.current) return
        cleanedRef.current = true
        localLockRef.current = false
        global.__lb.cascadeActive = false
        safeCall(onCascadeComplete, 'onCascadeComplete')
      }
    },
    [callWhitePhase, onCascadeComplete, setPhase, global]
  )

  // Hard fallback: if the rAF loop dies, force-complete
  useEffect(() => {
    if (phaseState !== 'cascade') return
    const id = setTimeout(() => {
      if (phaseRef.current === 'cascade') {
        handleProgress(1)
      }
    }, CASCADE_MS + 600)
    return () => clearTimeout(id)
  }, [phaseState, handleProgress])

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
        visibility: 'visible',
      }}
    >
      {phaseState === 'cascade' && (
        <ChakraSweep durationMs={CASCADE_MS} onProgress={handleProgress} />
      )}

      {phaseState === 'cascade' &&
        labelVisible &&
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
                style={{
                  color: '#fff',
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  fontSize: 'clamp(11px,1.3vw,14px)',
                  textShadow: '0 0 12px rgba(0,0,0,0.35)',
                }}
              >
                LAMEBOY, USA
              </span>
            </div>
          </div>,
          document.body
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
        data-role="gate-text"
        title="Enter"
        aria-label="Enter"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px 0',
          cursor: 'pointer',
          color: '#7c7c84',
          fontWeight: 800,
          letterSpacing: '.10em',
          fontSize: '12px',
          fontFamily: GATE_MONO,
          lineHeight: 1.2,
          marginTop: 8,
          touchAction: 'manipulation',
          textTransform: 'uppercase',
          textShadow:
            '0 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(120,120,120,0.26), 0 0 12px rgba(120,120,120,0.18)',
        }}
      >
        <ClockNaples />
      </button>

      {/* Florida label */}
      <button
        ref={labelRef}
        type="button"
        className="gate-white florida-link"
        data-role="gate-text"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        title="Enter"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px 0',
          cursor: 'pointer',
          fontWeight: 800,
          letterSpacing: '.10em',
          fontSize: '12px',
          fontFamily: GATE_MONO,
          color: '#7c7c84',
          textTransform: 'uppercase',
          textShadow:
            '0 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(120,120,120,0.26), 0 0 12px rgba(120,120,120,0.18)',
          touchAction: 'manipulation',
          marginTop: 6,
          transition: 'color .12s linear, text-shadow .12s linear',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#8a8a92'
          e.currentTarget.style.textShadow =
            '0 1px 0 rgba(255,255,255,0.5), 0 0 10px rgba(140,140,140,0.24), 0 0 18px rgba(140,140,140,0.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#7c7c84'
          e.currentTarget.style.textShadow =
            '0 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(120,120,120,0.26), 0 0 12px rgba(120,120,120,0.18)'
        }}
      >
        Florida, USA
      </button>

      <style jsx global>{`
        .page-center {
          transition: opacity 140ms ease;
        }
        :root[data-cascade-done='1'] .page-center,
        :root[data-white-phase] .page-center {
          opacity: 0;
          visibility: hidden;
        }
        :root[data-mode='gate'] .gate-white,
        :root[data-mode='gate'] .florida-link {
          color: #4a7cff;
        }
        :root[data-mode='gate'][data-gate-flash='1'] .gate-white,
        :root[data-mode='gate'][data-gate-flash='1'] .florida-link {
          color: #faff00;
          text-shadow:
            0 0 10px rgba(250, 255, 0, 0.55),
            0 0 18px rgba(250, 255, 0, 0.35);
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
