'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useEffect, useMemo, useState } from 'react'
import products from '@/lib/products'

const LandingGate = nextDynamic(() => import('@/components/LandingGate'), { ssr: false })
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false })
const ChakraOrbButton = nextDynamic(() => import('@/components/ChakraOrbButton'), { ssr: false })
const CartButton = nextDynamic(() => import('@/components/CartButton'), { ssr: false })
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false })
const BannedLogin = nextDynamic(() => import('@/components/BannedLogin'), { ssr: false })
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), {
  ssr: false,
})
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })

const RUNNER_H = 14

function useHeaderCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx)
  useEffect(() => {
    const read = () => {
      try {
        const v =
          getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') ||
          `${defaultPx}px`
        const n = parseInt(String(v).trim().replace('px', ''), 10)
        setPx(Number.isFinite(n) ? n : defaultPx)
      } catch {
        setPx(defaultPx)
      }
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [defaultPx])
  return px
}

export default function Page() {
  const ctrlPx = useHeaderCtrlPx()
  const [theme, setTheme] = useState('day')
  const [isShop, setIsShop] = useState(false)
  const [veil, setVeil] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  // reflect header size + runner height
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`)
    root.style.setProperty('--runner-h', `${RUNNER_H}px`)
  }, [ctrlPx])

  // global theme/mode (note: bg actually flips only after [data-shop-mounted])
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate')
    if (isShop) {
      root.setAttribute('data-shop-root', '')
      if (!root.style.getPropertyValue('--grid-cols')) root.style.setProperty('--grid-cols', '5')
    } else {
      root.removeAttribute('data-shop-root')
      root.removeAttribute('data-shop-mounted') // reset guard when leaving shop
    }
  }, [theme, isShop])

  // overlay flag to CSS (locks scroll + styles)
  useEffect(() => {
    const root = document.documentElement
    if (loginOpen) root.setAttribute('data-overlay-open', '1')
    else root.removeAttribute('data-overlay-open')
  }, [loginOpen])

  // listen for theme-change events from the toggle
  useEffect(() => {
    const onTheme = e => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  // mount guard after entering shop
  useEffect(() => {
    if (!isShop) return
    const root = document.documentElement

    // If we came from cascade, keep a short black veil and then drop it.
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true)
        sessionStorage.removeItem('fromCascade')
      }
    } catch {}

    // After first paint of the shop frame, mark mounted so CSS can flip bg.
    const id = requestAnimationFrame(() => {
      setTimeout(() => {
        root.setAttribute('data-shop-mounted', '1') // <-- allows off-white
        // If you want to force day theme right here, it’s safe:
        // root.setAttribute('data-theme', 'day');
      }, 20)
    })
    return () => cancelAnimationFrame(id)
  }, [isShop])

  const enterShop = () => setIsShop(true)

  const headerStyle = useMemo(
    () => ({
      position: 'fixed',
      inset: '0 0 auto 0',
      height: ctrlPx,
      zIndex: 500,
      display: 'grid',
      gridTemplateColumns: 'var(--header-ctrl) 1fr var(--header-ctrl)',
      alignItems: 'center',
      padding: '0 var(--header-pad-x)',
      background: 'transparent',
      overflow: 'visible',
    }),
    [ctrlPx]
  )

  const onHeart = () => setLoginOpen(v => !v)

  return (
    <div
      className="lb-screen w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {!isShop ? (
        <main className="lb-screen">
          <LandingGate onCascadeComplete={enterShop} />
        </main>
      ) : (
        <>
          <header role="banner" style={headerStyle}>
            <div
              style={{
                height: ctrlPx,
                width: 'var(--header-ctrl)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <DayNightToggle
                circlePx={28}
                trackPad={1}
                moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
              />
            </div>
            <div style={{ display: 'grid', placeItems: 'center', pointerEvents: 'auto' }}>
              <ChakraOrbButton
                size={72}
                className="orb-ring"
                style={{ display: 'grid', placeItems: 'center' }}
              />
            </div>
            <div
              style={{
                height: ctrlPx,
                width: 'var(--header-ctrl)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CartButton size={28} inHeader />
            </div>
          </header>

          {/* IMPORTANT: shop container exists immediately but bg flips only after [data-shop-mounted] */}
          <main style={{ paddingTop: ctrlPx }}>
            {/* Render grid only after mounted to avoid 1-frame peek */}
            <ShopGrid products={products} autoOpenFirstOnMount />
            <HeartBeatButton
              className="heart-submit"
              aria-label={loginOpen ? 'Close login' : 'Open login'}
              onClick={onHeart}
            />
            {loginOpen && (
              <div
                role="dialog"
                aria-modal="true"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 540,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#000',
                }}
                onClick={e => {
                  if (e.target === e.currentTarget) setLoginOpen(false)
                }}
              >
                <div style={{ outline: 'none' }}>
                  <BannedLogin onProceed={() => setLoginOpen(false)} startView="login" />
                </div>
              </div>
            )}
          </main>

          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
        </>
      )}

      {/* Optional black veil fade (kept minimal; harmless and not a cover-up) */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            opacity: 1,
            transition: 'opacity .32s ease-out',
            zIndex: 200,
            pointerEvents: 'none',
          }}
          ref={el => {
            if (el)
              requestAnimationFrame(() => {
                el.style.opacity = '0'
              })
          }}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  )
}
