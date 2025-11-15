// src/components/LandingGate.jsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const CASCADE_MS = 2400 // total sweep
const BANDS_LEAD_MS = 320 // bands lead before white curtain (visual only)
const WHITE_CALL_MS = 2100 // when we tell app to show White (just before sweep ends)

export default function LandingGate({
  className = '',
  onCascadeWhite, // () => void  — show White + mount shop
  onCascadeComplete, // () => void  — optional telemetry
}) {
  const [running, setRunning] = useState(false)
  const [hidden, setHidden] = useState(false) // once true, gate unmounts visually

  const lockRef = useRef(false)
  const timersRef = useRef({})

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(id => clearTimeout(id))
      timersRef.current = {}
    }
  }, [])

  const kick = () => {
    if (lockRef.current || running || hidden) return
    lockRef.current = true
    setRunning(true)
    // small state mark for downstream (optional)
    try {
      sessionStorage.setItem('fromCascade', '1')
    } catch {}

    // 1) Visual bands lead (CSS handles look; JS schedules handoff)
    // 2) Tell app to show White + mount Shop *before* the sweep fully finishes
    timersRef.current.white = setTimeout(() => {
      // One-shot guard
      try {
        if (typeof onCascadeWhite === 'function') onCascadeWhite()
      } catch {}
    }, Math.max(0, WHITE_CALL_MS))

    // 3) End of sweep → hide gate completely so it cannot render over Shop
    timersRef.current.end = setTimeout(() => {
      setHidden(true)
      setRunning(false)
      try {
        if (typeof onCascadeComplete === 'function') onCascadeComplete()
      } catch {}
    }, Math.max(WHITE_CALL_MS + (CASCADE_MS - WHITE_CALL_MS), CASCADE_MS))
  }

  // If we already handed off in a previous navigation (rare), stay hidden
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setHidden(true)
      }
    } catch {}
  }, [])

  if (hidden) return null

  return (
    <div
      className={['landing-gate', running ? 'is-running' : '', className].join(' ')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400, // Below the White loader (which uses ~10002)
        background: '#000', // Gate is black
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Center stack */}
      <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
        {/* Your orb/title can live here if desired */}

        <button
          type="button"
          onClick={kick}
          aria-label="Enter"
          style={{
            appearance: 'none',
            border: 'none',
            borderRadius: 9999,
            background: '#fff',
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            padding: '10px 18px',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,.35)',
          }}
        >
          ENTER
        </button>
      </div>

      {/* ---- Visual sweep layers (purely presentational) ---- */}
      {/* Bands lead the sweep, then an implied “white curtain” would cover;
          We don’t actually render the white cover here; Page shows WhiteLoader. */}
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
        {/* Two diagonal bands, you can tune colors / angles */}
        <span
          style={{
            position: 'absolute',
            left: '-20%',
            top: '-30%',
            width: '140%',
            height: '40%',
            transform: 'rotate(8deg)',
            background:
              'linear-gradient(90deg, rgba(50,255,199,.0) 0%, rgba(50,255,199,.75) 40%, rgba(50,255,199,.0) 100%)',
            filter: 'blur(2px)',
            mixBlendMode: 'screen',
            animation: running
              ? `bandLead ${CASCADE_MS - BANDS_LEAD_MS}ms cubic-bezier(.22,.61,.21,.99) forwards`
              : 'none',
            animationDelay: running ? `${BANDS_LEAD_MS}ms` : '0ms',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '-30%',
            top: '55%',
            width: '160%',
            height: '48%',
            transform: 'rotate(-6deg)',
            background:
              'linear-gradient(90deg, rgba(11,240,95,.0) 0%, rgba(11,240,95,.55) 38%, rgba(11,240,95,.0) 100%)',
            filter: 'blur(2px)',
            mixBlendMode: 'screen',
            animation: running
              ? `bandLead ${CASCADE_MS - BANDS_LEAD_MS}ms cubic-bezier(.22,.61,.21,.99) forwards`
              : 'none',
            animationDelay: running ? `${BANDS_LEAD_MS + 60}ms` : '0ms',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes bandLead {
          0% {
            transform: translateX(-18%) rotate(var(--rot, 0deg));
            opacity: 0;
          }
          8% {
            opacity: 0.9;
          }
          92% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(118%) rotate(var(--rot, 0deg));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
