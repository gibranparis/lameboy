// src/app/page.js
'use client'

export const dynamic = 'force-static'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
const CheckoutView = nextDynamic(() => import('@/components/CheckoutView'), { ssr: false })
const CartButton = nextDynamic(() => import('@/components/CartButton'), { ssr: false })
const NewsletterForm = nextDynamic(() => import('@/components/NewsletterForm'), { ssr: false })

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

  /* ===================== Gate state ===================== */

  const [gateStep, setGateStep] = useState(0) // 0..3
  const [isProceeding, setIsProceeding] = useState(false)
  const [sequenceActive, setSequenceActive] = useState(false)

  const proceedFired = useRef(false)
  const proceedDelayTimer = useRef(null)

  // Prevent rapid multi-fire from skipping yellow/green
  const lastGateAdvanceAt = useRef(0)
  const GATE_ADVANCE_COOLDOWN_MS = 180

  const advanceGate = useCallback(() => {
    if (!inGate) return
    if (proceedFired.current || isProceeding) return

    const now = performance.now()
    if (now - lastGateAdvanceAt.current < GATE_ADVANCE_COOLDOWN_MS) return
    lastGateAdvanceAt.current = now

    // If on step 0, immediately show RED and start auto-sequence
    if (gateStep === 0) {
      setGateStep(1)
      setSequenceActive(true)
    } else {
      setGateStep((s) => (s >= 3 ? 3 : s + 1))
    }
  }, [inGate, isProceeding, gateStep])

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

    setLoaderShow(true)

    const root = document.documentElement
    root.setAttribute('data-theme', 'day')
    try {
      localStorage.setItem('lb:theme', 'day')
    } catch {}

    // mount shop behind loader
    const t1 = setTimeout(() => {
      setMode('shop')
    }, 120)

    // fade loader out
    const t2 = setTimeout(() => {
      setLoaderShow(false)
    }, LOADER_MS)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mode])

  const triggerProceed = useCallback(() => {
    if (!inGate) return
    if (proceedFired.current) return
    proceedFired.current = true

    // lock to black phase (OrbShell will render black immediately)
    setIsProceeding(true)

    // Two frames to guarantee black paints before loader/shop work
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cleanup = handleEnterShop()
        void cleanup
      })
    })
  }, [handleEnterShop, inGate])

  // When we hit green via manual clicks (not auto-sequence), proceed after a brief pause
  useEffect(() => {
    if (!inGate) return
    if (gateStep !== 3) return
    if (proceedFired.current || isProceeding) return
    if (sequenceActive) return // auto-sequence handles its own timing

    clearTimeout(proceedDelayTimer.current)
    proceedDelayTimer.current = setTimeout(() => {
      triggerProceed()
    }, 300)

    return () => clearTimeout(proceedDelayTimer.current)
  }, [gateStep, inGate, isProceeding, triggerProceed, sequenceActive])

  // Auto-advance through color sequence, aligned to clock-second boundaries.
  // Each color change fires when the clock's seconds digit ticks.
  useEffect(() => {
    if (!sequenceActive || !inGate) return

    let timer
    // ms until the next whole-second boundary
    const msToNextSec = 1000 - (Date.now() % 1000)

    if (gateStep === 1) {
      // RED → YELLOW at next second boundary (ensure at least 600ms so RED doesn't feel rushed)
      const redDelay = msToNextSec < 600 ? msToNextSec + 1000 : msToNextSec
      timer = setTimeout(() => setGateStep(2), redDelay)
    } else if (gateStep === 2) {
      // YELLOW → GREEN at next second boundary
      timer = setTimeout(() => setGateStep(3), msToNextSec)
    } else if (gateStep === 3) {
      // GREEN → BLACK at next second boundary, then proceed
      timer = setTimeout(() => {
        setSequenceActive(false)
        triggerProceed()
      }, msToNextSec)
    }

    return () => clearTimeout(timer)
  }, [sequenceActive, gateStep, inGate, triggerProceed])

  // cleanup any pending timer if component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(proceedDelayTimer.current)
    }
  }, [])

  /* ===================== Checkout side panel ===================== */
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)

  useEffect(() => {
    const toggle = () => {
      setCheckoutOpen((prev) => {
        if (prev) {
          // Already open — ask CheckoutView to animate closed first
          window.dispatchEvent(new Event('checkout:request-close'))
          return prev // stay mounted until onClose fires
        }
        return true
      })
    }
    window.addEventListener('checkout:toggle', toggle)
    return () => window.removeEventListener('checkout:toggle', toggle)
  }, [])

  // Pre-warm client bundles and preload images while idle
  useEffect(() => {
    const run = () => {
      // Preload bundles
      import('@/components/HeaderBar')
      import('@/components/ShopGrid')
      import('@/components/BannedLogin')
      import('@/components/ChakraBottomRunner')
      import('@/components/HeartBeatButton')
      import('@/components/CheckoutView')
      import('@/components/OrbShell')
      import('@/components/BlueOrbCross3D')

      // Preload FULL-RES images in background during gate
      // Thumbs are tiny and load instantly, so preload the big ones
      if (mode === 'gate' && gateStep >= 0) {
        products.forEach((p, idx) => {
          setTimeout(() => {
            // Preload full-res image for detail view
            const fullImg = new Image()
            fullImg.src = p.image

            // Also preload all images array if present
            if (p.images && p.images.length > 1) {
              p.images.slice(1).forEach((src, i) => {
                setTimeout(() => {
                  const img = new Image()
                  img.src = src
                }, (i + 1) * 50)
              })
            }
          }, idx * 80) // Stagger by 80ms
        })
      }
    }

    const id =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(run, { timeout: 1200 })
        : setTimeout(run, 180)

    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [mode, gateStep])

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
      {(inGate || loaderShow) && (
        <main className="lb-screen">
          <BannedLogin onAdvanceGate={advanceGate} onProceed={triggerProceed} gateStep={gateStep} isProceeding={isProceeding} />
        </main>
      )}

      {/* Shop */}
      {inShop && (
        <>
          <HeaderBar ctrlPx={ctrlPx} />

          <main style={{ paddingTop: ctrlPx }}>
            <ShopGrid products={products} autoOpenFirstOnMount />
            {!loaderShow && (
              <>
                <HeartBeatButton className="heart-submit" aria-label="Newsletter signup" onClick={() => setNewsletterOpen((v) => !v)} />
                <NewsletterForm open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
              </>
            )}
          </main>

          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
        </>
      )}

      {/* Cart button — independent of header so it stays above checkout */}
      {inShop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 'var(--header-pad-x, 16px)',
            height: 'var(--header-ctrl, 64px)',
            width: 'var(--header-ctrl, 64px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
          }}
        >
          <CartButton
            size={36}
            inHeader
            imgSrc={null}
            onClick={() => window.dispatchEvent(new Event('checkout:toggle'))}
          />
        </div>
      )}

      {/* Checkout side panel */}
      {checkoutOpen && <CheckoutView onClose={() => setCheckoutOpen(false)} />}

      {/* White curtain overlay (no WebGL inside) */}
      <WhiteLoader show={loaderShow} />
    </div>
  )
}
