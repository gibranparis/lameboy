// src/components/BannedLogin.jsx
'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

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

/**
 * Banned gate:
 * - shows orb + copy
 * - long-press / double-click calls onProceed()
 * - cascade / white-page / shop are driven by src/app/page.js
 */
export default function BannedLogin({ onProceed }) {
  const { vh, micro, gap } = useShift()
  const [flipBrand, setFlipBrand] = useState(false)
  const [orbRed, setOrbRed] = useState(false)
  const pressTimer = useRef(null)

  const SEAFOAM = '#32ffc7'
  const RED = '#ff001a'

  const triggerProceed = useCallback(() => {
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  const startPressTimer = () => {
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(triggerProceed, 650)
  }

  const clearPressTimer = () => {
    clearTimeout(pressTimer.current)
  }

  return (
    <div
      className="page-center"
      style={{
        transform: `translateY(calc(-${vh}vh + ${micro}px))`,
        gap,
        alignItems: 'center',
      }}
    >
      {/* ORB */}
      <button
        type="button"
        aria-label="Orb"
        onClick={() => setOrbRed((v) => !v)}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 0 }}
        title="Tap: toggle color • Hold/Double-click: enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={orbRed ? 1.0 : 0.9}
          includeZAxis
          height="72px"
          overrideAllColor={orbRed ? RED : null}
          interactive
        />
      </button>

      {/* Code block */}
      <pre
        className="code-tight"
        style={{
          margin: 0,
          textAlign: 'center',
          color: 'var(--text)',
          font: '700 14px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <span className="lb-seafoam code-comment">// </span>
        <span className="lb-white neon-black" style={{ fontWeight: 900 }}>
          Lamebo<span>y</span>
          <span className="lb-seafoam">.com</span>
        </span>
        {'\n'}
        <span className="lb-seafoam code-comment">// </span>
        <span className="banned-neon">is banned</span>
        {'\n'}
        <span className="code-keyword">const</span> <span className="code-var">msg</span>{' '}
        <span className="code-op">=</span> <span className="code-string">"welcome to"</span>
        <span className="code-punc">;</span>
      </pre>

      {/* Florida/LAMEBOY label */}
      <button
        type="button"
        className="florida-link"
        onClick={() => {
          setFlipBrand(true)
          setTimeout(() => setFlipBrand(false), 900)
        }}
        title="Click to morph"
        style={{ fontWeight: 800, marginTop: -2 }}
      >
        {flipBrand ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      <style jsx>{`
        .florida-link {
          display: block;
          text-align: center;
          background: transparent;
          border: 0;
          cursor: pointer;
          letter-spacing: 0.02em;
          color: #eaeaea;
          transition:
            color 0.15s ease,
            text-shadow 0.15s ease;
        }
        .florida-link:hover,
        .florida-link:focus-visible {
          color: #fff8c2;
          text-shadow:
            0 0 6px rgba(250, 204, 21, 0.55),
            0 0 14px rgba(250, 204, 21, 0.38),
            0 0 26px rgba(250, 204, 21, 0.22);
          outline: 0;
        }
      `}</style>
    </div>
  )
}
