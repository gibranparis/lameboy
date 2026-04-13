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
import ShopGrid from '@/components/ShopGrid'
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })
const CheckoutView = nextDynamic(() => import('@/components/CheckoutView'), { ssr: false })
const CartButton = nextDynamic(() => import('@/components/CartButton'), { ssr: false })
const NewsletterForm = nextDynamic(() => import('@/components/NewsletterForm'), { ssr: false })
const MusicPlayerButton = nextDynamic(() => import('@/components/MusicPlayerButton'), { ssr: false })

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

  const [gateStep, setGateStep] = useState(0) // 0..7
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
      setGateStep((s) => (s >= 7 ? 7 : s + 1))
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

  // Lock overflow during loader transition so shop content mounting
  // doesn't create scrollbars that shift the fixed-position orb
  useEffect(() => {
    const root = document.documentElement
    if (loaderShow) {
      root.setAttribute('data-loader-active', '1')
    } else {
      root.removeAttribute('data-loader-active')
    }
  }, [loaderShow])

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

  // When we hit pink via manual clicks (not auto-sequence), proceed after a brief pause
  useEffect(() => {
    if (!inGate) return
    if (gateStep !== 7) return
    if (proceedFired.current || isProceeding) return
    if (sequenceActive) return // auto-sequence handles its own timing

    clearTimeout(proceedDelayTimer.current)
    proceedDelayTimer.current = setTimeout(() => {
      triggerProceed()
    }, 300)

    return () => clearTimeout(proceedDelayTimer.current)
  }, [gateStep, inGate, isProceeding, triggerProceed, sequenceActive])

  // Auto-advance through color sequence.
  // RED holds until the next clock-second boundary (min 600ms), then each subsequent
  // color (orange→yellow→green→blue→purple→pink) fires every 333ms so the total
  // time to black stays the same as the original 3-step sequence (~3 s).
  const STEP_MS = 333
  useEffect(() => {
    if (!sequenceActive || !inGate) return

    let timer
    // ms until the next whole-second boundary
    const msToNextSec = 1000 - (Date.now() % 1000)

    if (gateStep === 1) {
      // RED → ORANGE at next second boundary (ensure at least 600ms so RED doesn't feel rushed)
      const redDelay = msToNextSec < 600 ? msToNextSec + 1000 : msToNextSec
      timer = setTimeout(() => setGateStep(2), redDelay)
    } else if (gateStep >= 2 && gateStep <= 6) {
      // ORANGE → YELLOW → GREEN → BLUE → PURPLE, each holding for STEP_MS
      timer = setTimeout(() => setGateStep((s) => s + 1), STEP_MS)
    } else if (gateStep === 7) {
      // PINK → BLACK + proceed after one last STEP_MS
      timer = setTimeout(() => {
        setSequenceActive(false)
        triggerProceed()
      }, STEP_MS)
    }

    return () => clearTimeout(timer)
  }, [sequenceActive, gateStep, inGate, triggerProceed])

  // Enter key on the gate triggers the same sequence as clicking the orb
  useEffect(() => {
    if (!inGate) return
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Enter') advanceGate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inGate, advanceGate])

  // cleanup any pending timer if component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(proceedDelayTimer.current)
    }
  }, [])

  /* ===================== Shop reveal animation ===================== */

  // All UI items start at screen center (where the orb was) and fly to their positions
  // after the orb finishes its transition (600ms) once the loader hides
  const [shopReady, setShopReady] = useState(false)

  useEffect(() => {
    if (!inShop || loaderShow) {
      setShopReady(false)
      return
    }
    // fire as soon as loader hides — orb is the hero at screen center, everything bursts from there
    const t = setTimeout(() => setShopReady(true), 80)
    return () => clearTimeout(t)
  }, [inShop, loaderShow])

  const REVEAL_T = 'transform 0.6s cubic-bezier(0.2,0.9,0.2,1), opacity 0.5s ease'

  /* ===================== Checkout side panel ===================== */
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (checkoutOpen) {
      root.setAttribute('data-checkout-open', '1')
    } else {
      root.removeAttribute('data-checkout-open')
    }
  }, [checkoutOpen])

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
          <HeaderBar ctrlPx={ctrlPx} shopReady={shopReady} />

          {/* Player panel anchor — fixed just below the header buttons.
              background spans full width so grid items are occluded behind it. */}
          <div
            id="yt-panel-anchor"
            style={{
              position: 'fixed',
              top: 'calc(var(--safe-top, 0px) + var(--header-ctrl, 64px))',
              left: 0,
              right: 0,
              zIndex: 9980,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
              background: 'var(--bg, #f5f5f0)',
            }}
          />

          {/* ── Fixed control row: iPod (left) + heart (right) ── */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 'calc(var(--safe-top, 0px) + var(--header-ctrl, 64px))',
              zIndex: 9990,
              pointerEvents: 'none',
              background: 'var(--bg, #f5f5f0)',
              // Reveal: top row flies up from center
              opacity: shopReady ? 1 : 0,
              transform: shopReady
                ? 'none'
                : 'translateY(calc(50vh - var(--header-ctrl, 64px) / 2))',
              transition: REVEAL_T,
              transitionDelay: shopReady ? '0.12s' : '0s',
            }}
          >
            <div
              style={{
                paddingTop: 'var(--safe-top, 0px)',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                paddingRight: 'max(var(--header-pad-x, 16px), env(safe-area-inset-right))',
              }}
            >
              {/* Left: iPod / music player */}
              <div style={{
                pointerEvents: 'auto',
                width: 'var(--header-ctrl, 64px)',
                height: 'var(--header-ctrl, 64px)',
                display: 'grid',
                placeItems: 'center',
              }}>
                <MusicPlayerButton size={34} playlistId="PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd" />
              </div>

              {/* Center: LAME logo reset button */}
              <button
                aria-label="Reset"
                onClick={() => {
                  window.dispatchEvent(new Event('lb:reset'))
                  setNewsletterOpen(false)
                  window.dispatchEvent(new Event('checkout:request-close'))
                  setCheckoutOpen(false)
                }}
                style={{
                  pointerEvents: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  opacity: 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <img
                  src="/Blue hand-drawn symbol with _LAME_.png"
                  alt="LAME"
                  width={38}
                  height={38}
                  style={{
                    objectFit: 'contain',
                    display: 'block',
                    filter: theme === 'night' ? 'brightness(0) invert(1)' : 'none'
                  }}
                  draggable={false}
                />
              </button>

              {/* Right: heart / newsletter */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!loaderShow && (
                  <div style={{ pointerEvents: 'auto' }}>
                    <HeartBeatButton
                      className="heart-submit"
                      style={{ position: 'relative', top: 'auto', right: 'auto', contain: 'none' }}
                      aria-label="Newsletter signup"
                      title="submit"
                      mode="heart"
                      onClick={() => setNewsletterOpen((v) => !v)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main — flex column. Spacer pushes grid to bottom. */}
          <main
            style={{
              paddingTop: 'calc(var(--safe-top, 0px) + var(--header-ctrl, 64px))',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100dvh',
              // Reveal: product grid scales up from center
              opacity: shopReady ? 1 : 0,
              transform: shopReady ? 'none' : 'scale(0.94) translateY(20px)',
              transition: REVEAL_T,
              transitionDelay: shopReady ? '0.22s' : '0s',
            }}
          >
            {/* marginTop:auto pushes grid to bottom — no DOM element in the dead zone,
                so iOS touches in that gap pass directly to <main> with no interference.
                paddingTop matches the open player height so scrolling all the way up
                reveals the full top item above the player boundary. */}
            <div style={{
              marginTop: 'auto',
              paddingTop: 'var(--yt-panel-h, 0px)',
              transition: 'padding-top 0.28s ease',
            }}>
              <ShopGrid products={products} autoOpenFirstOnMount shopReady={shopReady} />
              {!loaderShow && (
                <NewsletterForm open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
              )}
            </div>
          </main>

        </>
      )}

      {/* Cart button — independent of header so it stays above checkout */}
      {inShop && (
        <div
          data-cart-container
          style={{
            position: 'fixed',
            bottom: 'var(--safe-bottom, 0px)',
            top: 'unset',
            right: 'var(--header-pad-x, 16px)',
            height: 'var(--header-ctrl, 64px)',
            width: 'var(--header-ctrl, 64px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            // Reveal: cart slides in from center-left to bottom-right
            opacity: shopReady ? 1 : 0,
            transform: shopReady
              ? 'none'
              : 'translate(calc(-50vw + var(--header-ctrl, 64px) / 2 + var(--header-pad-x, 16px)), calc(-50vh + var(--header-ctrl, 64px) / 2))',
            transition: REVEAL_T,
            transitionDelay: shopReady ? '0.05s' : '0s',
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
