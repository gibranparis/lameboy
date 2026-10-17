// src/app/page.js
'use client'

export const dynamic = 'force-static'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import nextDynamic from 'next/dynamic'
import { PRODUCTS, fetchProducts } from '@/lib/products'

import OrbShell from '@/components/OrbShell'
import SplashVideoBackground from '@/components/SplashVideoBackground'
import OrbRain, { RAIN_DELAY_MS, RAIN_COVER_MS, prepareOrbRain } from '@/components/OrbRain'

// Gate (text only now)
const BannedLogin = nextDynamic(() => import('@/components/BannedLogin'), { ssr: false })

// Shop
import ShopGrid from '@/components/ShopGrid'
import { isSignedIn, useProfile } from '@/lib/profile'
import { useCart } from '@/contexts/CartContext'
import { freeShipTokens } from '@/lib/freeShipping'
import { useDragSnap, pinball, resetDragged, GRID_MOVED } from '@/lib/dragSnap'
import { askForMotion, onShake } from '@/lib/shake'
import { haptic } from '@/lib/haptics'
const HeaderBar = nextDynamic(() => import('@/components/HeaderBar'), { ssr: false })
const HeartBeatButton = nextDynamic(() => import('@/components/HeartBeatButton'), { ssr: false })
const CheckoutView = nextDynamic(() => import('@/components/CheckoutView'), { ssr: false })
const NewsletterForm = nextDynamic(() => import('@/components/NewsletterForm'), { ssr: false })
const TokensPill = nextDynamic(() => import('@/components/TokensPill'), { ssr: false })
const QuickAddSizes = nextDynamic(() => import('@/components/QuickAddSizes'), { ssr: false })
const MusicPlayerButton = nextDynamic(() => import('@/components/MusicPlayerButton'), { ssr: false })

const RUNNER_H = 14
const LOADER_MS = 900 // black orb + "Let All Mankind Evolve" before the shop
// With motion on, about when the orb rain has covered the page (it says so itself)
const RAIN_LOADER_MS = RAIN_DELAY_MS + RAIN_COVER_MS
// One beat per chakra: red → orange → yellow → green → blue → purple → pink → black
const CHAKRA_STEP_MS = 220
const PILL_LINGER_MS = 5000 // how long the tokens pill stays up after it shows
// Splash video is off by default; enable by setting NEXT_PUBLIC_SPLASH_VIDEO=on and redeploying
const SPLASH_VIDEO_ON = process.env.NEXT_PUBLIC_SPLASH_VIDEO === 'on'

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

  const [shopProducts, setShopProducts] = useState(PRODUCTS)

  useEffect(() => {
    fetchProducts()
      .then((p) => { if (p?.length) setShopProducts(p) })
      .catch(() => {})
  }, [])

  const [mode, setMode] = useState('gate') // 'gate' | 'shop'
  const [theme, setTheme] = useState('day')
  const [loaderShow, setLoaderShow] = useState(false)
  const [videoRevealed, setVideoRevealed] = useState(false)

  const inGate = mode === 'gate'
  const inShop = mode === 'shop'

  /* ===================== Gate state ===================== */

  const [gateStep, setGateStep] = useState(0) // 0..7
  const [isProceeding, setIsProceeding] = useState(false)
  const [sequenceActive, setSequenceActive] = useState(false)
  // True while the orb is being dragged or snapping back; pauses the gate
  // sequence so it can't move on mid-drag; the release resumes it.
  const [orbHeld, setOrbHeld] = useState(false)

  const proceedFired = useRef(false)
  // When the current colour gives way to the next; steps are timed against
  // this rather than chained timeouts so the rhythm doesn't drift
  const stepDue = useRef(0)
  // Time left on the current colour when a drag paused the sequence
  const heldRemaining = useRef(/** @type {number|null} */ (null))

  // Starts the chakra sequence. Every gate gesture (tap, drag, hold, double
  // click, Enter) lands here; once the sequence is running it's a no-op so
  // nothing can skip a colour.
  const advanceGate = useCallback(() => {
    if (!inGate) return
    if (proceedFired.current || isProceeding) return
    if (gateStep !== 0) return
    stepDue.current = performance.now() + CHAKRA_STEP_MS
    setGateStep(1)
    setSequenceActive(true)
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

  // Let the shop's own background tokens go transparent once the video
  // wallpaper is up, so it stays visible behind the grid too
  useEffect(() => {
    const root = document.documentElement
    if (videoRevealed) root.setAttribute('data-video-revealed', '1')
    else root.removeAttribute('data-video-revealed')
  }, [videoRevealed])

  // Auto-start the gate sequence the moment the video wallpaper is ready —
  // no click required. Still fires the same advanceGate() a click would,
  // so nothing about the sequence itself changes, just what triggers it.
  const autoStartedRef = useRef(false)
  useEffect(() => {
    if (!videoRevealed) return
    if (!inGate) return
    if (gateStep !== 0) return
    if (autoStartedRef.current) return
    autoStartedRef.current = true
    advanceGate()
  }, [videoRevealed, inGate, gateStep, advanceGate])

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

  // Orb crosses rain over the page as the splash hands over to the shop
  const [rainOn, setRainOn] = useState(false)
  const rainMotion = () =>
    typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const handleEnterShop = useCallback(() => {
    if (mode !== 'gate') return

    setLoaderShow(true)
    const raining = rainMotion()
    const rainT = raining ? setTimeout(() => setRainOn(true), RAIN_DELAY_MS) : 0

    const root = document.documentElement
    root.setAttribute('data-theme', 'day')
    try {
      localStorage.setItem('lb:theme', 'day')
    } catch {}

    // mount shop behind loader
    const t1 = setTimeout(() => {
      setMode('shop')
    }, 120)

    // fade loader out. When it's raining the rain says when the page is
    // covered (onCovered); this is only a fallback in case it never does.
    const t2 = setTimeout(() => {
      setLoaderShow(false)
    }, raining ? RAIN_LOADER_MS + 4000 : LOADER_MS)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(rainT)
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

  // Auto-advance: each chakra holds for exactly one CHAKRA_STEP_MS beat, then
  // pink gives way to black and the shop. A drag pauses the beat and the
  // release picks it up where it stopped.
  useEffect(() => {
    if (!sequenceActive || !inGate) return
    if (orbHeld) {
      heldRemaining.current = Math.max(0, stepDue.current - performance.now())
      return
    }
    if (heldRemaining.current !== null) {
      stepDue.current = performance.now() + heldRemaining.current
      heldRemaining.current = null
    }

    const timer = setTimeout(() => {
      // A late timer is made up on the next beat (up to half a beat), so the
      // rhythm holds on a busy phone; a long stall (background tab) restarts it
      stepDue.current = Math.max(stepDue.current, performance.now() - CHAKRA_STEP_MS / 2) + CHAKRA_STEP_MS
      if (gateStep < 7) {
        setGateStep(gateStep + 1)
      } else {
        setSequenceActive(false)
        triggerProceed()
      }
    }, Math.max(0, stepDue.current - performance.now()))

    return () => clearTimeout(timer)
  }, [sequenceActive, gateStep, inGate, triggerProceed, orbHeld])

  // Enter key on the gate triggers the same sequence as clicking the orb
  useEffect(() => {
    if (!inGate) return
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Enter') advanceGate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inGate, advanceGate])

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
  const profile = useProfile()
  const heartFilled = isSignedIn(profile)
  // Signed in, the tokens pill pops up under the heart: as the shop opens
  // and whenever the cart's tokens grow. It lingers a few seconds (longer
  // while it's being moved itself), and anything on the grid moving clears
  // it away at once.
  const { total: cartTotal, cartReady } = useCart()
  const [pillUp, setPillUp] = useState(false)
  const pillTimer = useRef(/** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined))
  const pillHeld = useRef(false)
  const lingerPill = useCallback(() => {
    clearTimeout(pillTimer.current)
    if (!pillHeld.current) pillTimer.current = setTimeout(() => setPillUp(false), PILL_LINGER_MS)
  }, [])
  const pillTotal = useRef(/** @type {number | null} */ (null))
  useEffect(() => {
    if (!inShop || !shopReady || !heartFilled || !cartReady) {
      pillTotal.current = null
      return
    }
    const before = pillTotal.current
    pillTotal.current = cartTotal
    if (before === null || cartTotal > before) {
      setPillUp(true)
      lingerPill()
    }
  }, [inShop, shopReady, heartFilled, cartReady, cartTotal, lingerPill])
  useEffect(() => {
    const clear = () => {
      clearTimeout(pillTimer.current)
      setPillUp(false)
    }
    window.addEventListener(GRID_MOVED, clear)
    return () => {
      window.removeEventListener(GRID_MOVED, clear)
      clearTimeout(pillTimer.current)
    }
  }, [])
  const onPillHold = useCallback((/** @type {boolean} */ held) => {
    pillHeld.current = held
    if (held) clearTimeout(pillTimer.current)
    else lingerPill()
  }, [lingerPill])

  /* ===================== Shop → splash ===================== */
  // Once entered, the shop stays mounted (hidden) while the splash page shows,
  // so the music player inside it keeps playing across the round trip
  const [shopMounted, setShopMounted] = useState(false)
  useEffect(() => { if (inShop) setShopMounted(true) }, [inShop])

  // The LAME logo takes you back to the splash page with the orb ready for a
  // fresh tap. autoStartedRef stays set, so the splash video (when on) doesn't
  // auto-run the sequence and bounce you straight back into the shop.
  const returnToGate = useCallback(() => {
    if (mode !== 'shop') return
    // Fold the grid and close any overlay; the music player keeps playing
    window.dispatchEvent(new Event('lb:fold-shop'))
    setNewsletterOpen(false)
    setCheckoutOpen(false)
    proceedFired.current = false
    heldRemaining.current = null
    setSequenceActive(false)
    setIsProceeding(false)
    setOrbHeld(false)
    setGateStep(0)
    setLoaderShow(false)
    setMode('gate')
    try { window.scrollTo(0, 0) } catch {}
  }, [mode])

  // Top-row controls stay wherever they're dragged until the grid folds; the
  // iPod and heart keep working right where they are (their pop-ups open
  // beside them), the logo springs home on a tap
  const ipodRef = useRef(null)
  const logoRef = useRef(null)
  const heartRef = useRef(null)
  // Dropped, they stay put; flicked, they pinball around and back home
  useDragSnap(ipodRef, { touchAction: 'none', key: 'ipod', stayOnTap: true, fling: pinball }, [inShop])
  // Shake the phone and every piece that's been moved springs back into
  // place (like a tap on open space). iOS asks for motion access on the
  // first tap in the shop.
  useEffect(() => {
    if (!inShop) return
    const ask = () => askForMotion()
    window.addEventListener('pointerdown', ask, { once: true, capture: true })
    const stop = onShake(() => {
      haptic([12, 40, 12])
      resetDragged({ spring: true })
    })
    return () => {
      window.removeEventListener('pointerdown', ask, { capture: true })
      stop()
    }
  }, [inShop])
  useDragSnap(logoRef, { touchAction: 'none', key: 'logo', fling: pinball }, [inShop])
  useDragSnap(heartRef, { touchAction: 'none', key: 'heart', stayOnTap: true, fling: pinball }, [inShop, loaderShow])

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
      // the splash → shop orb rain's worker, so it's loaded before it plays
      if (mode === 'gate') prepareOrbRain()

      // Preload FULL-RES images in background during gate
      // Thumbs are tiny and load instantly, so preload the big ones
      if (mode === 'gate' && gateStep >= 0) {
        shopProducts.forEach((p, idx) => {
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
  }, [mode, gateStep, shopProducts])

  return (
    <div
      className="lb-screen w-full font-bold"
      style={{
        background: videoRevealed ? 'transparent' : 'var(--bg,#000)',
        color: 'var(--text,#fff)',
      }}
    >
      {/* Persistent video wallpaper — mounted once here so it survives the
          gate → shop transition without remounting the YouTube player */}
      {SPLASH_VIDEO_ON && (
        <SplashVideoBackground
          onRevealed={() => setVideoRevealed(true)}
          onHidden={() => setVideoRevealed(false)}
        />
      )}

      {rainOn && <OrbRain onCovered={() => setLoaderShow(false)} onDone={() => setRainOn(false)} />}

      {/* SINGLE persistent orb (never remounts) */}
      <OrbShell
        mode={mode}
        loaderShow={loaderShow}
        gateStep={gateStep}
        isProceeding={isProceeding}
        onAdvanceGate={advanceGate}
        onHoldChange={setOrbHeld}
        ctrlPx={ctrlPx}
      />

      {/* Gate */}
      {(inGate || loaderShow) && (
        <main className="lb-screen" style={{ background: 'transparent' }}>
          <BannedLogin
            onAdvanceGate={advanceGate}
            onProceed={advanceGate}
            gateStep={gateStep}
            isProceeding={isProceeding}
            videoRevealed={videoRevealed}
            orbHeld={orbHeld}
          />
        </main>
      )}

      {/* Shop */}
      {(inShop || shopMounted) && (
        <div
          aria-hidden={!inShop}
          style={
            inShop
              ? { display: 'contents' }
              : { position: 'fixed', inset: 0, overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' }
          }
        >
          <HeaderBar ctrlPx={ctrlPx} shopReady={shopReady} />

          {/* Player panel anchor — fixed just below the header buttons.
              Transparent: only the video itself covers the grid, so hoodies
              stay visible on either side of it. */}
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
            }}
          />

          {/* ── Fixed control row: iPod (left) + heart (right) ──
              No bar of its own: transparent, so hoodies scrolling or moving
              underneath are never cut off at its edge (only the controls
              themselves sit on top, and it never takes a touch) */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 'calc(var(--safe-top, 0px) + var(--header-ctrl, 64px))',
              zIndex: 9990,
              pointerEvents: 'none',
              background: 'transparent',
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
              <div ref={ipodRef} style={{
                pointerEvents: 'auto',
                width: 'var(--header-ctrl, 64px)',
                height: 'var(--header-ctrl, 64px)',
                display: 'grid',
                placeItems: 'center',
              }} className="music-player-container">
                <MusicPlayerButton size={34} playlistId="PLjFcLJUkRnCfwuDzyq6SOJZQfirqpF5Cd" autoOpen={shopReady} />
              </div>

              {/* Center: LAME logo — back to the splash page */}
              <button
                ref={logoRef}
                aria-label="Back to start"
                onClick={returnToGate}
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
                className="lame-logo-button"
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
                  <div ref={heartRef} style={{ pointerEvents: 'auto' }}>
                    <HeartBeatButton
                      className="heart-submit"
                      style={{ position: 'relative', top: 'auto', right: 'auto', contain: 'none' }}
                      filled={heartFilled}
                      ariaLabel={heartFilled ? 'Your profile' : 'Join'}
                      title={heartFilled ? 'Your profile' : 'Join'}
                      mode="heart"
                      onClick={() => setNewsletterOpen((v) => !v)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main — flex column: header, then the open band the grid centres in, then the bottom bar */}
          <main
            className="shop-main"
            style={{
              paddingTop: 'calc(var(--safe-top, 0px) + var(--header-ctrl, 64px))',
              // Room for the bottom bar (toggle / orb / cart), so the open band
              // below ends where the bar begins
              paddingBottom: 'calc(var(--header-ctrl, 64px) + var(--safe-bottom, 0px))',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100dvh',
              // No global border-box: without this, paddingTop adds onto 100dvh
              // and the page always scrolls by one header height.
              boxSizing: 'border-box',
              // Reveal: product grid scales up from center
              opacity: shopReady ? 1 : 0,
              transform: shopReady ? 'none' : 'scale(0.94) translateY(20px)',
              transition: REVEAL_T,
              transitionDelay: shopReady ? '0.22s' : '0s',
            }}
          >
            {/* The open band runs from the bottom of the player (paddingTop matches
                its height) to the top of the bottom bar; margin auto centres the grid
                in it, so the gap above the hoodies always equals the gap below at
                every zoom step (the stack sits centre-right). When the grid outgrows
                the band the page scrolls, and scrolling all the way up reveals the
                full top item above the player boundary. No DOM element in the dead
                zones, so iOS touches there pass directly to <main>. */}
            <div style={{
              flex: '1 0 auto',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 'var(--yt-panel-h, 0px)',
              transition: 'padding-top 0.28s ease',
            }}>
              <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                <ShopGrid products={shopProducts} autoOpenFirstOnMount shopReady={shopReady} />
              </div>
              {!loaderShow && (
                <NewsletterForm open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
              )}
            </div>
          </main>

        </div>
      )}


      {/* Tokens toward free shipping, under the heart once signed in: up for
          a little after it's shown (see pillUp), never while the heart panel,
          with the full meter, is open */}
      {inShop && !loaderShow && heartFilled && cartReady && (
        <TokensPill
          {...freeShipTokens(cartTotal, profile?.country)}
          hidden={!pillUp || newsletterOpen || !shopReady}
          onOpen={() => setNewsletterOpen(true)}
          onHold={onPillHold}
        />
      )}

      {/* Checkout side panel */}
      {checkoutOpen && <CheckoutView onClose={() => setCheckoutOpen(false)} />}

      {/* Sizes that pop out of the cart when a tile is dropped on it */}
      {inShop && <QuickAddSizes />}
    </div>
  )
}
