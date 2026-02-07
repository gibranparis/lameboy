// src/components/HeaderBar.jsx
'use client'

import { useMemo } from 'react'
import DayNightToggle from '@/components/DayNightToggle'
export default function HeaderBar({ ctrlPx }) {
  const headerPx = useMemo(() => {
    const n = Number(ctrlPx)
    return Number.isFinite(n) && n > 0 ? n : 64
  }, [ctrlPx])

  const sizes = useMemo(() => {
    return {
      box: headerPx,
      toggleDot: 28,
    }
  }, [headerPx])

  return (
    <header
      role="banner"
      className="w-full"
      style={{
        position: 'fixed',
        inset: '0 0 auto 0',
        zIndex: 800,
        height: headerPx,
        display: 'grid',
        gridTemplateColumns: 'var(--header-ctrl) 1fr var(--header-ctrl)',
        alignItems: 'center',
        padding: '0 var(--header-pad-x)',
        background: 'transparent',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <div className="flex items-center" style={{ lineHeight: 0, pointerEvents: 'auto' }}>
        <div
          style={{
            height: sizes.box,
            width: 'var(--header-ctrl)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <DayNightToggle
            className="select-none"
            circlePx={sizes.toggleDot}
            trackPad={1}
            moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
          />
        </div>
      </div>

      {/* Center column intentionally empty: OrbShell is fixed-positioned and moves here */}
      <div className="flex items-center justify-center" style={{ lineHeight: 0 }} />

      {/* Right column: cart button rendered independently at page level */}
      <div />
    </header>
  )
}
