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
 * on it (styled like the product page's). Picking one hops it into the bag:
 * a little anticipation lift, a gravity drop, then the bag catches it with a
 * squash, a ripple and a haptic tap. One-size products skip the pills.
 */
export default function QuickAddSizes() {
  /** @type {[null | { product: any, sizes: string[], cx: number, cy: number, left: number, bottom: number }, Function]} */
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
        // Nothing to choose: straight in
        haptic([8, 300, 16])
        add(product, sizes[0])
        setTimeout(landCartFlight, 220)
        return
      }
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const rowW = sizes.length * PILL + (sizes.length - 1) * GAP
      const left = Math.max(EDGE, Math.min(window.innerWidth - EDGE - rowW, cx - rowW / 2))
      setPicked(null)
      setOpen({ product, sizes, cx, cy, left, bottom: window.innerHeight - r.top + 12 })
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
    const dx = open.cx - (r.left + r.width / 2)
    const dy = open.cy - (r.top + r.height / 2)
    const land = () => {
      landCartFlight()
      close()
    }
    if (typeof btn.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      land()
      return
    }
    // Anticipation, then a ballistic drop: x steady, y accelerating, shrinking
    // into the bag's mouth and gone just as it lands
    const frames = [{ transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 }]
    frames.push({ transform: 'translate(0, -7px) scale(1.14)', opacity: 1, offset: 0.22 })
    const N = 10
    for (let i = 1; i <= N; i++) {
      const t = i / N
      const y = -7 + (dy + 7) * t * t
      frames.push({
        transform: `translate(${dx * t}px, ${y}px) scale(${1.14 - 0.84 * t})`,
        opacity: t < 0.85 ? 1 : (1 - t) / 0.15,
        offset: 0.22 + 0.78 * t,
      })
    }
    btn.animate(frames, { duration: 400, easing: 'linear', fill: 'forwards' }).finished.then(land, land)
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
