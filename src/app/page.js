// src/app/page.js
'use client'

export const dynamic = 'force-static'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import nextDynamic from 'next/dynamic'
import products from '@/lib/products'

import OrbShell from '@/components/OrbShell'
import WhiteLoader from '@/components/orb/WhiteLoader'

// Gate (text only now)
const BannedLogin = nextDynamic(() => import('@/components/BannedLogin'), { ssr: false })

// Shop
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false })
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), {
  ssr: false,
})
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })

const RUNNER_H = 14
const LOADER_MS = 1400

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

  const [mode, setMode] = useState('gate') // 'gate' | 'shop'
  const [theme, setTheme] = useState('day')
  const [loaderShow, setLoaderShow] = useState(false)

  const inGate = mode === 'gate'
  const inShop = mode === 'shop'

  /* ===================== Gate state (moved up) ===================== */

  const [gateStep, setGateStep] = useState(0) // 0..3
  const [isProceeding, setIsProceeding] = useState(false)
  const proceedFired = useRef(false)
  const proceedDelayTimer = useRef(null)

  const advanceGate = useCallback(() => {
    if (!inGate) return
    if (proceedFired.current || isProceeding) return
    setGateStep((s) => (s >= 3 ? 3 : s + 1))
  }, [inGate, isProceeding])

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

  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  /* ===================== Gate → Loader → Shop choreography ===================== */

  const handleEnterShop = useCallback(() => {
    if (mode !== 'gate') return

    // show loader immediately
    setLoaderShow(true)

    // lock theme to day for shop
    const root = document.documentElement
    root.setAttribute('data-theme', 'day')
    try {
      localStorage.setItem('lb:theme', 'day')
    } catch {}

    // mount shop behind loader
    setTimeout(() => {
      setMode('shop')
    }, 120)

    // fade loader out
    setTimeout(() => {
      setLoaderShow(false)
    }, LOADER_MS)
  }, [mode])

  const triggerProceed = useCallback(() => {
    if (!inGate) return
    if (proceedFired.current) return
    proceedFired.current = true

    // Force stable black/no-glow state first (OrbShell will read this)
    setIsProceeding(true)

    // Give the browser 2 frames to paint the black state before the loader/shop mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleEnterShop()
      })
    })
  }, [handleEnterShop, inGate])

  // When we hit green, wait briefly so green is visible, then proceed
  useEffect(() => {
    if (!inGate) return
    if (gateStep !== 3) return
    if (proceedFired.current || isProceeding) return

    clearTimeout(proceedDelayTimer.current)
    proceedDelayTimer.current = setTimeout(() => {
      triggerProceed()
    }, 300)

    return () => clearTimeout(proceedDelayTimer.current)
  }, [gateStep, inGate, isProceeding, triggerProceed])

  // Pre-warm client bundles while idle (keeps everything seamless)
  useEffect(() => {
    const run = () => {
      import('@/components/HeaderBar')
      import('@/components/ShopGrid')
      import('@/components/BannedLogin')
      import('@/components/ChakraBottomRunner')
      import('@/components/HeartBeatButton')
      import('@/components/OrbShell')
      import('@/components/BlueOrbCross3D') // ensures the single canvas code is ready
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
      className="lb-screen w-full font-bold"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* SINGLE persistent orb (never remounts) */}
      <OrbShell
        mode={mode}
        loaderShow={loaderShow}
        gateStep={gateStep}
        isProceeding={isProceeding}
        onAdvanceGate={advanceGate}
        onProceed={triggerProceed}
        ctrlPx={ctrlPx}
      />

      {/* Gate */}
      {inGate && (
        <main className="lb-screen">
          <BannedLogin onAdvanceGate={advanceGate} />
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

      {/* White curtain overlay (no WebGL inside) */}
      <WhiteLoader show={loaderShow} />
    </div>
  )
}
