'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400 // visual travel time for the band pack
const SEAFOAM = '#32ffc7'
const ORB_PX = 88
const P_SWITCH = 0.77273 // violet crossing center

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
function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform, onProgress }) {
  const [mounted, setMounted] = useState(true)
  const [p, setP] = useState(0)

  useEffect(() => {
    let start, rafId, doneId
    const ease = t => 1 - Math.pow(1 - t, 3)
    const step = t => {
      if (start == null) start = t
      const raw = Math.min(1, (t - start) / durationMs)
      const eased = ease(raw)
      setP(eased)
      onProgress?.(eased)
      if (raw < 1) rafId = requestAnimationFrame(step)
      else doneId = setTimeout(() => setMounted(false), 60)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (doneId) clearTimeout(doneId)
    }
  }, [durationMs, onProgress])

  if (!mounted) return null

  const COLOR_VW = 120
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW

  return createPortal(
    <>
      {/* NO BLACK FLOOR! Only the colored bands. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: `${COLOR_VW}vw`,
          transform: `translate3d(${bandsTx}vw,0,0)`,
          zIndex: 10010, // below the white enlightenment we draw from Page
          pointerEvents: 'none',
          willChange: 'transform',
          background: 'transparent',
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

      {/* “LAMEBOY, USA” over bands (mix-blend keeps it legible) */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 10012, pointerEvents: 'none' }}
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
  const [phase, setPhase] = useState('idle')
  const labelRef = useRef(null)

  // Single-run lock (no double triggers)
  const locked = useRef(false)
  const lastStartAt = useRef(0)

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

  const reallyStart = useCallback(() => {
    const now = performance.now()
    if (locked.current) return
    if (now - lastStartAt.current < 2200) return // safety window
    locked.current = true
    lastStartAt.current = now

    // Immediately announce cascade to CSS (hide grids etc.)
    try {
      document.documentElement.setAttribute('data-cascade-active', '1')
      sessionStorage.setItem('fromCascade', '1')
    } catch {}

    // Raise WHITE first so there is never a black tail visible.
    try {
      onCascadeWhite?.()
    } catch {}

    // Kick SFX (non-blocking)
    try {
      playChakraSequenceRTL()
    } catch {}

    setPhase('cascade')
  }, [onCascadeWhite])

  // When the last violet band is near center, hand off to the Shop.
  const onCascadeProgress = useCallback(
    p => {
      if (p >= P_SWITCH && phase === 'cascade') {
        setPhase('done')
        setTimeout(() => {
          try {
            onCascadeComplete?.()
          } catch {}
        }, 40)
      }
    },
    [phase, onCascadeComplete]
  )

  const runCascade = useCallback(
    e => {
      e?.preventDefault?.()
      reallyStart()
    },
    [reallyStart]
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
      }}
    >
      {/* CASCADE */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={`translate(-50%, calc(-50% + ${Math.round(ORB_PX / 2 + 6 + 8)}px))`}
          onProgress={onCascadeProgress}
        />
      )}

      {/* ORB — single click to enter (no long-press timers that can double-fire) */}
      <button
        type="button"
        onClick={runCascade}
        title="Enter"
        aria-label="Enter"
        style={{
          position: 'relative',
          zIndex: 10014,
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

      {/* TIME — visible in gate */}
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
        onClick={runCascade}
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
        }}
      >
        Florida, USA
      </button>

      <style jsx>{`
        :global(.chakra-overlay) {
          background: transparent !important;
        }
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
