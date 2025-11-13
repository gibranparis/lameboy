'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ChakraOrbButton from '@/components/ChakraOrbButton'
import DayNightToggle from '@/components/DayNightToggle'
import CartButton from '@/components/CartButton'

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const ctrlPx = useResponsiveCtrlPx({ desktop: 36, mobile: 32, bp: 520 })
  const [isNight, setIsNight] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme')
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night')
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const root = document.querySelector(rootSelector) || document.documentElement
      root.setAttribute('data-theme', isNight ? 'night' : 'day')
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day')
      document.documentElement.style.setProperty('--header-ctrl', `${ctrlPx}px`)
      document.documentElement.setAttribute('data-shop-root', '')
    } catch {}
  }, [isNight, rootSelector, ctrlPx])

  const sizes = useMemo(
    () => ({
      box: ctrlPx,
      toggleDot: 22,
      cartImg: 28,
      orb: Math.round(ctrlPx * 1.9),
    }),
    [ctrlPx]
  )

  return (
    <header
      role="banner"
      className="w-full"
      style={{
        position: 'fixed',
        inset: '0 0 auto 0',
        zIndex: 500,
        height: `var(--header-ctrl)`,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 var(--header-pad-x)',
        background: 'transparent',
      }}
    >
      <div className="flex items-center" style={{ lineHeight: 0 }}>
        <div style={{ height: sizes.box, width: sizes.box, display: 'grid', placeItems: 'center' }}>
          <DayNightToggle
            className="select-none"
            circlePx={sizes.toggleDot}
            trackPad={1}
            value={isNight ? 'night' : 'day'}
            onChange={t => setIsNight(t === 'night')}
            moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
          />
        </div>
      </div>

      <div className="flex items-center justify-center" style={{ lineHeight: 0 }}>
        <ChakraOrbButton size={sizes.orb} />
      </div>

      <div className="flex items-center justify-end" style={{ lineHeight: 0 }}>
        <div style={{ height: sizes.box, width: sizes.box, display: 'grid', placeItems: 'center' }}>
          <CartButton size={sizes.cartImg} inHeader />
        </div>
      </div>
    </header>
  )
}

function useResponsiveCtrlPx({ desktop = 36, mobile = 32, bp = 520 } = {}) {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth <= bp ? mobile : desktop)
  const [px, setPx] = useState(pick)
  useEffect(() => {
    const onResize = () => setPx(pick())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [bp, desktop, mobile])
  return px
}
