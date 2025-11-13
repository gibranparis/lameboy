'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400 // visual travel time
const SEAFOAM = '#32ffc7'
const ORB_PX = 88
const P_SWITCH = 0.77273 // violet crossing center
const SAFETY_ADVANCE_MS = 2600 // hard fallback if RAF throttles

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

/* ====================== RAF CASCADE ==================================== */
function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform, onProgress, whiteOn }) {
  const [mounted, setMounted] = useState(true)
  const rafRef = useRef(0)
  const doneRef = useRef(0)

  useEffect(() => {
    let start
    const ease = t => 1 - Math.pow(1 - t, 3)
    const step = t => {
      if (start == null) start = t
      const raw = Math.min(1, (t - start) / durationMs)
      const eased = ease(raw)
      onProgress?.(eased)
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        doneRef.current = window.setTimeout(() => setMounted(false), 100)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (doneRef.current) clearTimeout(doneRef.current)
    }
  }, [durationMs, onProgress])

  if (!mounted) return null

  const COLOR_VW = 120

  return createPortal(
    <>
      {/* Floor becomes WHITE as soon as white phase is armed */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: whiteOn ? '#fff' : '#000',
          zIndex: 9997,
          transition: 'background 120ms linear',
        }}
      />

      {/* COLOR band pack (RTL sweep) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
          display: 'grid',
          gridTemplateColumns: `minmax(0, ${COLOR_VW}vw) 1fr`,
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              transform: 'translate3d(var(--bands-x,0),0,0)',
              transition: 'none',
            }}
            id="lb-bands"
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
        <div />
      </div>

      {/* “LAMEBOY, USA” over bands */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}
      >
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: labelTransform }}>
          <span
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
  const [whiteOn, setWhiteOn] = useState(false) // NEW: track when white is armed
  const labelRef = useRef(null)

  // hard, global lock against double-triggers across input types
  const locked = useRef(false)
  const pressTimer = useRef(null)
  const lastStartAt = useRef(0)
  const safetyTimer1 = useRef(0)
  const safetyTimer2 = useRef(0)

  // Begin in "gate" mode
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-mode', 'gate')
    } catch {}
    return () => {
      try {
        document.documentElement.removeAttribute('data-mode')
      } catch {}
    }
  }, [])

  useCenter(labelRef)

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }
  const clearSafeties = () => {
    if (safetyTimer1.current) {
      clearTimeout(safetyTimer1.current)
      safetyTimer1.current = 0
    }
    if (safetyTimer2.current) {
      clearTimeout(safetyTimer2.current)
      safetyTimer2.current = 0
    }
  }

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (locked.current) return
    if (now - lastStartAt.current < 2500) return // once per 2.5s

    locked.current = true
    lastStartAt.current = now

    try {
      document.documentElement.setAttribute('data-cascade-active', '1')
    } catch {}
    setPhase('cascade')

    try {
      playChakraSequenceRTL()
    } catch {}
    try {
      sessionStorage.setItem('fromCascade', '1')
    } catch {}

    // SAFETY: arm white a little before the switch; then hard-advance to shop
    safetyTimer1.current = window.setTimeout(() => {
      setWhiteOn(true)
      try {
        onCascadeWhite?.()
      } catch {}
    }, Math.max(0, P_SWITCH * CASCADE_MS - 260 /* earlier arm */))

    safetyTimer2.current = window.setTimeout(() => {
      setPhase('done')
      try {
        onCascadeComplete?.()
      } catch {}
    }, SAFETY_ADVANCE_MS)
  }, [onCascadeWhite, onCascadeComplete])

  const runCascade = useCallback(
    e => {
      e?.preventDefault?.()
      clearPress()
      clearSafeties()
      reallyStart()
    },
    [reallyStart]
  )

  // When the bands cross center, call white → then shop
  const onCascadeProgress = useCallback(
    p => {
      // Arm white *earlier* to avoid any black tail under bands.
      if (!whiteOn && p >= P_SWITCH - 0.1 && phase === 'cascade') {
        setWhiteOn(true)
        try {
          onCascadeWhite?.()
        } catch {}
      }
      if (p >= P_SWITCH && phase === 'cascade') {
        setPhase('done')
        setTimeout(() => {
          try {
            onCascadeComplete?.()
          } catch {}
        }, 40)
        clearSafeties()
      }

      // move bands for sanity/inspection
      const COLOR_VW = 120
      const x = ((1 - p) * (100 + COLOR_VW) - COLOR_VW).toFixed(3) + 'vw'
      try {
        document.getElementById('lb-bands')?.style.setProperty('--bands-x', `${x}`)
      } catch {}
    },
    [phase, whiteOn, onCascadeWhite, onCascadeComplete]
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
      }}
    >
      {/* CASCADE */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={`translate(-50%, calc(-50% + ${Math.round(ORB_PX / 2 + 6 + 8)}px))`}
          onProgress={onCascadeProgress}
          whiteOn={whiteOn} /* <- floor flips to white here */
        />
      )}

      {/* ORB — enter */}
      <button
        type="button"
        onClick={runCascade}
        onMouseDown={() => {
          clearPress()
          pressTimer.current = setTimeout(reallyStart, 650)
        }}
        onMouseUp={clearPress}
        onMouseLeave={clearPress}
        onTouchStart={() => {
          clearPress()
          pressTimer.current = setTimeout(reallyStart, 650)
        }}
        onTouchEnd={clearPress}
        title="Enter"
        aria-label="Enter"
        style={{
          position: 'relative',
          zIndex: 10004,
          lineHeight: 0,
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
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
          __interactive={false}
          flashDecayMs={140}
        />
      </button>

      {/* TIME (white, clickable in gate) */}
      {phase === 'idle' && (
        <button
          type="button"
          onClick={runCascade}
          className="gate-white"
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
          }}
        >
          <ClockNaples />
        </button>
      )}

      {/* Florida label — white (hover = neon yellow) */}
      <button
        ref={labelRef}
        type="button"
        className="gate-white"
        onClick={runCascade}
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
