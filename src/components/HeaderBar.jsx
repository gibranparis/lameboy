// src/components/HeaderBar.jsx
'use client'

import React, { useMemo } from 'react'
import DayNightToggle from '@/components/DayNightToggle'
import CartButton from '@/components/CartButton'

export default function HeaderBar({ ctrlPx }) {
  const headerPx = useMemo(() => {
    const n = Number(ctrlPx)
    return Number.isFinite(n) && n > 0 ? n : 64
  }, [ctrlPx])

  const sizes = useMemo(() => {
    const cart = Math.round(headerPx * 0.44) // more proportional vs toggle/orb
    return {
      box: headerPx,
      toggleDot: 28,
      cartImg: Math.max(26, Math.min(34, cart)),
    }
  }, [headerPx])

  return (
    <header
      role="banner"
      className="w-full"
      style={{
        position: 'fixed',
        inset: '0 0 auto 0',
        zIndex: 500,
        height: headerPx,
        display: 'grid',
        gridTemplateColumns: 'var(--header-ctrl) 1fr var(--header-ctrl)',
        alignItems: 'center',
        padding: '0 var(--header-pad-x)',
        background: 'transparent',
        overflow: 'visible',
      }}
    >
      <div className="flex items-center" style={{ lineHeight: 0 }}>
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

      <div className="flex items-center justify-end" style={{ lineHeight: 0 }}>
        <div
          style={{
            height: sizes.box,
            width: 'var(--header-ctrl)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <CartButton size={sizes.cartImg} inHeader />
        </div>
      </div>
    </header>
  )
}
