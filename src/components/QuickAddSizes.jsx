// src/components/QuickAddSizes.jsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'
import { startCartFlight, landCartFlight } from '@/lib/cartFlight'

/** window event: { detail: { product } } — a product tile was dropped on the cart */
export const QUICK_ADD = 'lb:quick-add'

const DEFAULT_SIZES = ['OS', 'S', 'M', 'L', 'XL'] // same fallback as the product page
const PILL = 28
const GAP = 8
const EDGE = 16

/**
 * Size pills that pop out of the cart button when a product tile is dropped
 * on it (styled like the product page's). Picking one flashes it green and
 * the hoodie jumps into the bag from wherever it is on the page; the bag
 * catches it with a squash, a ripple and a haptic tap. One-size products skip
 * the pills and jump straight in.
 */
const HOODIE = 58 // px, the little hoodie that pops out where there's no hoodie to jump from
const IN_BAG = 18 // px, how small it is as it drops into the bag's mouth

/**
 * The hoodie jumps from where it is into the bag at `to`, like the product
 * page's add to cart: a crouch, then steady sideways, up then down like a
 * ball tossed into a basket, a little spin, shrinking into the bag's mouth
 * and gone as it lands. `from` is the hoodie's own picture on the page (it
 * jumps from right there, at its size); `popIn`: no hoodie to jump from, so a
 * little one pops up there first (e.g. out of the size pill).
 * @param {string} src
 * @param {{ x: number, y: number, w: number, h: number, popIn?: boolean }} from centre and size
 * @param {{ x: number, y: number }} to
 * @returns {Promise<void>} resolves when it lands
 */
function hopIntoBag(src, from, to, delay = 0) {
  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  img.setAttribute('aria-hidden', 'true')
  img.draggable = false
  img.style.cssText = `position:fixed;left:${from.x - from.w / 2}px;top:${from.y - from.h / 2}px;width:${from.w}px;height:${from.h}px;object-fit:contain;pointer-events:none;z-index:2147483003;transform-origin:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.18))${from.popIn ? ';opacity:0' : ''}`
  document.body.appendChild(img)
  const dx = to.x - from.x
  const dy = to.y - from.y
  // y(t) = dy·t − a·t(1−t) peaks `hop` px above the start whatever dy is
  const hop = Math.max(70, Math.min(140, from.h * 0.6))
  const a = dy + 2 * hop + 2 * Math.sqrt(Math.max(0, hop * hop + hop * dy))
  const end = IN_BAG / Math.max(from.w, from.h)
  const N = 28
  const frames = []
  let k0 = 1
  if (from.popIn) {
    // Pops up out of the pill first
    frames.push({ transform: 'translate(0, 0) scale(0.3)', opacity: 0, offset: 0 })
    frames.push({ transform: 'translate(0, 0) scale(1.08)', opacity: 1, offset: 0.16 })
    k0 = 1.08
  } else {
    // A little crouch before it jumps
    frames.push({ transform: 'translate(0, 0) scale(1, 1)', opacity: 1, offset: 0 })
    frames.push({ transform: 'translate(0, 3px) scale(1.05, 0.9)', opacity: 1, offset: 0.12 })
  }
  const start = from.popIn ? 0.22 : 0.16
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = dx * t
    const y = dy * t - a * t * (1 - t)
    const k = k0 + (end - k0) * t * t
    const rot = 14 * Math.sin(Math.PI * t) * Math.sign(dx || 1)
    frames.push({
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${k.toFixed(4)})`,
      opacity: t < 0.9 ? 1 : (1 - t) / 0.1,
      offset: start + (1 - start) * t,
    })
  }
  const anim = img.animate(frames, { duration: 760, delay, easing: 'linear', fill: 'forwards' })
  return anim.finished.then(
    () => img.remove(),
    () => img.remove()
  )
}

/** The dropped hoodie's picture where it is right now (null if it's gone or hidden) */
function hoodieOf(/** @type {Element | null | undefined} */ tile) {
  if (!tile?.isConnected) return null
  const img = /** @type {HTMLImageElement | null} */ (tile.querySelector('.product-img-wrap img, img'))
  const r = (img || tile).getBoundingClientRect()
  if (r.width < 4 || r.height < 4) return null
  return { src: img?.currentSrc || img?.src || '', x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
}

export default function QuickAddSizes() {
  /** @type {[null | { product: any, tile: Element | null, sizes: string[], cx: number, cy: number, left: number, bottom: number }, Function]} */
  const [open, setOpen] = useState(null)
  const [picked, setPicked] = useState(/** @type {string|null} */ (null))
  const boxRef = useRef(/** @type {HTMLDivElement|null} */ (null))

  const close = useCallback(() => {
    setOpen(null)
    setPicked(null)
  }, [])

  const add = useCallback((/** @type {any} */ product, /** @type {string} */ size) => {
    startCartFlight() // the bag bumps when the pill lands, not now
    try {
      window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { product, size, qty: 1 } }))
    } catch {}
  }, [])

  useEffect(() => {
    const onQuickAdd = (/** @type {any} */ e) => {
      const product = e?.detail?.product
      const r = document.querySelector('[data-cart-button]')?.getBoundingClientRect()
      if (!product || !r) return
      const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES
      if (sizes.length === 1) {
        // Nothing to choose: the little hoodie hops straight in from just above the bag
        haptic([8, 300, 16])
        add(product, sizes[0])
        const cx = r.left + r.width / 2
        const to = { x: cx, y: r.top + r.height / 2 }
        // It jumps from the hoodie itself, wherever it is now
        const own = hoodieOf(e?.detail?.tile)
        const src = own?.src || product.thumb || product.image
        if (src && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
          const from = own || { x: cx, y: r.top - 40, w: HOODIE, h: HOODIE, popIn: true }
          hopIntoBag(src, from, to).then(landCartFlight, landCartFlight)
        } else setTimeout(landCartFlight, 220)
        return
      }
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const rowW = sizes.length * PILL + (sizes.length - 1) * GAP
      const left = Math.max(EDGE, Math.min(window.innerWidth - EDGE - rowW, cx - rowW / 2))
      setPicked(null)
      setOpen({ product, tile: e?.detail?.tile || null, sizes, cx, cy, left, bottom: window.innerHeight - r.top + 12 })
    }
    window.addEventListener(QUICK_ADD, onQuickAdd)
    return () => window.removeEventListener(QUICK_ADD, onQuickAdd)
  }, [add])

  // Tap elsewhere or Escape dismisses
  useEffect(() => {
    if (!open || picked) return
    const onDown = (/** @type {PointerEvent} */ e) => {
      if (!boxRef.current?.contains(/** @type {Node} */ (e.target))) close()
    }
    const onKey = (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Escape') close() }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, picked, close])

  const pick = (/** @type {string} */ size, /** @type {HTMLButtonElement} */ btn) => {
    if (!open || picked) return
    setPicked(size)
    // A tick under the finger now; Android also gets a softer thud as it lands
    haptic([8, 330, 16])
    add(open.product, size)

    const r = btn.getBoundingClientRect()
    const land = () => {
      landCartFlight()
      close()
    }
    // It jumps from the hoodie itself, wherever it is now (else from the pill)
    const own = hoodieOf(open.tile)
    const src = own?.src || open.product.thumb || open.product.image
    if (!src || typeof btn.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      land()
      return
    }
    // The picked pill flashes green and pops away; a little copy of the
    // hoodie takes its place and hops into the bag
    btn.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }],
      { duration: 260, delay: 90, easing: 'ease-in', fill: 'forwards' }
    )
    const from = own || { x: r.left + r.width / 2, y: r.top + r.height / 2, w: HOODIE, h: HOODIE, popIn: true }
    hopIntoBag(src, from, { x: open.cx, y: open.cy }, own ? 60 : 150).then(land, land)
  }

  if (!open) return null

  return (
    <div
      ref={boxRef}
      className="qa-row"
      role="group"
      aria-label={`Choose a size for ${open.product.title || 'this item'}`}
      style={{ left: open.left, bottom: open.bottom }}
    >
      {open.sizes.map((sz, i) => {
        // Each pill pops out of the bag's centre into its slot
        const slotX = open.left + i * (PILL + GAP) + PILL / 2
        const slotY = window.innerHeight - open.bottom - PILL / 2
        return (
          <button
            key={sz}
            type="button"
            className={['qa-pill', picked === sz ? 'is-picked' : '', picked && picked !== sz ? 'is-gone' : ''].join(' ')}
            aria-label={`Add size ${sz} to cart`}
            title={`Size ${sz}`}
            onClick={(e) => pick(sz, e.currentTarget)}
            style={/** @type {any} */ ({
              '--fx': `${open.cx - slotX}px`,
              '--fy': `${open.cy - slotY}px`,
              animationDelay: `${i * 32}ms`,
            })}
          >
            {sz}
          </button>
        )
      })}

      <style jsx>{`
        .qa-row {
          position: fixed;
          display: flex;
          gap: ${GAP}px;
          z-index: 2147483002; /* with the other pop-ups, above the dragged video */
        }
        .qa-pill {
          width: ${PILL}px;
          height: ${PILL}px;
          padding: 0;
          border: none;
          border-radius: 50%;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.02em;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: #fff;
          color: #0f1115;
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.14),
            inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          transition: background 0.12s ease, color 0.12s ease, transform 0.08s ease, opacity 0.16s ease;
          animation: qa-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        :global(:root[data-theme='night']) .qa-pill {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.14),
            inset 0 0 0 1px rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .qa-pill:hover,
        .qa-pill.is-picked {
          background: var(--hover-green, #0bf05f);
          color: #000;
          box-shadow:
            inset 0 0 0 1px rgba(0, 0, 0, 0.18),
            0 2px 10px rgba(0, 0, 0, 0.12);
        }
        .qa-pill:active {
          transform: scale(0.92);
        }
        .qa-pill.is-gone {
          opacity: 0;
          transform: scale(0.4);
          pointer-events: none;
        }
        @keyframes qa-pop {
          from {
            opacity: 0;
            transform: translate(var(--fx), var(--fy)) scale(0.2);
          }
          to {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .qa-pill {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
