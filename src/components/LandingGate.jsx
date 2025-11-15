// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/**
 * One-shot cascade gate (BLACK):
 * - Orb + time + “Florida, USA”
 * - Vertical sweep (top → bottom) across horizontal bands
 * - Calls onCascadeWhite near the end; then hides itself
 */
export const CASCADE_MS = 2800 // slightly slower so it reads
const STAGGER_MS_PER_BAND = 36 // small stagger so bands clearly lead
const WHITE_CALL_MS = 2400 // notify parent before sweep fully clears

// Change this to 'horizontal' if you want columns (left → right) instead of rows.
const BANDS_ORIENT: 'vertical' | 'horizontal' = 'vertical'

export default function LandingGate({
  onCascadeWhite, // () => void
  onCascadeComplete, // () => void
}) {
  const [running, setRunning] = useState(false)
  const [hidden, setHidden] = useState(false)

  const lockRef = useRef(false)
  const timersRef = useRef({})

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(id => clearTimeout(id))
      timersRef.current = {}
    }
  }, [])

  const kick = useCallback(() => {
    if (lockRef.current || running || hidden) return
    lockRef.current = true
    setRunning(true)

    // Bring up WHITE + mount Shop right before the sweep ends.
    timersRef.current.white = setTimeout(() => {
      try {
        onCascadeWhite?.()
      } catch {}
    }, WHITE_CALL_MS)

    // Hide the gate after the sweep completes.
    timersRef.current.end = setTimeout(() => {
      setRunning(false)
      setHidden(true)
      try {
        onCascadeComplete?.()
      } catch {}
    }, CASCADE_MS)
  }, [hidden, running, onCascadeWhite, onCascadeComplete])

  // Keyboard a11y.
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        kick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kick])

  if (hidden) return null

  // 7-color chakra set.
  const COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc']

  return (
    <div
      role="dialog"
      aria-label="Landing"
      className="landing-gate"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400, // below WHITE (10002)
        background: '#000',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
      onPointerUp={kick}
    >
      {/* Center content */}
      <div style={{ display: 'grid', gap: 8, placeItems: 'center', lineHeight: 1.2 }}>
        <div style={{ lineHeight: 0 }}>
          <BlueOrbCross3D
            rpm={44}
            color="#32ffc7"
            geomScale={1.12}
            glow
            glowOpacity={0.95}
            includeZAxis
            height="88px"
            interactive={false}
            flashDecayMs={70}
          />
        </div>

        <button
          type="button"
          onPointerUp={kick}
          aria-label="Enter"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
          }}
        >
          <ClockNaples />
        </button>

        <button
          type="button"
          onPointerUp={kick}
          aria-label="Enter"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            color: '#fff',
            textShadow: '0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#faff00'
            e.currentTarget.style.textShadow =
              '0 0 10px rgba(250,255,0,.45), 0 0 18px rgba(250,255,0,.30)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.textShadow =
              '0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)'
          }}
        >
          Florida, USA
        </button>
      </div>

      {/* Sweep layer */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: running ? 1 : 0,
          transition: 'opacity 120ms ease',
        }}
      >
        {COLORS.map((c, i) => {
          const common = {
            position: 'absolute',
            background: c,
            filter: 'blur(18px)',
            opacity: 0.92,
            mixBlendMode: 'screen',
          }

          // For horizontal rows, we animate translateY (top→bottom).
          if (BANDS_ORIENT === 'vertical') {
            const bandH = 110 / COLORS.length // a hair taller to overlap
            return (
              <span
                key={i}
                style={{
                  ...common,
                  left: '-4vw',
                  width: '108vw',
                  height: `${bandH}vh`,
                  top: `${(i * 100) / COLORS.length}%`,
                  transform: 'translateY(-22%)',
                  animation: running
                    ? `lbSweepY ${CASCADE_MS}ms cubic-bezier(.22,.61,.21,.99) forwards`
                    : 'none',
                  animationDelay: `${i * STAGGER_MS_PER_BAND}ms`,
                }}
              />
            )
          }

          // For vertical columns, animate translateX (left→right).
          const bandW = 110 / COLORS.length
          return (
            <span
              key={i}
              style={{
                ...common,
                top: '-6vh',
                height: '112vh',
                width: `${bandW}vw`,
                left: `${(i * 100) / COLORS.length}%`,
                transform: 'translateX(-22%)',
                animation: running
                  ? `lbSweepX ${CASCADE_MS}ms cubic-bezier(.22,.61,.21,.99) forwards`
                  : 'none',
                animationDelay: `${i * STAGGER_MS_PER_BAND}ms`,
              }}
            />
          )
        })}

        {/* Tracking label during sweep (kept subtle) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform:
              BANDS_ORIENT === 'vertical'
                ? 'translate(-50%, calc(-50% + 56px))'
                : 'translate(calc(-50% + 0px), calc(-50% + 56px))',
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontSize: 'clamp(11px,1.3vw,14px)',
            mixBlendMode: 'difference',
            opacity: running ? 1 : 0,
          }}
        >
          LAMEBOY, USA
        </div>
      </div>

      <style jsx>{`
        @keyframes lbSweepY {
          0% {
            transform: translateY(-22%);
            opacity: 0;
          }
          8% {
            opacity: 0.95;
          }
          92% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(118%);
            opacity: 0;
          }
        }
        @keyframes lbSweepX {
          0% {
            transform: translateX(-22%);
            opacity: 0;
          }
          8% {
            opacity: 0.95;
          }
          92% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(118%);
            opacity: 0;
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
