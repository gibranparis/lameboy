// src/components/BannedLogin.jsx
'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'

export default function BannedLogin({ onAdvanceGate, onProceed }) {
  const [now, setNow] = useState(() => new Date())

  // IMPORTANT: while this gate is mounted, hide any “global/header” orb duplicates
  // (Your ChakraOrbButton watches this.)
  useEffect(() => {
    document.documentElement.setAttribute('data-gate-open', '1')
    return () => {
      document.documentElement.removeAttribute('data-gate-open')
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const clockText = useMemo(() => {
    return now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [now])

  // Long-press handling on text (optional parity with orb)
  const pressTimer = useRef(null)
  const startPressTimer = useCallback(() => {
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      if (typeof onProceed === 'function') onProceed()
    }, 650)
  }, [onProceed])

  const clearPressTimer = useCallback(() => clearTimeout(pressTimer.current), [])

  const advanceGate = useCallback(() => {
    if (typeof onAdvanceGate === 'function') onAdvanceGate()
  }, [onAdvanceGate])

  const triggerProceed = useCallback(() => {
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff',
        zIndex: 1000,
      }}
    >
      {/* Time */}
      <button
        type="button"
        onClick={advanceGate}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        style={{
          marginTop: 150, // leaves room for the persistent OrbShell orb centered behind
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {clockText}
      </button>

      {/* Florida label */}
      <button
        type="button"
        onClick={advanceGate}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          lineHeight: 1.2,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        Florida, USA
      </button>
    </div>
  )
}
