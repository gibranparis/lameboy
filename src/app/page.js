// src/app/page.js
'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
const WHITE_Z = 10002

/* WHITE overlay (black orb page) */
function WhiteLoader({ show, onFadeOutEnd }) {
  const [visible, setVisible] = useState(show)
  const [opacity, setOpacity] = useState(show ? 1 : 0)

  useEffect(() => {
    if (show) {
      setVisible(true)
      requestAnimationFrame(() => setOpacity(1))
    } else if (visible) {
      setOpacity(0)
      const t = setTimeout(() => {
        setVisible(false)
        onFadeOutEnd?.()
      }, 260)
      return () => clearTimeout(t)
    }
  }, [show, visible, onFadeOutEnd])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="white-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: WHITE_Z,
        pointerEvents: 'none',
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
        transition: 'opacity 260ms ease',
        opacity,
        contain: 'layout paint style',
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
            interactive={false}
            overrideAllColor="#000"
            flashDecayMs={140}
          />
        </div>
        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
          }}
        >
          <ClockNaples />
        </span>
        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </div>
  )
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

export default function Page() {
  const ctrlPx = useHeaderCtrlPx()
  const [theme, setTheme] = useState('day')
  const [isShop, setIsShop] = useState(false)
  const [cascadeDone, setCascadeDone] = useState(false)
  const [shopMounted, setShopMounted] = useState(false)
  const readyRequestedRef = useRef(false)
  const readyRanRef = useRef(false)
  const shopMountedRef = useRef(false)

  const [whiteShow, setWhiteShow] = useState(false)
  const [veilGrid, setVeilGrid] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)

  const showGate = !isShop

  // tokens
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`)
    root.style.setProperty('--runner-h', `${RUNNER_H}px`)
  }, [ctrlPx])

  // mode & theme
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme || 'day')
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate')
    if (isShop) root.setAttribute('data-shop-root', '')
    else {
      root.removeAttribute('data-shop-root')
      root.removeAttribute('data-shop-mounted')
    }
  }, [theme, isShop])

  // overlay-open flag (banned/login)
  useEffect(() => {
    const root = document.documentElement
    if (loginOpen) root.setAttribute('data-overlay-open', '1')
    else root.removeAttribute('data-overlay-open')
  }, [loginOpen])

  // listen for theme changes
  useEffect(() => {
    const onTheme = e => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  /* ---------- Gate → Shop choreography ---------- */

  // Called late in the sweep (from LandingGate)
  const onCascadeWhite = () => {
    setWhiteShow(true) // mount WHITE under bands
    setVeilGrid(true)
  }

  const onCascadeComplete = useCallback(() => {
    setWhiteShow(true) // ensure WHITE stays up through handoff
    setVeilGrid(true) // keep grid hidden until overlay signals ready
    setCascadeDone(true)
    setIsShop(true) // begin spinning up shop once cascade is finished
  }, [])
  // Mirror the "white phase" attr so LandingGate can hard-hide base
  useEffect(() => {
    const root = document.documentElement
    if (whiteShow) root.setAttribute('data-white-phase', '1')
    else root.removeAttribute('data-white-phase')
  }, [whiteShow])

  // When Shop mounts, allow off-white tokens & ensure DAY on entry
  useEffect(() => {
    if (!isShop) return
    const root = document.documentElement
    const id = requestAnimationFrame(() => {
      root.setAttribute('data-shop-mounted', '1')
      root.setAttribute('data-theme', 'day')
      try {
        localStorage.setItem('lb:theme', 'day')
      } catch {}
      shopMountedRef.current = true
      setShopMounted(true)
    })
    return () => {
      cancelAnimationFrame(id)
      shopMountedRef.current = false
      setShopMounted(false)
      root.removeAttribute('data-shop-mounted')
      root.setAttribute('data-theme', 'day')
    }
  }, [isShop])

  // Unveil grid + fade WHITE out when ready (or after safety)
  useEffect(() => {
    const runReady = () => {
      if (readyRanRef.current || !cascadeDone) return
      readyRanRef.current = true
      setTheme('day') // soften handoff by revealing overlay in day palette
      setVeilGrid(false)
      // linger white curtain slightly longer; drop only after shop mounts to avoid black gap
      const hideWhiteWhenReady = () => {
        let attempts = 0
        const tick = () => {
          if (shopMountedRef.current || attempts > 40) {
            setWhiteShow(false)
            return
          }
          attempts += 1
          setTimeout(tick, 30)
        }
        tick()
      }
      setTimeout(hideWhiteWhenReady, 360)
    }

    const onReady = () => {
      readyRequestedRef.current = true
      runReady()
    }

    const handlers = [
      ['lb:overlay-mounted', onReady],
      ['lb:overlay-open', onReady],
      ['lb:shop-ready', onReady],
    ]
    handlers.forEach(([n, h]) => window.addEventListener(n, h))
    const safety = setTimeout(onReady, 3000)

    // If readiness was requested before cascade finished, run once now
    if (readyRequestedRef.current) runReady()

    return () => {
      handlers.forEach(([n, h]) => window.removeEventListener(n, h))
      clearTimeout(safety)
    }
  }, [cascadeDone])

  // If cascade finished but shop isn't mounted yet, keep WHITE up to block black gaps
  useEffect(() => {
    if (cascadeDone && !shopMounted) {
      setWhiteShow(true)
    }
  }, [cascadeDone, shopMounted])

  // While white is showing (or cascade finished but shop not mounted), pin the floor to white to avoid any black flash
  useEffect(() => {
    const shouldForceWhite = whiteShow || (cascadeDone && !shopMounted)
    if (!shouldForceWhite) return
    const root = document.documentElement
    const prevRootBg = root.style.background
    const prevRootColor = root.style.color
    const prevBodyBg = document.body.style.background
    const prevBodyColor = document.body.style.color
    root.style.background = '#fff'
    root.style.color = '#000'
    document.body.style.background = '#fff'
    document.body.style.color = '#000'
    return () => {
      root.style.background = prevRootBg
      root.style.color = prevRootColor
      document.body.style.background = prevBodyBg
      document.body.style.color = prevBodyColor
    }
  }, [whiteShow, cascadeDone, shopMounted])

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

  return (
    <div
      className="lb-screen w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {showGate && (
        <main className="lb-screen">
          <LandingGate onCascadeWhite={onCascadeWhite} onCascadeComplete={onCascadeComplete} />
        </main>
      )}

      {isShop && (
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

          <main style={{ paddingTop: ctrlPx }}>
            <ShopGrid products={products} autoOpenFirstOnMount />
            <HeartBeatButton className="heart-submit" aria-label="Open login" onClick={() => {}} />
          </main>

          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
        </>
      )}

      {/* WHITE under bands; disappears only after shop is ready */}
      <WhiteLoader show={whiteShow} />
    </div>
  )
}

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
