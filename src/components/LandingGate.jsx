'use client'

import nextDynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playChakraSequenceRTL } from '@/lib/chakra-audio'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

/* =============================== Layers & Timings =============================== */
export const CASCADE_MS = 2400
const P_SWITCH = 0.77273 // when violet crosses center we flip to white + handoff
const ORB_PX = 88
const SEAFOAM = '#32ffc7'

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

  useEffect(() => {
    let start, rafId, doneId
    const ease = t => 1 - Math.pow(1 - t, 3)
    const step = t => {
      if (start == null) start = t
      const raw = Math.min(1, (t - start) / durationMs)
      const eased = ease(raw)
      onProgress?.(eased)
      if (raw < 1) rafId = requestAnimationFrame(step)
      else doneId = setTimeout(() => setMounted(false), 100)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (doneId) clearTimeout(doneId)
    }
  }, [durationMs, onProgress])

  if (!mounted) return null

  const COLOR_VW = 120
  const tx = t => (1 - t) * (100 + COLOR_VW) - COLOR_VW // travel right→left

  // Color bands (use CSS class hooks to own z-index)
  const bands = (
    <div
      aria-hidden
      className="chakra-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: `${COLOR_VW}vw`,
        transform: `translate3d(${tx(0)}vw,0,0)`,
        pointerEvents: 'none',
        willChange: 'transform',
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
    </div>
  )

  // Label over bands
  const label = (
    <div
      aria-hidden
      className="chakra-label"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
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
  )

  return createPortal(
    <>
      {bands}
      {label}
    </>,
    document.body
  )
}

/* =============================== Component ============================== */
export default function LandingGate({ onCascadeWhite, onCascadeComplete }) {
  // phases: idle → cascade → done
  const [phase, setPhase] = useState('idle')
  const labelRef = useRef(null)

  // debounce/lock to prevent double-shoot
  const locked = useRef(false)
  const pressTimer = useRef(null)
  const lastStartAt = useRef(0)
  const armedLongPress = useRef(false) // prevents click+long-press double fire

  // set "gate" mode
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
    if (locked.current) return
    if (now - lastStartAt.current < 1200) return // tighter guard — one start only
    locked.current = true
    lastStartAt.current = now

    document.documentElement.setAttribute('data-cascade-active', '1')
    setPhase('cascade')

    try {
      playChakraSequenceRTL()
    } catch {}
    try {
      sessionStorage.setItem('fromCascade', '1')
    } catch {}
  }, [])

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    armedLongPress.current = false
  }

  const runCascade = useCallback(
    e => {
      e?.preventDefault?.()
      // if a long-press already fired, ignore the trailing click-up
      if (armedLongPress.current) {
        clearPress()
        return
      }
      reallyStart()
    },
    [reallyStart]
  )

  // cascade → when near center, bring up white; then handoff to shop
  const onCascadeProgress = useCallback(
    p => {
      if (p >= P_SWITCH - 0.06 && phase === 'cascade') {
        onCascadeWhite?.()
      }
      if (p >= P_SWITCH && phase === 'cascade') {
        setPhase('done')
        setTimeout(() => {
          document.documentElement.removeAttribute('data-cascade-active')
          onCascadeComplete?.()
        }, 40)
      }
    },
    [phase, onCascadeWhite, onCascadeComplete]
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
      {/* Bands (portaled; class controls z-index) */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={`translate(-50%, calc(-50% + ${Math.round(ORB_PX / 2 + 6 + 8)}px))`}
          onProgress={onCascadeProgress}
        />
      )}

      {/* ORB — single action (click or long-press), with double-fire guard */}
      <button
        type="button"
        onClick={runCascade}
        onMouseDown={() => {
          clearPress()
          armedLongPress.current = true
          pressTimer.current = setTimeout(() => {
            reallyStart()
          }, 650)
        }}
        onMouseUp={clearPress}
        onMouseLeave={clearPress}
        onTouchStart={() => {
          clearPress()
          armedLongPress.current = true
          pressTimer.current = setTimeout(() => {
            reallyStart()
          }, 650)
        }}
        onTouchEnd={clearPress}
        title="Enter"
        aria-label="Enter"
        style={{
          position: 'relative',
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

      {/* TIME (clickable; stays white; click also starts cascade) */}
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

      {/* Florida label — white and clickable */}
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

      {/* Make sure bands fully cover height during gate */}
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
