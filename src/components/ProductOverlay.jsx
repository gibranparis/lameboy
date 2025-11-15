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
  // reflow
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth
  el.classList.add(klass)
  window.setTimeout(() => el.classList.remove(klass), ms)
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
    const onTheme = e => {
      const t = e?.detail?.theme
      if (t === 'night') setState({ night: true })
      else if (t === 'day') setState({ night: false })
      else setState(read())
    }
    // initialize once (covers SSR→CSR and any missed event)
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
function ArrowControl({ dir = 'up', night, onClick, dataUi }) {
  const baseBg = night ? '#000000' : '#ffffff'
  const ring = night ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.10)'
  const glyph = night ? '#ffffff' : '#0f1115'

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
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: baseBg,
          boxShadow: `0 2px 10px rgba(0,0,0,.12), inset 0 0 0 1px ${ring}`,
          transition: 'background .12s ease, box-shadow .12s ease, transform .08s ease',
        }}
      >
        {/* mask-capable glyph */}
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
        {/* fallback SVG */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          focusable="false"
          aria-hidden="true"
          style={{ position: 'absolute', opacity: 'var(--arrow-fallback,1)' }}
        >
          {dir === 'up' ? (
            <path
              d="M6 14l6-6 6 6"
              stroke={glyph}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M6 10l6 6 6-6"
              stroke={glyph}
              strokeWidth="2.5"
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
function PlusSizesInline({ sizes = ['OS', 'S', 'M', 'L', 'XL'], priceStyle }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const [hotSize, setHotSize] = useState(null)
  const [showAdded, setAdded] = useState(false)
  const [plusHot, setPlusHot] = useState(false)
  const plusRef = useRef(null)
  const timers = useRef({})

  const onToggle = () => {
    if (showAdded) return
    setOpen(v => !v)
    setPlusHot(true)
    clearTimeout(timers.current.plusTick)
    timers.current.plusTick = setTimeout(() => setPlusHot(false), 160)
  }

  const pick = sz => {
    setPicked(sz)
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size: sz, count: 1 } }))
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
  }

  useEffect(() => () => Object.values(timers.current).forEach(t => clearTimeout(t)), [])

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
      {/* +/- pill */}
      <button
        ref={plusRef}
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
      >
        <span aria-hidden style={{ opacity: showAdded ? 0 : 1 }}>
          {glyph}
        </span>
      </button>

      {/* “Added” label */}
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

      {/* Sizes row */}
      <div
        className={`row-nowrap size-panel ${open ? 'is-open' : ''}`}
        data-ui="size-panel"
        hidden={!open}
        style={{ gap: 8 }}
      >
        {sizes.map(sz => (
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
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
          color: #0f1115;
          background: #fff;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08);
          transition: background 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease,
            color 0.12s ease;
        }
        :root[data-theme='night'] .plus-pill {
          color: #fff;
          background: #000;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .plus-pill.is-open,
        .plus-pill.is-hot {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.12);
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
          height: 36px;
          min-width: 44px;
          padding: 0 12px;
          border-radius: 9999px;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: #fff;
          color: #0f1115;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
          transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.12s ease,
            color 0.12s ease;
        }
        :root[data-theme='night'] .size-pill {
          background: #000;
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
        }
        .size-pill.is-selected {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
        }
        .size-pill.is-hot {
          transform: scale(1.06);
          box-shadow: 0 0 0 0 rgba(11, 240, 95, 0.42), inset 0 0 0 1px rgba(11, 240, 95, 0.55);
          animation: lbPulseShort 420ms ease;
        }
        @keyframes lbPulseShort {
          0% {
            box-shadow: 0 0 0 0 rgba(11, 240, 95, 0.42), inset 0 0 0 1px rgba(11, 240, 95, 0.55);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(11, 240, 95, 0), inset 0 0 0 1px rgba(11, 240, 95, 0.35);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(11, 240, 95, 0), inset 0 0 0 1px rgba(11, 240, 95, 0.2);
          }
        }

        .arrow-pill.is-hot > div {
          background: var(--hover-green, #0bf05f) !important;
          color: #000 !important;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.12) !important;
        }
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
    </div>
  )
}

/* ---------------- swipe engine ---------------- */
function useSwipe({ imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash }) {
  const state = useRef({ active: false, lastX: 0, lastY: 0, ax: 0, ay: 0, lastT: 0, vx: 0, vy: 0 })
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches

  const STEP_X = coarse ? 88 : 48
  const STEP_Y = coarse ? 110 : 64
  const FLICK_V_BONUS = coarse ? 0.22 : 0.35

  const onDown = useCallback(e => {
    const p = e.touches ? e.touches[0] : e
    state.current.active = true
    state.current.lastX = p.clientX
    state.current.lastY = p.clientY
    state.current.ax = 0
    state.current.ay = 0
    state.current.lastT = performance.now()
    state.current.vx = 0
    state.current.vy = 0
  }, [])

  const onMove = useCallback(
    e => {
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

      if (imgsLen) {
        while (state.current.ax <= -STEP_X) {
          state.current.ax += STEP_X
          setImgIdx(i => clamp(i + 1, 0, imgsLen - 1))
        }
        while (state.current.ax >= STEP_X) {
          state.current.ax -= STEP_X
          setImgIdx(i => clamp(i - 1, 0, imgsLen - 1))
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
    [imgsLen, prodsLen, index, setImgIdx, onIndexChange, onDirFlash]
  )

  const onUp = useCallback(() => {
    state.current.active = false
    state.current.ax = 0
    state.current.ay = 0
  }, [])

  return { onDown, onMove, onUp }
}

/* ---------------- component ---------------- */
export default function ProductOverlay({ products, index, onIndexChange, onClose }) {
  const night = useTheme()

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

  /* signal mount for grid guard */
  useEffect(() => {
    try {
      window.dispatchEvent(new Event('lb:overlay-open'))
    } catch {}
  }, [])

  /* close on orb zoom */
  useEffect(() => {
    const h = () => onClose?.()
    ;['lb:zoom', 'lb:zoom/grid-density'].forEach(n => {
      window.addEventListener(n, h)
      document.addEventListener(n, h)
    })
    return () => {
      ;['lb:zoom', 'lb:zoom/grid-density'].forEach(n => {
        window.removeEventListener(n, h)
        document.removeEventListener(n, h)
      })
    }
  }, [onClose])

  /* keyboard */
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') return onClose?.()
      if (imgs.length) {
        if (e.key === 'ArrowRight') return setImgIdx(i => clamp(i + 1, 0, imgs.length - 1))
        if (e.key === 'ArrowLeft') return setImgIdx(i => clamp(i - 1, 0, imgs.length - 1))
      }
      if (products.length > 1) {
        if (e.key === 'ArrowDown') {
          const el = document.querySelector('[data-ui="img-down"]')
          if (el) flash(el)
          return onIndexChange?.(wrap(index + 1, products.length))
        }
        if (e.key === 'ArrowUp') {
          const el = document.querySelector('[data-ui="img-up"]')
          if (el) flash(el)
          return onIndexChange?.(wrap(index - 1, products.length))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imgs.length, products.length, index, onIndexChange, onClose])

  /* wheel parity */
  const lastWheel = useRef(0)
  useEffect(() => {
    const onWheel = e => {
      const now = performance.now()
      if (now - lastWheel.current < 110) return
      lastWheel.current = now

      const ax = Math.abs(e.deltaX)
      const ay = Math.abs(e.deltaY)
      if (ax > ay && imgs.length) {
        setImgIdx(i => clamp(i + (e.deltaX > 0 ? 1 : -1), 0, imgs.length - 1))
      } else if (products.length > 1) {
        const dirDown = e.deltaY > 0
        flash(document.querySelector(dirDown ? '[data-ui="img-down"]' : '[data-ui="img-up"]'))
        onIndexChange?.(wrap(index + (dirDown ? 1 : -1), products.length))
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [imgs.length, products.length, index, onIndexChange])

  const onDirFlash = useCallback(dir => {
    flash(document.querySelector(dir === 'down' ? '[data-ui="img-down"]' : '[data-ui="img-up"]'))
  }, [])

  const swipe = useSwipe({
    imgsLen: imgs.length,
    prodsLen: products.length,
    index,
    setImgIdx,
    onIndexChange,
    onDirFlash,
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-open', '1')
    return () => document.documentElement.removeAttribute('data-overlay-open')
  }, [])

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
          pointerEvents: 'none', // overlay click-away works; hero handles interactions
          overscrollBehavior: 'contain',
          cursor: 'default',
        }}
      >
        {/* click-away */}
        <div
          onClick={e => {
            e.stopPropagation()
            onClose?.()
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
          className="product-hero"
          style={{ pointerEvents: 'auto', textAlign: 'center', zIndex: 521, touchAction: 'none' }}
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
                onClick={() => {
                  onIndexChange?.(wrap(index - 1, products.length))
                  onDirFlash('up')
                }}
              />
              <ArrowControl
                dir="down"
                night={night}
                dataUi="img-down"
                onClick={() => {
                  onIndexChange?.(wrap(index + 1, products.length))
                  onDirFlash('down')
                }}
              />
            </div>
          )}

          {/* image + dots */}
          {!!imgs.length && (
            <>
              <div data-ui="product-viewport" style={{ width: '100%' }}>
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

          {/* title/price/sizes */}
          <div className="product-hero-title">{product.title}</div>
          <div ref={priceRef} className="product-hero-price">
            {priceText}
          </div>
          <PlusSizesInline sizes={sizes} priceStyle={priceStyle} />
        </div>
      </div>

      {/* tiny helpers for arrow/dot states */}
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
