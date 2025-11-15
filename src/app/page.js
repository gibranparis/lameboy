// src/app/page.js
'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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

/* ---------------- helpers ---------------- */
function applyTheme(theme /* 'day' | 'night' */) {
  try {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.toggle('dark', theme === 'night')
    try {
      localStorage.setItem('lb:theme', theme)
    } catch {}
    const evt = new CustomEvent('theme-change', { detail: { theme } })
    document.dispatchEvent(evt)
    window.dispatchEvent?.(evt)
  } catch {}
}

/* ---- WHITE overlay (black orb/time/label) appears ONLY after cascade ends ---- */
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
      className="white-loader"
      aria-hidden
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
        mixBlendMode: 'normal',
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
            glowOpacity={1.0}
            includeZAxis
            height="88px"
            interactive={false}
            overrideAllColor="#000000"
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

/* ---------------- page ---------------- */
export default function Page() {
  const ctrlPx = useHeaderCtrlPx()

  // theme state mirrors html; we also listen for external theme-change from the toggle
  const [theme, setTheme] = useState('day')

  // gate/shop state
  const [isShop, setIsShop] = useState(false)
  const [whiteShow, setWhiteShow] = useState(false)
  const [veilGrid, setVeilGrid] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)

  // guards to prevent duplicate cascade & duplicate reveal
  const didWhiteStart = useRef(false)
  const didReveal = useRef(false)
  const safetyTimer = useRef(null)

  /* tokens */
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`)
    root.style.setProperty('--runner-h', `${RUNNER_H}px`)
  }, [ctrlPx])

  /* reflect mode + theme on html */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate')
    if (isShop) root.setAttribute('data-shop-root', '')
    else {
      root.removeAttribute('data-shop-root')
      root.removeAttribute('data-shop-mounted')
    }
  }, [isShop])

  useEffect(() => {
    // keep theme attribute/class synced to state (covers SSR→CSR and external changes)
    applyTheme(theme)
  }, [theme])

  /* overlay-open flag for banned/login */
  useEffect(() => {
    const root = document.documentElement
    if (loginOpen) root.setAttribute('data-overlay-open', '1')
    else root.removeAttribute('data-overlay-open')
  }, [loginOpen])

  /* listen for day/night from toggle */
  useEffect(() => {
    const onTheme = e => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  /* —— Gate → Shop choreography —— */

  // 1) LANDING signals WHITE at the very end of the sweep
  const onCascadeWhite = () => {
    // guard: prevent double-trigger (some gates can emit twice)
    if (didWhiteStart.current) return
    didWhiteStart.current = true
    document.documentElement.setAttribute('data-cascade-lock', '1')

    // Force DAY **before** mounting shop so first paint is Day
    setTheme('day')
    applyTheme('day')

    // show WHITE, mount shop behind it, keep grid veiled
    setWhiteShow(true)
    setVeilGrid(true)
    setIsShop(true)
  }

  // 2) set shop-mounted flag on next frame (lets off-white/shop tokens take over)
  useEffect(() => {
    if (!isShop) return
    const root = document.documentElement
    const id = requestAnimationFrame(() => {
      root.setAttribute('data-shop-mounted', '1')
    })
    return () => cancelAnimationFrame(id)
  }, [isShop])

  // 3) one-shot "reveal" when shop/overlay is ready; also a safety fallback
  useEffect(() => {
    const revealOnce = () => {
      if (didReveal.current) return
      didReveal.current = true
      setVeilGrid(false)
      // allow a beat so grid is visible under WHITE, then fade WHITE out
      setTimeout(() => setWhiteShow(false), 120)
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current)
        safetyTimer.current = null
      }
    }

    const onReady = () => revealOnce()
    const names = ['lb:overlay-mounted', 'lb:overlay-open', 'lb:shop-ready']

    names.forEach(n => window.addEventListener(n, onReady))
    safetyTimer.current = setTimeout(revealOnce, 3000) // graceful fallback

    return () => {
      names.forEach(n => window.removeEventListener(n, onReady))
      if (safetyTimer.current) clearTimeout(safetyTimer.current)
    }
  }, [])

  // 4) (optional) end-of-cascade callback for analytics clarity
  const onCascadeComplete = () => {
    // no-op: WHITE already active and shop spin-up in progress
  }

  /* grid veil attr */
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

  return (
    <div
      className="lb-screen w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {!isShop ? (
        <main className="lb-screen">
          <LandingGate onCascadeWhite={onCascadeWhite} onCascadeComplete={onCascadeComplete} />
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

          <main style={{ paddingTop: ctrlPx }}>
            <ShopGrid products={products} autoOpenFirstOnMount />
            <HeartBeatButton className="heart-submit" aria-label="Open login" onClick={() => {}} />
          </main>

          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
        </>
      )}

      {/* WHITE appears ONLY after cascade finishes; fades out once shop ready */}
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
