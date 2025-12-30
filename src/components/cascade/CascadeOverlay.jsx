// src/components/cascade/CascadeOverlay.jsx
'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CascadeOverlay({ durationMs = 2400 }) {
  const [mounted, setMounted] = useState(true)
  const [p, setP] = useState(0)

  useEffect(() => {
    let start
    let rafId
    let doneId
    const ease = (t) => 1 - Math.pow(1 - t, 3)

    const step = (t) => {
      if (start == null) start = t
      const raw = Math.min(1, (t - start) / durationMs)
      setP(ease(raw))
      if (raw < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        doneId = setTimeout(() => setMounted(false), 120)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (doneId) clearTimeout(doneId)
    }
  }, [durationMs])

  if (!mounted) return null

  const COLOR_VW = 120
  const whiteTx = (1 - p) * 100
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW

  return createPortal(
    <>
      {/* White sheet */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 9998,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

      {/* Color bands */}
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

      {/* LAMEBOY label (blend so it flips color on white) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
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
