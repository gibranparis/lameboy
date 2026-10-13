// src/components/CartButton.jsx
// @ts-check
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { CART_LANDED, cartFlying } from '@/lib/cartFlight'
import { getProfile } from '@/lib/profile'
import { freeShipTokens } from '@/lib/freeShipping'
import TokensMeter from '@/components/TokensMeter'
import { CART_BAGS, CART_BAG_START } from '@/lib/cartBags'

const METER_MS = 3000 // how long the tokens pop-up stays after an add

/**
 * CartButton
 * The badge shows the cart's real item count (sum of quantities) from
 * CartContext, and pulses whenever that count goes up. An item jumping in
 * (product page, quick add) only ticks the number up as it lands in the bag.
 * Each add also pops the tokens meter up over the bag for a moment, filling
 * from where the cart was toward free shipping.
 */
export default function CartButton({ size = 48, inHeader = false, imgSrc, onClick }) {
  const { count, total, cartReady } = useCart()
  const [pulse, setPulse] = useState(false)
  const [bumpCls, setBumpCls] = useState('')
  const [isNight, setIsNight] = useState(false)

  useEffect(() => {
    const onTheme = (e) => setIsNight(e?.detail?.theme === 'night')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    setIsNight(document.documentElement.dataset.theme === 'night')
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  // If imgSrc is provided, use that exact image.
  // Otherwise, build a candidate list starting from this load's random bag
  // (lib/cartBags), the rest as fallbacks.
  const candidates = useMemo(() => {
    if (imgSrc) return [imgSrc]

    const ordered = []
    for (let i = 0; i < CART_BAGS.length; i++) {
      ordered.push(CART_BAGS[(CART_BAG_START + i) % CART_BAGS.length])
    }
    return ordered
  }, [imgSrc])

  // Prefer the first candidate (random Birkin) and fall back to SVG if everything fails.
  const [resolvedSrc, setResolvedSrc] = useState(() => candidates[0] || fallbackSvg(size))
  const fallbackIdx = useRef(0)

  useEffect(() => {
    fallbackIdx.current = 0
    setResolvedSrc(candidates[0] || fallbackSvg(size))
  }, [candidates, size])

  const btnRef = useRef(/** @type {HTMLButtonElement|null} */ (null))

  // The tokens pop-up: the cart total it last showed (it fills from there),
  // and where it sits (above the bag, or below when the bag's near the top)
  const totalRef = useRef(total)
  totalRef.current = total
  const meterFrom = useRef(total)
  const [meter, setMeter] = useState(/** @type {null | { key: number, from: number, tokens: number, goal: number, pos: Record<string, number>, out: boolean }} */ (null))
  const tMeter = useRef(/** @type {ReturnType<typeof setTimeout>[]} */ ([]))
  const showMeter = () => {
    const now = totalRef.current
    const from = meterFrom.current
    meterFrom.current = now
    const btn = btnRef.current
    // The cart panel has its own meter
    if (!btn || now <= from || document.documentElement.hasAttribute('data-checkout-open')) return
    const country = getProfile()?.country || 'US'
    const r = btn.getBoundingClientRect()
    const w = 180 // matches .cart-meter width
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w))
    const pos = r.top > 110 ? { left, bottom: window.innerHeight - r.top + 8 } : { left, top: r.bottom + 8 }
    tMeter.current.forEach(clearTimeout)
    setMeter({ key: Date.now(), from: freeShipTokens(from, country).tokens, ...freeShipTokens(now, country), pos, out: false })
    tMeter.current = [
      setTimeout(() => setMeter((m) => m && { ...m, out: true }), METER_MS),
      setTimeout(() => setMeter(null), METER_MS + 320),
    ]
  }
  const tPulse = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  const tBump = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  // 'lb-catch' is the bigger squash-and-bounce for an item landing in the bag
  // (in state: React rewrites className on every render)
  const bump = (cls = 'lb-bump', ms = 240) => {
    setPulse(true)
    setBumpCls(cls)
    if (tBump.current) clearTimeout(tBump.current)
    tBump.current = setTimeout(() => setBumpCls(''), ms)
    if (tPulse.current) clearTimeout(tPulse.current)
    tPulse.current = setTimeout(() => setPulse(false), 360)
  }

  // The number on the badge: the real count, except while an added item is
  // still in the air, when it holds the old number until the item lands
  const [shown, setShown] = useState(count)
  const countRef = useRef(count)
  countRef.current = count

  // Pulse when items are added — not when the saved cart loads in. An item
  // jumping in bumps it (and ticks the number) as it lands instead.
  const prevCount = useRef(count)
  const wasReady = useRef(false)
  useEffect(() => {
    const grew = count > prevCount.current
    const live = wasReady.current // the saved cart arrives in the same render cartReady flips
    prevCount.current = count
    wasReady.current = cartReady
    if (live && grew && cartFlying()) return // held until CART_LANDED
    setShown(count)
    if (live && grew) {
      bump()
      showMeter()
    } else {
      meterFrom.current = totalRef.current // loaded or removed: nothing to show
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, cartReady])

  useEffect(() => {
    const onLanded = () => {
      setShown(countRef.current)
      bump('lb-catch', 760) // long enough for the ripples
      showMeter()
    }
    window.addEventListener(CART_LANDED, onLanded)
    return () => window.removeEventListener(CART_LANDED, onLanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    if (tPulse.current) clearTimeout(tPulse.current)
    if (tBump.current) clearTimeout(tBump.current)
    tMeter.current.forEach(clearTimeout)
  }, [])

  const aria = useMemo(
    () => (shown ? `Cart, ${shown} item${shown === 1 ? '' : 's'}` : 'Cart'),
    [shown]
  )

  const iconSize = Math.round(size * 0.86)

  const S = {
    btn: {
      position: 'relative',
      display: 'inline-grid',
      placeItems: 'center',
      width: size,
      height: size,
      borderRadius: 9999,
      padding: 0,
      border: 0,
      background: inHeader ? 'transparent' : 'rgba(255,255,255,.06)',
      cursor: 'pointer',
      lineHeight: 0,
      outline: 'none',
      boxShadow: inHeader ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.08)',
      transition: 'transform 120ms ease',
      zIndex: 2,
    },
    imgWrap: {
      width: iconSize,
      height: iconSize,
      display: 'grid',
      placeItems: 'center',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: 'block',
      userSelect: 'none',
      pointerEvents: 'none',
      filter: isNight ? 'brightness(0) invert(1)' : 'none',
    },
    badge: {
      position: 'absolute',
      right: -4,
      top: -4,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'linear-gradient(180deg,#34d399,#22c55e)',
      color: '#fff',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: 1,
      display: 'grid',
      placeItems: 'center',
      border: 'none',
      boxShadow: '0 2px 10px rgba(0,0,0,.45)',
      transform: pulse ? 'scale(1.06)' : 'scale(1)',
      transition: 'transform 160ms ease',
      pointerEvents: 'none',
      willChange: 'transform',
      contain: 'layout style paint',
    },
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cart-fab ${pulse ? 'cart-pulse' : ''} ${bumpCls}`}
        aria-label={aria}
        title="Cart"
        data-cart-button
        onClick={onClick}
        style={S.btn}
      >
        <span style={S.imgWrap}>
          <Image
            src={resolvedSrc}
            alt=""
            width={iconSize}
            height={iconSize}
            style={S.img}
            priority={inHeader}
            onError={() => {
              const next = candidates[++fallbackIdx.current] || fallbackSvg(size)
              setResolvedSrc(next)
            }}
          />
        </span>
        {/* Ripples out of the bag as an item lands in it */}
        {bumpCls === 'lb-catch' && (
          <>
            <span className="cart-ripple" aria-hidden />
            <span className="cart-ripple cart-ripple--late" aria-hidden />
          </>
        )}
        {shown > 0 && (
          <span aria-hidden="true" style={S.badge}>
            {shown}
          </span>
        )}
      </button>

      {meter && createPortal(
        <div
          key={meter.key}
          className={`cart-meter ${meter.out ? 'cart-meter--out' : ''}`}
          aria-hidden="true"
          style={{
            ...meter.pos,
            background: isNight ? 'rgba(18,18,18,0.7)' : 'rgba(250,250,248,0.75)',
            border: `1px solid ${isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <TokensMeter from={meter.from} tokens={meter.tokens} goal={meter.goal} showGain subtle />
        </div>,
        document.body
      )}

      <style jsx>{`
        .cart-meter {
          position: fixed;
          width: 180px;
          box-sizing: border-box;
          padding: 8px 10px 0;
          border-radius: 12px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
          z-index: 2147483000;
          pointer-events: none;
          transform-origin: bottom right;
          animation: cartMeterIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .cart-meter--out {
          animation: cartMeterOut 300ms ease both;
        }
        @keyframes cartMeterIn {
          from { opacity: 0; transform: scale(0.85) translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes cartMeterOut {
          from { opacity: 1; transform: none; }
          to { opacity: 0; transform: scale(0.9) translateY(6px); }
        }
        button:hover {
          transform: scale(1.05);
        }
        .cart-pulse {
          animation: cartPulse 0.42s ease;
        }
        @keyframes cartPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(11, 240, 95, 0.55);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(11, 240, 95, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(11, 240, 95, 0);
          }
        }
        .lb-bump {
          animation: lbBump 240ms ease;
        }
        /* A product tile dragged over the bag: it opens up to take it */
        :global(html[data-cart-drop-hover]) .cart-fab {
          transform: scale(1.22) rotate(-6deg);
          transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 0 8px rgba(11, 240, 95, 0.75));
        }
        .cart-ripple {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          margin: -50% 0 0 -50%;
          border-radius: 50%;
          border: 2px solid rgba(11, 240, 95, 0.7);
          pointer-events: none;
          animation: cartRipple 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .cart-ripple--late {
          animation-delay: 110ms;
        }
        @keyframes cartRipple {
          from {
            transform: scale(0.6);
            opacity: 0.9;
          }
          to {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        .lb-catch {
          animation: lbCatch 460ms cubic-bezier(0.3, 1.4, 0.5, 1);
        }
        @keyframes lbCatch {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.22, 0.82);
          }
          55% {
            transform: scale(0.92, 1.12);
          }
          80% {
            transform: scale(1.04, 0.97);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes lbBump {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )
}

function fallbackSvg(size) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#60a5fa"/></linearGradient></defs>
      <rect width="64" height="64" rx="14" ry="14" fill="#0f1115"/>
      <path d="M18 26h28l-3 20H21l-3-20z" fill="url(#g)"/>
      <circle cx="26" cy="49" r="2.8" fill="#fff"/><circle cx="38" cy="49" r="2.8" fill="#fff"/>
      <path d="M24 26v-3a8 8 0 0 1 16 0v3" stroke="#a7f3d0" stroke-width="2.5" fill="none"/>
    </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
