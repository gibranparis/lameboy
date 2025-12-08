// src/app/page.js
'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import products from '@/lib/products'

const BannedLogin = nextDynamic(() => import('@/components/BannedLogin'), { ssr: false })
const CascadeOverlay = nextDynamic(() => import('@/components/cascade/CascadeOverlay'), {
  ssr: false,
})
const WhiteLoader = nextDynamic(() => import('@/components/orb/WhiteLoader'), { ssr: false })

const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false })
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), {
  ssr: false,
})
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })

const RUNNER_H = 14
const CASCADE_MS = 2400

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
  const [phase, setPhase] = useState('gate') // 'gate' | 'cascade' | 'shop'

  const [shopActive, setShopActive] = useState(false) // shop mounted behind curtain
  const [shopMounted, setShopMounted] = useState(false) // shop bundles ready
  const [whiteShow, setWhiteShow] = useState(false) // white curtain with orb visible
  const [loginOpen, setLoginOpen] = useState(false)

  const shopMountedRef = useRef(false)

  const showGate = phase === 'gate'
  const showCascade = phase === 'cascade'
  const mode = phase === 'shop' ? 'shop' : 'gate'

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

  /* ---------- Gate → Cascade → Shop choreography ---------- */

  const beginCascade = useCallback(() => {
    if (phase !== 'gate') return

    // 1) switch to cascade phase (bands)
    setPhase('cascade')

    // 2) show white curtain + orb
    setWhiteShow(true)

    // 3) start mounting shop behind the curtain
    setShopActive(true)

    // 4) hard guarantee we move into shop after CASCADE_MS
    window.setTimeout(() => {
      setPhase('shop')
    }, CASCADE_MS)
  }, [phase])

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

  // When we are in shop phase and bundles are ready, fade out the white curtain
  useEffect(() => {
    if (phase !== 'shop' || !shopMounted) return
    const t = setTimeout(() => setWhiteShow(false), 420)
    return () => clearTimeout(t)
  }, [phase, shopMounted])

  return (
    <div
      className="lb-screen w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* Gate (banned login) */}
      {showGate && (
        <main className="lb-screen">
          <BannedLogin onProceed={beginCascade} />
        </main>
      )}

      {/* Cascade overlay */}
      {showCascade && <CascadeOverlay durationMs={CASCADE_MS} />}

      {/* Shop (behind curtain) */}
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

      {/* White curtain + black orb page */}
      <WhiteLoader show={whiteShow} />
    </div>
  )
}
