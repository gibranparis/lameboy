// src/app/page.js
'use client'

export const dynamic = 'force-static'

import nextDynamic from 'next/dynamic'
import React, { useCallback, useEffect, useState } from 'react'
import products from '@/lib/products'

// Landing gate (banned page)
const BannedLogin = nextDynamic(() => import('@/components/BannedLogin'), { ssr: false })

// Black-orb loader screen
const WhiteLoader = nextDynamic(() => import('@/components/orb/WhiteLoader'), { ssr: false })

// Shop
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false })
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), {
  ssr: false,
})
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })

const RUNNER_H = 14
const LOADER_MS = 1400 // how long the black-orb loader stays on screen

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

  // 'gate'   -> BannedLogin
  // 'loader' -> black orb on white
  // 'shop'   -> Header + ShopGrid + runner
  const [mode, setMode] = useState('gate')
  const [theme, setTheme] = useState('day')
  const [loaderShow, setLoaderShow] = useState(false)

  const inGate = mode === 'gate'
  const inShop = mode === 'shop'

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

    if (inShop) {
      root.setAttribute('data-shop-root', '')
      root.setAttribute('data-shop-mounted', '1')
    } else {
      root.removeAttribute('data-shop-root')
      root.removeAttribute('data-shop-mounted')
    }
  }, [theme, mode, inShop])

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

  /* ---------- Gate → Loader → Shop choreography (no cascade) ---------- */

  const handleEnterShop = useCallback(() => {
    if (mode !== 'gate') return

    // 1) Show black-orb loader
    setMode('loader')
    setLoaderShow(true)

    // Lock to day as we enter the shop
    const root = document.documentElement
    root.setAttribute('data-theme', 'day')
    try {
      localStorage.setItem('lb:theme', 'day')
    } catch {}

    // 2) After a short delay, reveal shop & hide loader
    window.setTimeout(() => {
      setMode('shop')
      setLoaderShow(false)
    }, LOADER_MS)
  }, [mode])

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

  return (
    <div
      className="lb-screen w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* Landing gate */}
      {inGate && (
        <main className="lb-screen">
          <BannedLogin onProceed={handleEnterShop} />
        </main>
      )}

      {/* Shop */}
      {inShop && (
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

      {/* Black-orb loader on white */}
      <WhiteLoader show={loaderShow} />
    </div>
  )
}
