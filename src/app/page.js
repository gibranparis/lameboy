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
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

const RUNNER_H = 14

/* -------- White enlightenment overlay (WHITE bg + BLACK orb/time/label) -------- */
function WhiteLoader({ show }) {
  const [visible, setVisible] = useState(show)
  const [opacity, setOpacity] = useState(show ? 1 : 0)

  useEffect(() => {
    if (show) {
      setVisible(true)
      requestAnimationFrame(() => setOpacity(1))
    } else if (visible) {
      setOpacity(0)
      const t = setTimeout(() => setVisible(false), 240)
      return () => clearTimeout(t)
    }
  }, [show, visible])

  if (!visible) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10020, // ABOVE cascade (which is 10010..10012)
        pointerEvents: 'none',
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
        transition: 'opacity 240ms ease',
        opacity,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ lineHeight: 0 }}>
          <BlueOrbCross3D
            rpm={44}
            color="#32ffc7"
            geomScale={1.12}
            glow
            glowOpacity={1}
            includeZAxis
            height="88px"
            __interactive={false}
            overrideAllColor="#000000" // BLACK orb on WHITE
            flashDecayMs={140}
          />
        </div>
        <span style={LABEL_BLACK}>
          <ClockNaples />
        </span>
        <span style={{ ...LABEL_BLACK, textTransform: 'uppercase' }}>LAMEBOY, USA</span>
      </div>
    </div>
  )
}
const LABEL_BLACK = {
  color: '#000',
  fontWeight: 800,
  letterSpacing: '.06em',
  fontSize: 'clamp(12px,1.3vw,14px)',
  lineHeight: 1.2,
}

function useHeaderCtrlPx(defaultPx = 64) {
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

/* Naples clock (EST) used in loader */
function ClockNaples() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }).format(new Date())
      )
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{now}</span>
}

export default function Page() {
  const ctrlPx = useHeaderCtrlPx()
  const [theme, setTheme] = useState('day')
  const [isShop, setIsShop] = useState(false)

  // white enlightenment overlay
  const [loaderShow, setLoaderShow] = useState(false)
  // keep grid hidden until product overlay mounts
  const [veilGrid, setVeilGrid] = useState(true)

  const [loginOpen, setLoginOpen] = useState(false)

  // base tokens
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`)
    root.style.setProperty('--runner-h', `${RUNNER_H}px`)
  }, [ctrlPx])

  // reflect mode/theme; bg flips to off-white only when [data-shop-mounted]
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate')
    if (isShop) {
      root.setAttribute('data-shop-root', '')
    } else {
      root.removeAttribute('data-shop-root')
      root.removeAttribute('data-shop-mounted')
    }
  }, [theme, isShop])

  // overlay flag to CSS (locks scroll for modal)
  useEffect(() => {
    const root = document.documentElement
    if (loginOpen) root.setAttribute('data-overlay-open', '1')
    else root.removeAttribute('data-overlay-open')
  }, [loginOpen])

  // theme-change events from toggle
  useEffect(() => {
    const onTheme = e => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  /* ----- called by Gate *just before* bands start (raise WHITE) ----- */
  const onWhiteStart = () => {
    setLoaderShow(true) // WHITE above everything
    setVeilGrid(true) // grid hidden
    try {
      document.documentElement.setAttribute('data-cascade-active', '1')
    } catch {}
  }

  /* ----- called by Gate when bands pass center (enter shop) ----- */
  const enterShop = () => {
    setLoaderShow(true) // keep WHITE up during mount
    setIsShop(true) // switch to shop mode
  }

  // mark first paint of the shop and then allow bg flip (to off-white)
  useEffect(() => {
    if (!isShop) return
    const root = document.documentElement
    const id = requestAnimationFrame(() => {
      root.setAttribute('data-shop-mounted', '1')
      root.setAttribute('data-theme', 'day') // force day at unveil
    })
    return () => cancelAnimationFrame(id)
  }, [isShop])

  // overlay ready signals → reveal product + fade white
  useEffect(() => {
    const onReady = () => {
      setVeilGrid(false) // show product view (not grid)
      setTimeout(() => setLoaderShow(false), 120) // fade WHITE after overlay present
    }

    const handlers = [
      ['lb:overlay-mounted', onReady],
      ['lb:overlay-open', onReady],
      ['lb:shop-ready', onReady],
    ]
    handlers.forEach(([n, h]) => window.addEventListener(n, h))
    const safety = setTimeout(onReady, 3000) // fallback

    return () => {
      handlers.forEach(([n, h]) => window.removeEventListener(n, h))
      clearTimeout(safety)
    }
  }, [])

  // reflect veil state to CSS
  useEffect(() => {
    const root = document.documentElement
    if (veilGrid) root.setAttribute('data-grid-veil', '1')
    else root.removeAttribute('data-grid-veil')
  }, [veilGrid])

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
          <LandingGate onCascadeWhite={onWhiteStart} onCascadeComplete={enterShop} />
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

          {/* Shop content under the loader; grid remains veiled until overlay mounts */}
          <main style={{ paddingTop: ctrlPx }}>
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

      {/* Enlightenment overlay (white, above cascade) */}
      <WhiteLoader show={loaderShow} />
    </div>
  )
}
