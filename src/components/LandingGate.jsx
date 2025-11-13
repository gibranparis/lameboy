// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400 // visual travel time for the band pack
const SEAFOAM = '#32ffc7'

/* Geometry for center labels */
const ORB_PX = 88
const STACK_GAP = 6

/* Violet band crossing the center (50vw) */
const P_SWITCH = 0.77273

/* ---------------- helpers ---------------- */
function useShift() {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800
    const isPhone = h < 760
    return {
      vh: isPhone ? 4 : 3.5,
      micro: Math.round(Math.max(2, Math.min(10, h * 0.012))),
      gap: 6,
    }
  }
  const [s, setS] = useState(calc)
  useEffect(() => {
    const onR = () => setS(calc())
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])
  return s
}

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
      else doneId = setTimeout(() => setMounted(false), 80)
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
      {/* Solid black floor so no white flicker behind bands */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9997 }} />

      {/* COLOR band pack (no white underlay) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: `${COLOR_VW}vw`,
          transform: `translate3d(${bandsTx}vw,0,0)`,
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
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

      {/* “LAMEBOY, USA” — white over color via blend; stays on black fine */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: labelTransform,
          }}
        >
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
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → done
  const [phase, setPhase] = useState('idle')
  const [hovered, setHovered] = useState(false)
  const labelRef = useRef(null)
  const locked = useRef(false)
  const pressTimer = useRef(null)
  useShift() // keep viewport-aware density options available
  useCenter(labelRef)

  // Begin in "gate" mode and mark cascade-guard states
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

  const runCascade = useCallback(() => {
    if (locked.current) return
    locked.current = true
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
  }, [])

  // When the last violet band crosses center, complete to shop
  const onCascadeProgress = useCallback(
    p => {
      if (p >= P_SWITCH && phase === 'cascade') {
        setPhase('done') // overlay will unmount shortly
        // Clean up the cascade guard and hand off to Page
        try {
          document.documentElement.removeAttribute('data-cascade-active')
        } catch {}
        setTimeout(() => {
          try {
            onCascadeComplete?.()
          } catch {}
        }, 60)
      }
    },
    [phase, onCascadeComplete]
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
          labelTransform={`translate(-50%, calc(-50% + ${Math.round(
            ORB_PX / 2 + STACK_GAP + 8
          )}px))`}
          onProgress={onCascadeProgress}
        />
      )}

      {/* ORB — enter */}
      <button
        type="button"
        onClick={runCascade}
        onMouseDown={() => {
          clearTimeout(pressTimer.current)
          pressTimer.current = setTimeout(runCascade, 650)
        }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => {
          clearTimeout(pressTimer.current)
          pressTimer.current = setTimeout(runCascade, 650)
        }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
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
          interactive={false}
          flashDecayMs={140}
        />
      </button>

      {/* TIME — white (clickable in gate) */}
      {phase === 'idle' && (
        <button
          type="button"
          onClick={runCascade}
          title="Enter"
          aria-label="Enter"
          className="gate-white"
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={runCascade}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && runCascade()}
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
          color: hovered ? '#ffe600' : '#ffffff',
          textShadow: hovered
            ? `0 0 8px rgba(255,230,0,.95),
               0 0 18px rgba(255,210,0,.70),
               0 0 28px rgba(255,200,0,.45)`
            : `0 0 8px rgba(255,255,255,.45),
               0 0 16px rgba(255,255,255,.30)`,
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
