// src/components/HeaderBar.jsx
'use client'

import { useMemo } from 'react'
import DayNightToggle from '@/components/DayNightToggle'
import CartButton from '@/components/CartButton'
export default function HeaderBar({ ctrlPx, shopReady = true }) {
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
        inset: 'auto 0 0 0',
        zIndex: 800,
        height: headerPx,
        display: 'grid',
        gridTemplateColumns: 'var(--header-ctrl) 1fr var(--header-ctrl)',
        alignItems: 'center',
        padding: '0 var(--header-pad-x)',
        paddingBottom: 'var(--safe-bottom, 0px)',
        background: 'transparent',
        overflow: 'visible',
        pointerEvents: 'auto',
        // Reveal: DayNightToggle slides in from center-right to bottom-left
        opacity: shopReady ? 1 : 0,
        transform: shopReady
          ? 'none'
          : 'translate(calc(50vw - var(--header-pad-x, 16px) - var(--header-ctrl, 64px) / 2), calc(-50vh + var(--header-ctrl, 64px) / 2))',
        transition: 'transform 0.6s cubic-bezier(0.2,0.9,0.2,1), opacity 0.5s ease',
        transitionDelay: shopReady ? '0s' : '0s',
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
        <CartButton
          size={36}
          inHeader
          imgSrc={null}
          onClick={() => window.dispatchEvent(new Event('checkout:toggle'))}
        />
      </div>
    </header>
  )
}
