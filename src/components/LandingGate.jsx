// src/components/LandingGate.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/**
 * One-shot cascade gate:
 * - Shows BLACK gate with orb + time + "Florida, USA"
 * - On tap/click: plays sweep once, calls onCascadeWhite near the end, then hides itself
 * - No sessionStorage auto-hide (that caused the black-screen)
 */
export const CASCADE_MS = 2400 // total sweep duration
const WHITE_CALL_MS = 2100 // when to notify parent to show WHITE + mount shop

export default function LandingGate({
  onCascadeWhite, // () => void
  onCascadeComplete, // () => void
}) {
  const [running, setRunning] = useState(false)
  const [hidden, setHidden] = useState(false)

  const lockRef = useRef(false)
  const timersRef = useRef({})

  /* cleanup */
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

    // Tell the app to bring up WHITE and mount Shop just before the sweep ends
    timersRef.current.white = setTimeout(() => {
      try {
        onCascadeWhite?.()
      } catch {}
    }, WHITE_CALL_MS)

    // End: hide the gate so WHITE + Shop can be seen
    timersRef.current.end = setTimeout(() => {
      setRunning(false)
      setHidden(true)
      try {
        onCascadeComplete?.()
      } catch {}
    }, CASCADE_MS)
  }, [hidden, running, onCascadeWhite, onCascadeComplete])

  // keyboard accessibility (Enter/Space)
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
      // Any click on the gate starts the sweep
      onPointerUp={kick}
    >
      {/* Center column: Orb, time, Florida, USA */}
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
            // faster flash so it doesn’t look laggy
            flashDecayMs={70}
          />
        </div>
        <button
          type="button"
          onPointerUp={kick}
          className="gate-time"
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
          className="gate-florida"
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

      {/* PRESENTATIONAL sweep (right→left). We don’t render the white plane;
         your Page shows WhiteLoader when we call onCascadeWhite. */}
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
        {/* 7 chakra bands */}
        {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'].map(
          (c, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: `${(i * 100) / 7}%`,
                left: '-30vw',
                width: '160vw',
                height: `${110 / 7}vh`,
                transform: 'translateX(-18%)',
                background: c,
                filter: 'blur(18px)',
                opacity: 0.92,
                mixBlendMode: 'screen',
                animation: running
                  ? `lbSweep ${CASCADE_MS}ms cubic-bezier(.22,.61,.21,.99) forwards`
                  : 'none',
                animationDelay: `${i * 18}ms`,
              }}
            />
          )
        )}
        {/* LAMEBOY, USA overlay tracking the Florida line */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, calc(-50% + 56px))',
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
        @keyframes lbSweep {
          0% {
            transform: translateX(-18%);
            opacity: 0;
          }
          6% {
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
