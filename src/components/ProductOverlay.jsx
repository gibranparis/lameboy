// src/components/ProductOverlay.jsx
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'

/* ---------------- utils ---------------- */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const wrap = (i, len) => ((i % len) + len) % len

function flash(el, klass = 'is-hot', ms = 220) {
  if (!el) return
  el.classList.remove(klass)
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth
  el.classList.add(klass)
  window.setTimeout(() => el.classList.remove(klass), ms)
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/* ---------------- theme hook (reactive) ---------------- */
function useTheme() {
  const read = () => {
    if (typeof document === 'undefined') return { night: false }
    const root = document.documentElement
    const isNight = root.dataset.theme === 'night' || root.classList.contains('dark')
    return { night: isNight }
  }
  const [{ night }, setState] = useState(read)

  useEffect(() => {
    const onTheme = (e) => {
      const t = e?.detail?.theme
      if (t === 'night') setState({ night: true })
      else if (t === 'day') setState({ night: false })
      else setState(read())
    }
    setState(read())
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return night
}

/* ---------------- arrow buttons ---------------- */
function ArrowControl({ dir = 'up', night, onClick, dataUi, isHot = false }) {
  const baseBg = isHot
    ? 'var(--hover-green, #0bf05f)'
    : (night ? 'rgba(255,255,255,0.10)' : '#ffffff')
  const boxShadowValue = isHot
    ? '0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px rgba(0, 0, 0, 0.18)'
    : night
    ? '0 2px 10px rgba(0,0,0,.14), inset 0 0 0 1px rgba(255,255,255,.24)'
    : '0 2px 10px rgba(0,0,0,.14), inset 0 0 0 1px rgba(0,0,0,.10)'
  const glyph = isHot ? '#000000' : (night ? '#ffffff' : '#0f1115')

  return (
    <button
      type="button"
      onClick={onClick}
      data-ui={dataUi}
      className="arrow-pill"
      aria-label={dir === 'up' ? 'Previous product' : 'Next product'}
      title={dir === 'up' ? 'Previous product' : 'Next product'}
      style={{ padding: 0, background: 'transparent', border: 'none' }}
    >
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          background: baseBg,
          boxShadow: boxShadowValue,
          transition: 'background .12s ease, box-shadow .12s ease, transform .08s ease',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            WebkitMaskImage: `var(--arrow-${dir}-url, none)`,
            maskImage: `var(--arrow-${dir}-url, none)`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            backgroundColor: glyph,
          }}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          focusable="false"
          aria-hidden="true"
          style={{ position: 'absolute', opacity: 'var(--arrow-fallback,0)' }}
        >
          {dir === 'up' ? (
            <path
              d="M6 14l6-6 6 6"
              stroke={glyph}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M6 10l6 6 6-6"
              stroke={glyph}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </button>
  )
}

/* ---------------- + / sizes ---------------- */
function PlusSizesInline({ sizes = ['OS', 'S', 'M', 'L', 'XL'], priceStyle, product }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const [hotSize, setHotSize] = useState(null)
  const [showAdded, setAdded] = useState(false)
  const [plusHot, setPlusHot] = useState(false)
  const timers = useRef({})

  const onToggle = useCallback(() => {
    if (showAdded) return
    setOpen((v) => !v)
    setPlusHot(true)
    clearTimeout(timers.current.plusTick)
    timers.current.plusTick = setTimeout(() => setPlusHot(false), 160)
  }, [showAdded])

  const pick = useCallback((sz) => {
    setPicked(sz)
    try {
      window.dispatchEvent(
        new CustomEvent('lb:add-to-cart', {
          detail: {
            product: product, // Pass full product object
            size: sz,
            qty: 1,
          },
        })
      )
    } catch {}
    setHotSize(sz)
    setPlusHot(true)
    clearTimeout(timers.current.plus)
    timers.current.plus = setTimeout(() => setPlusHot(false), 180)

    clearTimeout(timers.current.close)
    timers.current.close = setTimeout(() => {
      setOpen(false)
      setHotSize(null)
      setAdded(true)
      clearTimeout(timers.current.hide)
      timers.current.hide = setTimeout(() => setAdded(false), 900)
    }, 380)
  }, [product])

  useEffect(
    () => () =>
      Object.values(timers.current).forEach((t) => {
        if (t) clearTimeout(t)
      }),
    []
  )

  // Listen for product image clicks to flash + button AND open size picker
  useEffect(() => {
    const onProductClick = () => {
      if (!showAdded) {  // Don't trigger during "Added" notification
        onToggle()  // This flashes green AND opens size picker
      }
    }
    window.addEventListener('product-image-click', onProductClick)
    return () => window.removeEventListener('product-image-click', onProductClick)
  }, [showAdded, onToggle])

  // Close size dropdown when product changes (scroll / swipe / arrow navigation)
  useEffect(() => {
    setOpen(false)
  }, [product])

  const glyph = open ? '–' : '+'
  const addedStyle = {
    color: priceStyle?.color || 'inherit',
    fontSize: priceStyle?.fontSize || 'inherit',
    fontWeight: priceStyle?.fontWeight || 800,
    letterSpacing: priceStyle?.letterSpacing || '.06em',
    lineHeight: 1.05,
  }

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12, position: 'relative' }}>
      <button
        type="button"
        data-ui="size-toggle"
        className={[
          'pill',
          'plus-pill',
          open ? 'is-open' : '',
          plusHot ? 'is-hot' : '',
          showAdded ? 'is-hidden' : '',
        ].join(' ')}
        onClick={onToggle}
        aria-label={open ? 'Close sizes' : showAdded ? 'Added' : 'Choose size'}
        title={open ? 'Close sizes' : showAdded ? 'Added' : 'Choose size'}
        style={{ width: 28, height: 28 }}
      >
        <span aria-hidden style={{ opacity: showAdded ? 0 : 1 }}>
          {glyph}
        </span>
      </button>

      {showAdded && (
        <span
          aria-live="polite"
          className="added-label"
          style={{
            position: 'absolute',
            inset: 'auto auto 0 auto',
            transform: 'translateY(2px)',
            ...addedStyle,
          }}
        >
          Added
        </span>
      )}

      <div
        className={`row-nowrap size-panel ${open ? 'is-open' : ''}`}
        data-ui="size-panel"
        hidden={!open}
        style={{ gap: 8 }}
      >
        {sizes.map((sz) => (
          <button
            key={sz}
            type="button"
            className={[
              'pill',
              'size-pill',
              picked === sz ? 'is-selected' : '',
              hotSize === sz ? 'is-hot' : '',
            ].join(' ')}
            data-size={sz}
            onClick={() => pick(sz)}
            aria-label={`Size ${sz}`}
            title={`Size ${sz}`}
          >
            {sz}
          </button>
        ))}
      </div>

      <style jsx>{`
        .plus-pill {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 18px;
          line-height: 1;
          font-weight: 800;
          color: #0f1115;
          background: #fff;
          box-shadow:
            0 2px 10px rgba(0,0,0,.14),
            inset 0 0 0 1px rgba(0,0,0,.10);
          transition:
            background 0.12s ease,
            box-shadow 0.12s ease,
            transform 0.08s ease,
            color 0.12s ease;
        }
        :root[data-theme='night'] .plus-pill {
          color: #fff;
          background: rgba(255,255,255,0.10);
          box-shadow:
            0 2px 10px rgba(0,0,0,.14),
            inset 0 0 0 1px rgba(255,255,255,.24);
        }
        .plus-pill.is-open,
        .plus-pill.is-hot {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow:
            inset 0 0 0 1px rgba(0, 0, 0, 0.18),
            0 2px 10px rgba(0, 0, 0, 0.12);
          transform: translateZ(0) scale(1.02);
        }

        .size-panel {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.26s ease;
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
        }
        .size-panel.is-open {
          max-height: 68px;
        }
        .size-pill {
          width: 28px;
          height: 28px;
          padding: 0;
          border-radius: 50%;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.02em;
          display: grid;
          place-items: center;
          background: #fff;
          color: #0f1115;
          box-shadow:
            0 2px 10px rgba(0,0,0,.14),
            inset 0 0 0 1px rgba(0,0,0,.10);
          transition:
            transform 0.08s ease,
            box-shadow 0.2s ease,
            background 0.12s ease,
            color 0.12s ease;
        }
        :root[data-theme='night'] .size-pill {
          background: rgba(255,255,255,0.10);
          color: #fff;
          box-shadow:
            0 2px 10px rgba(0,0,0,.14),
            inset 0 0 0 1px rgba(255,255,255,.24);
        }
        .size-pill.is-selected {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </div>
  )
}

/* ---------------- swipe engine ---------------- */
function useSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash, onSwipeBack }) {
  const state = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    ax: 0,
    ay: 0,
    lastT: 0,
    vx: 0,
    vy: 0,
    momentumRaf: 0,
  })

  // Stable refs so the momentum loop always reads fresh values
  const indexRef = useRef(index)
  indexRef.current = index
  const onIndexChangeRef = useRef(onIndexChange)
  onIndexChangeRef.current = onIndexChange
  const onDirFlashRef = useRef(onDirFlash)
  onDirFlashRef.current = onDirFlash

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches

  const STEP_X = coarse ? 88 : 48
  const STEP_Y = coarse ? 150 : 64
  const FLICK_V_BONUS = coarse ? 0 : 0.35

  const cancelMomentum = useCallback(() => {
    if (state.current.momentumRaf) {
      cancelAnimationFrame(state.current.momentumRaf)
      state.current.momentumRaf = 0
    }
  }, [])

  const onDown = useCallback((e) => {
    cancelMomentum()
    const p = e.touches ? e.touches[0] : e
    state.current.active = true
    state.current.lastX = p.clientX
    state.current.lastY = p.clientY
    state.current.ax = 0
    state.current.ay = 0
    state.current.lastT = performance.now()
    state.current.vx = 0
    state.current.vy = 0
  }, [cancelMomentum])

  const onMove = useCallback(
    (e) => {
      if (!state.current.active) return
      if (e.cancelable) e.preventDefault()

      const p = e.touches ? e.touches[0] : e
      const now = performance.now()
      const dt = Math.max(1, now - state.current.lastT)

      const dx = p.clientX - state.current.lastX
      const dy = p.clientY - state.current.lastY

      state.current.vx = dx / dt
      state.current.vy = dy / dt

      state.current.lastX = p.clientX
      state.current.lastY = p.clientY
      state.current.lastT = now

      state.current.ax += dx + state.current.vx * FLICK_V_BONUS * 80
      state.current.ay += dy + state.current.vy * FLICK_V_BONUS * 80

      // Swipe left → close overlay (back to grid)
      if (state.current.ax <= -STEP_X) {
        state.current.active = false
        state.current.ax = 0
        state.current.ay = 0
        state.current.vy = 0
        state.current.vx = 0
        onSwipeBack?.()
        return
      }
      // Swipe right → previous image
      if (imgsLen) {
        while (state.current.ax >= STEP_X) {
          state.current.ax -= STEP_X
          setImgIdx((i) => clamp(i - 1, 0, imgsLen - 1))
        }
      }
      if (prodsLen > 1) {
        while (state.current.ay <= -STEP_Y) {
          state.current.ay += STEP_Y
          onIndexChange?.(wrap(index + 1, prodsLen))
          onDirFlash?.('down')
        }
        while (state.current.ay >= STEP_Y) {
          state.current.ay -= STEP_Y
          onIndexChange?.(wrap(index - 1, prodsLen))
          onDirFlash?.('up')
        }
      }
    },
    [imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash, onSwipeBack]
  )

  const onUp = useCallback(() => {
    state.current.active = false

    const vy = state.current.vy // px per ms
    const absVy = Math.abs(vy)

    // Touch momentum: continue scrolling products after finger lifts
    if (coarse && absVy > 0.25 && prodsLen > 1) {
      let vel = vy * 16 // original multiplier
      const MAX_VEL = 10 // cap peak speed
      vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel))
      let accum = state.current.ay
      let localIdx = indexRef.current
      const FRICTION = 0.92 // original friction — natural decay
      const STOP = 1.5
      const M_STEP = 70 // lighter step than drag so momentum rolls

      const tick = () => {
        vel *= FRICTION
        if (Math.abs(vel) < STOP) {
          state.current.ay = 0
          state.current.ax = 0
          state.current.momentumRaf = 0
          return
        }

        accum += vel

        while (accum <= -M_STEP) {
          accum += M_STEP
          localIdx = wrap(localIdx + 1, prodsLen)
          onIndexChangeRef.current?.(localIdx)
          onDirFlashRef.current?.('down')
        }
        while (accum >= M_STEP) {
          accum -= M_STEP
          localIdx = wrap(localIdx - 1, prodsLen)
          onIndexChangeRef.current?.(localIdx)
          onDirFlashRef.current?.('up')
        }

        state.current.momentumRaf = requestAnimationFrame(tick)
      }

      state.current.momentumRaf = requestAnimationFrame(tick)
    } else {
      state.current.ax = 0
      state.current.ay = 0
    }
  }, [coarse, prodsLen, STEP_Y])

  // Clean up momentum on unmount
  useEffect(() => cancelMomentum, [cancelMomentum])

  return { onDown, onMove, onUp }
}

/* ---------------- component ---------------- */
export default function ProductOverlay({
  products,
  index,
  fromRect,
  onIndexChange,
  onClose,
  onClosed,
}) {
  const night = useTheme()
  const reduceMotion = useMemo(() => prefersReducedMotion(), [])

  const product = products[index]
  const imgs = useMemo(() => {
    const list = product?.images?.length ? product.images : [product?.image].filter(Boolean)
    return Array.isArray(list) ? list : []
  }, [product])

  const [imgIdx, setImgIdx] = useState(0)
  const clampedImgIdx = useMemo(
    () => clamp(imgIdx, 0, Math.max(0, imgs.length - 1)),
    [imgIdx, imgs.length]
  )

  // Track scroll direction for arrow green activation
  const [hotDir, setHotDir] = useState('') // 'up' | 'down' | ''

  // The grid tile we opened from (FLIP anchor)
  const openedIndexRef = useRef(index)
  const didEnterRef = useRef(false)

  const [closing, setClosing] = useState(false)
  const closingRef = useRef(false)

  const heroRef = useRef(null)
  const fromRectRef = useRef(fromRect || null)
  useEffect(() => {
    fromRectRef.current = fromRect || null
  }, [fromRect])

  // If orb was clicked while overlay open, we want to reset grid AFTER close finishes.
  const pendingResetRef = useRef(false)

  const dispatchResetToFive = useCallback(() => {
    try {
      const detail = { value: 5, density: 5, source: 'overlay-reset' }
      window.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
      document.dispatchEvent(new CustomEvent('lb:grid-density', { detail }))
    } catch {}
  }, [])

  const finishClose = useCallback(() => {
    onClose?.()
    onClosed?.()

    if (pendingResetRef.current) {
      pendingResetRef.current = false
      // next tick so grid is mounted/visible before resetting density
      setTimeout(dispatchResetToFive, 0)
    }
  }, [onClose, onClosed, dispatchResetToFive])

  const animateClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)

    const hero = heroRef.current
    const fr = fromRectRef.current

    // Zoom back only if we have an anchor rect.
    // We intentionally allow zoom-back even if user scrolled to another product;
    // it will always return to the tile that originally opened the overlay.
    const canZoomBack = hero && fr && !reduceMotion

    if (!canZoomBack) {
      window.setTimeout(finishClose, 160)
      return
    }

    const to = fr
    const from = hero.getBoundingClientRect()

    const dx = to.left - from.left
    const dy = to.top - from.top
    const sx = to.width / Math.max(1, from.width)
    const sy = to.height / Math.max(1, from.height)

    hero.style.willChange = 'transform'
    hero.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease'
    hero.style.transformOrigin = 'top left'
    hero.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    hero.style.opacity = '0.0'

    window.setTimeout(() => {
      hero.style.willChange = ''
      finishClose()
    }, 210)
  }, [finishClose, reduceMotion])

  /* signal mount for grid guard */
  useEffect(() => {
    try {
      window.dispatchEvent(new Event('lb:overlay-open'))
    } catch {}
  }, [])

  /* orb zoom while overlay is open:
     - set pending reset-to-5
     - zoom-out close (FLIP) */
  useEffect(() => {
    const h = (e) => {
      const d = e?.detail || {}
      if (d?.source === 'overlay-reset') return

      // Only react to real orb zoom events (dir/step-based),
      // not ShopGrid broadcasts that have no dir/step.
      const hasDir = typeof d.dir === 'string'
      const hasStep = Number.isFinite(Number(d.step))
      if (!hasDir && !hasStep) return

      pendingResetRef.current = true
      animateClose()
    }

    const names = ['lb:zoom', 'lb:zoom/grid-density']
    names.forEach((n) => {
      window.addEventListener(n, h)
      document.addEventListener(n, h)
    })
    return () => {
      names.forEach((n) => {
        window.removeEventListener(n, h)
        document.removeEventListener(n, h)
      })
    }
  }, [animateClose])

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return animateClose()
      if (imgs.length) {
        if (e.key === 'ArrowRight') return setImgIdx((i) => clamp(i + 1, 0, imgs.length - 1))
        if (e.key === 'ArrowLeft') return setImgIdx((i) => clamp(i - 1, 0, imgs.length - 1))
      }
      if (products.length > 1) {
        if (e.key === 'ArrowDown') {
          const el = document.querySelector('[data-ui="img-down"]')
          if (el) flash(el)
          // Set hot state for green activation
          setHotDir('down')
          setTimeout(() => setHotDir(''), 180)
          return onIndexChange?.(wrap(index + 1, products.length))
        }
        if (e.key === 'ArrowUp') {
          const el = document.querySelector('[data-ui="img-up"]')
          if (el) flash(el)
          // Set hot state for green activation
          setHotDir('up')
          setTimeout(() => setHotDir(''), 180)
          return onIndexChange?.(wrap(index - 1, products.length))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [animateClose, imgs.length, products.length, index, onIndexChange])

  /* wheel rolls products; horizontal wheel rolls images */
  const lastWheel = useRef(0)
  useEffect(() => {
    const onWheel = (e) => {
      const now = performance.now()
      if (now - lastWheel.current < 110) return
      lastWheel.current = now

      const ax = Math.abs(e.deltaX)
      const ay = Math.abs(e.deltaY)

      if (ax > ay && imgs.length) {
        setImgIdx((i) => clamp(i + (e.deltaX > 0 ? 1 : -1), 0, imgs.length - 1))
        return
      }

      if (products.length > 1) {
        const dirDown = e.deltaY > 0
        const dir = dirDown ? 'down' : 'up'

        // Set hot state for green activation
        setHotDir(dir)
        setTimeout(() => setHotDir(''), 180) // Match + button timing

        flash(document.querySelector(dirDown ? '[data-ui="img-down"]' : '[data-ui="img-up"]'))
        onIndexChange?.(wrap(index + (dirDown ? 1 : -1), products.length))
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [imgs.length, products.length, index, onIndexChange])

  const onDirFlash = useCallback((dir) => {
    flash(document.querySelector(dir === 'down' ? '[data-ui="img-down"]' : '[data-ui="img-up"]'))
    // Set hot state for green activation
    setHotDir(dir)
    setTimeout(() => setHotDir(''), 180)
  }, [])

  const swipe = useSwipe({
    imgsLen: imgs.length,
    prodsLen: products.length,
    index,
    setImgIdx,
    onIndexChange,
    onDirFlash,
    onSwipeBack: animateClose,
  })

  /* overlay flag */
  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1')
    return () => document.documentElement.removeAttribute('data-overlay-open')
  }, [])

  // Reset image index when product changes (wheel roll / swipe up/down)
  useEffect(() => setImgIdx(0), [index])

  // FLIP ENTER: run ONLY ONCE (initial open), double-rAF for stable measurement
  useEffect(() => {
    const hero = heroRef.current
    const fr = fromRectRef.current
    if (!hero || !fr || reduceMotion) return
    if (didEnterRef.current) return
    didEnterRef.current = true

    const run = () => {
      const target = hero.getBoundingClientRect()
      const dx = fr.left - target.left
      const dy = fr.top - target.top
      const sx = fr.width / Math.max(1, target.width)
      const sy = fr.height / Math.max(1, target.height)

      hero.style.transition = 'none'
      hero.style.transformOrigin = 'top left'
      hero.style.willChange = 'transform, opacity'
      hero.style.opacity = '1'
      hero.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`

      requestAnimationFrame(() => {
        hero.style.transition = 'transform 200ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease'
        hero.style.transform = 'translate(0px, 0px) scale(1)'
      })

      const cleanup = () => {
        hero.style.willChange = ''
        hero.removeEventListener('transitionend', cleanup)
      }
      hero.addEventListener('transitionend', cleanup)
    }

    requestAnimationFrame(() => requestAnimationFrame(run))
  }, [reduceMotion])

  // Ensure product changes do NOT keep any stale transform
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (!didEnterRef.current) return
    hero.style.transform = 'translate(0px, 0px) scale(1)'
    hero.style.transformOrigin = ''
    hero.style.transition = ''
    hero.style.opacity = ''
  }, [index])

  if (!product) return null

  const priceText = useMemo(() => {
    if (typeof product.price !== 'number') return String(product.price ?? '')
    const c = product.price
    return c % 100 === 0 ? `$${c / 100}` : `$${(c / 100).toFixed(2)}`
  }, [product.price])

  const sizes = product.sizes?.length ? product.sizes : ['OS', 'S', 'M', 'L', 'XL']

  const priceRef = useRef(null)
  const [priceStyle, setPriceStyle] = useState(null)
  useEffect(() => {
    if (!priceRef.current) return
    const cs = getComputedStyle(priceRef.current)
    setPriceStyle({
      color: cs.color,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
    })
  }, [])

  return (
    <>
      <div
        className="product-hero-overlay"
        data-overlay
        role="dialog"
        aria-modal="true"
        aria-label={`${product.title} details`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 520,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          pointerEvents: 'none',
          overscrollBehavior: 'contain',
          cursor: 'default',
        }}
      >
        {/* click-away */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            animateClose()
          }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            top: 'var(--header-ctrl,64px)',
            background: 'transparent',
            pointerEvents: 'auto',
          }}
        />

        <div
          ref={heroRef}
          className="product-hero"
          style={{
            pointerEvents: 'auto',
            textAlign: 'center',
            zIndex: 521,
            touchAction: 'none',
            transform: closing ? 'scale(0.94)' : undefined,
            opacity: closing ? 0.0 : undefined,
            transition: closing ? 'transform 160ms ease, opacity 160ms ease' : undefined,
          }}
          onPointerDown={swipe.onDown}
          onPointerMove={swipe.onMove}
          onPointerUp={swipe.onUp}
          onPointerCancel={swipe.onUp}
        >
          {/* side arrows */}
          {products.length > 1 && (
            <div
              style={{
                position: 'fixed',
                left: `calc(12px + env(safe-area-inset-left,0px))`,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'grid',
                gap: 8,
                zIndex: 110,
              }}
            >
              <ArrowControl
                dir="up"
                night={night}
                dataUi="img-up"
                isHot={hotDir === 'up'}
                onClick={() => {
                  onIndexChange?.(wrap(index - 1, products.length))
                  onDirFlash('up')
                }}
              />
              <ArrowControl
                dir="down"
                night={night}
                dataUi="img-down"
                isHot={hotDir === 'down'}
                onClick={() => {
                  onIndexChange?.(wrap(index + 1, products.length))
                  onDirFlash('down')
                }}
              />
            </div>
          )}

          {!!imgs.length && (
            <>
              <div
                data-ui="product-viewport"
                onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent('product-image-click'))
                  } catch {}
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <Image
                  src={imgs[clampedImgIdx]}
                  alt={product.title}
                  width={2048}
                  height={1536}
                  className="product-hero-img"
                  priority
                  fetchPriority="high"
                  quality={95}
                  sizes="(min-width:1536px) 60vw, (min-width:1024px) 72vw, 92vw"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    imageRendering: 'auto',
                  }}
                />
              </div>
              {imgs.length > 1 && (
                <div
                  className="row-nowrap"
                  style={{ gap: 8, marginTop: 6, justifyContent: 'center', display: 'flex' }}
                >
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i + 1}`}
                      className={`pill dot-pill ${i === clampedImgIdx ? 'is-active' : ''}`}
                      onClick={() => setImgIdx(i)}
                      style={{ width: 18, height: 18, padding: 0 }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div className="product-hero-title">{product.title}</div>
          <div ref={priceRef} className="product-hero-price">
            {priceText}
          </div>
          <PlusSizesInline sizes={sizes} priceStyle={priceStyle} product={product} />
        </div>
      </div>

      <style jsx>{`
        .dot-pill {
          border-radius: 9999px;
          padding: 0;
          width: 18px;
          height: 18px;
          background: #ececec;
        }
        :root[data-theme='night'] .dot-pill {
          background: #111;
        }
        .dot-pill.is-active {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </>
  )
}
