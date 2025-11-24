// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings / Layers =============================== */
export const CASCADE_MS = 2400
// Call WHITE later in the sweep to keep bands moving while prepping orb
const WHITE_CALL_PCT = 0.64
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
/** Pure CSS sweep – no rAF, just a one-shot animation */
function ChakraSweep() {
  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: '0 auto 0 0',
        height: '100vh',
        width: '160vw',
        zIndex: LAYERS.BANDS,
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        willChange: 'transform',
        // start fully off-screen to the right
        transform: 'translate3d(100vw, 0, 0)',
        // 100vw -> -160vw so it fully exits left
        animation: `lbChakraSweep ${CASCADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
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
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
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

  const finishCascade = useCallback(() => {
    const phase = phaseRef.current
    if (phase !== 'cascade') return

    setPhase('done')
    const root = document.documentElement
    root.removeAttribute('data-cascade-active')
    root.setAttribute('data-cascade-done', '1')

    if (cleanedRef.current) return
    cleanedRef.current = true
    localLockRef.current = false
    global.__lb.cascadeActive = false
    safeCall(onCascadeComplete, 'onCascadeComplete')
  }, [onCascadeComplete, setPhase, global])

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (localLockRef.current || global.__lb.cascadeActive) return
    if (now - startedAtRef.current < 800) return
    startedAtRef.current = now

    localLockRef.current = true
    global.__lb.cascadeActive = true

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

  // Drive WHITE + completion with simple timers once cascade starts
  useEffect(() => {
    if (phaseState !== 'cascade') return

    const whiteTimer = setTimeout(() => {
      callWhitePhase()
    }, WHITE_CALL_PCT * CASCADE_MS)

    const doneTimer = setTimeout(() => {
      finishCascade()
    }, CASCADE_MS)

    return () => {
      clearTimeout(whiteTimer)
      clearTimeout(doneTimer)
    }
  }, [phaseState, callWhitePhase, finishCascade])

  const gateContentVisible = phaseState !== 'cascade'

  return (
    <div
      className="page-center"
      onClick={reallyStart}
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
        cursor: 'pointer',
      }}
    >
      {phaseState === 'cascade' && <ChakraSweep />}

      {phaseState === 'cascade' &&
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
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontWeight: 900,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  fontSize: 'clamp(12px,1.4vw,16px)',
                  textShadow:
                    '0 0 10px rgba(255,255,255,0.9), 0 0 26px rgba(255,255,255,0.85), 0 0 42px rgba(120,200,255,0.9)',
                }}
              >
                LAMEBOY, USA
              </span>
            </div>
          </div>,
          document.body
        )}

      {/* ORB + labels only when not cascading */}
      {gateContentVisible && (
        <>
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
          color: '#000',
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
          color: '#000',
          textTransform: 'uppercase',
          textShadow:
            '0 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(120,120,120,0.26), 0 0 12px rgba(120,120,120,0.18)',
          touchAction: 'manipulation',
          marginTop: 6,
              transition: 'color .12s linear, text-shadow .12s linear',
            }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#111'
          e.currentTarget.style.textShadow =
            '0 1px 0 rgba(255,255,255,0.5), 0 0 10px rgba(140,140,140,0.24), 0 0 18px rgba(140,140,140,0.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#000'
          e.currentTarget.style.textShadow =
            '0 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(120,120,120,0.26), 0 0 12px rgba(120,120,120,0.18)'
        }}
      >
            Florida, USA
          </button>
        </>
      )}

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

        /* UPDATED: single-pass chakra sweep that actually exits the viewport */
        @keyframes lbChakraSweep {
          0% {
            transform: translate3d(100vw, 0, 0); /* fully off-screen right */
          }
          100% {
            transform: translate3d(-160vw, 0, 0); /* fully off-screen left */
          }
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
