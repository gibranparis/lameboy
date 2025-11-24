// src/app/page.js
'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import products from '@/lib/products'

const LandingGate = nextDynamic(() => import('@/components/LandingGate'), { ssr: false })
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false })
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), {
  ssr: false,
})
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

const RUNNER_H = 14
const WHITE_Z = 10002

/* ========================= White overlay (black-orb page) ========================= */

function WhiteLoader({ show }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    // when show flips to false, fade out then unmount
    if (!show && visible) {
      const t = setTimeout(() => setVisible(false), 260)
      return () => clearTimeout(t)
    }
    if (show && !visible) {
      setVisible(true)
    }
  }, [show, visible])

  if (!visible) return null

  const opacity = show ? 1 : 0

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

/* ========================= Header control size ========================= */

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

/* ================================= Page ================================= */

export default function Page() {
  const ctrlPx = useHeaderCtrlPx()

  const [theme, setTheme] = useState('day')
  const [shopActive, setShopActive] = useState(false) // shop mounted behind curtain
  const [cascadeDone, setCascadeDone] = useState(false) // gate finished
  const [shopMounted, setShopMounted] = useState(false) // shop bundles ready
  const [whiteShow, setWhiteShow] = useState(false) // white curtain visible
  const [loginOpen, setLoginOpen] = useState(false)

  const shopMountedRef = useRef(false)

  const showGate = !cascadeDone
  const mode = cascadeDone ? 'shop' : 'gate'

  /* ---------- root tokens ---------- */

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`)
    root.style.setProperty('--runner-h', `${RUNNER_H}px`)
  }, [ctrlPx])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme || 'day')
    root.setAttribute('data-mode', mode)

    if (shopActive) root.setAttribute('data-shop-root', '')
    else root.removeAttribute('data-shop-root')

    if (shopMounted) root.setAttribute('data-shop-mounted', '1')
    else root.removeAttribute('data-shop-mounted')
  }, [theme, mode, shopActive, shopMounted])

  // overlay-open flag (future login / banned, kept for later)
  useEffect(() => {
    const root = document.documentElement
    if (loginOpen) root.setAttribute('data-overlay-open', '1')
    else root.removeAttribute('data-overlay-open')
  }, [loginOpen])

  // listen for theme changes from DayNightToggle
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  /* ---------- Gate → Shop choreography ---------- */

  // Called from LandingGate when bands are ~2/3 across
  const onCascadeWhite = () => {
    setWhiteShow(true) // mount white curtain under bands
    setShopActive(true) // start mounting shop behind curtain
  }

  // Called from LandingGate when sweep finishes
  const onCascadeComplete = useCallback(() => {
    setCascadeDone(true) // gate is done; hide gate React tree
  }, [])

  // Mirror the "white phase" attr for CSS
  useEffect(() => {
    const root = document.documentElement
    if (whiteShow) root.setAttribute('data-white-phase', '1')
    else root.removeAttribute('data-white-phase')
  }, [whiteShow])

  // When shop becomes active, mark bundles as mounted on next frame
  useEffect(() => {
    if (!shopActive) {
      shopMountedRef.current = false
      setShopMounted(false)
      return
    }
    const root = document.documentElement
    const id = requestAnimationFrame(() => {
      shopMountedRef.current = true
      setShopMounted(true)
      root.setAttribute('data-theme', 'day')
      try {
        localStorage.setItem('lb:theme', 'day')
      } catch {}
    })
    return () => cancelAnimationFrame(id)
  }, [shopActive])

  // Pre-warm shop bundles while idle
  useEffect(() => {
    const run = () => {
      import('@/components/HeaderBar')
      import('@/components/ShopGrid')
      import('@/components/BannedLogin')
      import('@/components/ChakraBottomRunner')
      import('@/components/HeartBeatButton')
    }
    const id =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(run, { timeout: 1200 })
        : setTimeout(run, 180)
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])

  // When cascade is done and shop is mounted, drop the white curtain
  useEffect(() => {
    if (!cascadeDone || !shopMounted) return
    const t = setTimeout(() => setWhiteShow(false), 420)
    return () => clearTimeout(t)
  }, [cascadeDone, shopMounted])

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

      {shopActive && (
        <>
          <HeaderBar ctrlPx={ctrlPx} />

          <main style={{ paddingTop: ctrlPx }}>
            <ShopGrid products={products} autoOpenFirstOnMount />
            <HeartBeatButton className="heart-submit" aria-label="Open login" onClick={() => {}} />
          </main>

          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
        </>
      )}

      {/* White curtain (black orb page) */}
      <WhiteLoader show={whiteShow} />
    </div>
  )
}

/* =============================== Clock (shared) =============================== */

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
