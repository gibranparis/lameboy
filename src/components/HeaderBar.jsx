// src/components/HeaderBar.jsx
'use client'

import { useMemo, useRef } from 'react'
import DayNightToggle, { THEME_FLIP } from '@/components/DayNightToggle'
import CartButton from '@/components/CartButton'
import { useDragSnap, pinball } from '@/lib/dragSnap'
import { haptic } from '@/lib/haptics'

// Day ↔ night, with a tap of feedback (it runs inside the release, so iOS allows it)
const flipTheme = () => {
  window.dispatchEvent(new Event(THEME_FLIP))
  haptic(8)
}

export default function HeaderBar({ ctrlPx, shopReady = true }) {
  // The toggle / cart stay wherever they're dragged until the grid folds and
  // keep working right there (the cart opens beside it)
  const toggleRef = useRef(null)
  const cartRef = useRef(null)
  // Dropped, they stay put; flicked, they pinball around and back home. The
  // toggle also flips day / night on a quick sideways swipe, like a switch,
  // and on every flick as it flies off
  useDragSnap(toggleRef, {
    touchAction: 'none',
    key: 'toggle',
    stayOnTap: true,
    swipe: flipTheme,
    fling: { ...pinball, onLaunch: flipTheme },
  })
  useDragSnap(cartRef, { touchAction: 'none', key: 'cart', stayOnTap: true, fling: pinball })

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
        // Only its controls take taps: when a dragged cart / toggle lifts the
        // bar to the top layer, its empty middle mustn't block the orb
        pointerEvents: 'none',
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
          ref={toggleRef}
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
            moonImages={[
              '/toggle/moon-red.png',
              '/toggle/moon-blue.png',
              '/toggle/planet-mars-ocean.png',
              '/toggle/planet-titan.png',
              '/toggle/planet-titan-mosaic.png',
              '/toggle/planet-europa.png',
            ]}
          />
        </div>
      </div>

      {/* Center column intentionally empty: OrbShell is fixed-positioned and moves here */}
      <div className="flex items-center justify-center" style={{ lineHeight: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
        <div ref={cartRef} style={{ lineHeight: 0 }}>
          <CartButton
            size={36}
            inHeader
            imgSrc={null}
            onClick={() => window.dispatchEvent(new Event('checkout:toggle'))}
          />
        </div>
      </div>
    </header>
  )
}
