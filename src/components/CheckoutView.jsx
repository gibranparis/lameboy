'use client'

import { useCart } from '@/contexts/CartContext'
import { useState, useEffect, useRef } from 'react'
import CheckoutItem from './CheckoutItem'
import { COUNTRIES } from '@/lib/countries'

/**
 * Lightweight "estimate shipping" widget — just ZIP + country, no full
 * address. Calls the same /api/shipping/rates endpoint the real checkout
 * flow uses; Shippo can quote off a ZIP + country alone (less precisely
 * than a full address, but real carrier numbers, not a guess). Shows only
 * the cheapest rate, clearly labeled as an estimate. If the request fails
 * or returns nothing, falls back to static copy rather than showing a
 * number that might be wrong.
 */
function ShippingEstimate({ items, night }) {
  const [open, setOpen] = useState(false)
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('US')
  const [status, setStatus] = useState('idle') // idle | loading | done | unavailable
  const [cheapest, setCheapest] = useState(null)

  const textMuted = night ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'
  const textPrimary = night ? '#fff' : '#111'
  const border = night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  async function handleEstimate(e) {
    e.preventDefault()
    if (!zip.trim()) return
    setStatus('loading')
    setCheapest(null)
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: { zip: zip.trim(), country },
          items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.rates?.length) {
        setCheapest(data.rates[0].price)
        setStatus('done')
      } else {
        setStatus('unavailable')
      }
    } catch {
      setStatus('unavailable')
    }
  }

  const inputStyle = {
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 8px',
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: night ? 'rgba(255,255,255,0.06)' : '#fff',
    color: textPrimary,
    outline: 'none',
  }

  return (
    <div style={{ marginBottom: 10 }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: textMuted, textDecoration: 'underline',
          }}
        >
          Estimate shipping
        </button>
      ) : (
        <form onSubmit={handleEstimate} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setStatus('idle') }}
              style={{ ...inputStyle, flex: '0 0 84px' }}
            >
              {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{code}</option>)}
            </select>
            <input
              value={zip}
              onChange={(e) => { setZip(e.target.value); setStatus('idle') }}
              placeholder="ZIP / postal code"
              style={{ ...inputStyle, flex: 1, minWidth: 0 }}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !zip.trim()}
              style={{
                ...inputStyle, cursor: 'pointer', fontWeight: 700,
                background: 'var(--hover-green, #0bf05f)', color: '#000', border: 'none',
                opacity: status === 'loading' || !zip.trim() ? 0.6 : 1,
              }}
            >
              {status === 'loading' ? '...' : 'Go'}
            </button>
          </div>
          {status === 'done' && cheapest != null && (
            <span style={{ fontSize: 12, color: textMuted }}>
              Estimated shipping: <strong style={{ color: textPrimary }}>${(cheapest / 100).toFixed(2)}</strong> — finalized at checkout
            </span>
          )}
          {status === 'unavailable' && (
            <span style={{ fontSize: 12, color: textMuted }}>Shipping calculated at checkout</span>
          )}
        </form>
      )}
    </div>
  )
}

export default function CheckoutView({ onClose }) {
  const { items, total, count, goToCheckout } = useCart()
  const [visible, setVisible] = useState(false)
  const [night, setNight] = useState(false)
  const panelRef = useRef(null)
  const closingRef = useRef(false)

  // Stable close handler — ref-backed so listeners always call the fresh version
  const closeHandler = useRef(null)
  closeHandler.current = () => {
    if (closingRef.current) return
    closingRef.current = true
    setVisible(false)
    setTimeout(() => onClose?.(), 240)
  }

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [])

  // Theme
  useEffect(() => {
    const checkTheme = () => setNight(document.documentElement.dataset.theme === 'night')
    checkTheme()
    const onTheme = (e) => {
      if (e?.detail?.theme === 'night') setNight(true)
      else if (e?.detail?.theme === 'day') setNight(false)
      else checkTheme()
    }
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeHandler.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click outside
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest('[data-cart-button]')) return
      if (panelRef.current && !panelRef.current.contains(e.target)) closeHandler.current()
    }
    const t = setTimeout(() => window.addEventListener('pointerdown', onClick), 60)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [])

  // External close request (cart button toggle when already open)
  useEffect(() => {
    const onReq = () => closeHandler.current()
    window.addEventListener('checkout:request-close', onReq)
    return () => window.removeEventListener('checkout:request-close', onReq)
  }, [])

  const bg = night ? 'rgba(18,18,18,0.92)' : 'rgba(250,250,248,0.96)'
  const border = night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textPrimary = night ? '#fff' : '#111'
  const textMuted = night ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Your cart"
      style={{
        position: 'fixed',
        right: 'max(var(--header-pad-x, 16px), env(safe-area-inset-right))',
        bottom: 'calc(var(--safe-bottom, 0px) + var(--header-ctrl, 64px) + 8px)',
        width: 'min(300px, calc(100vw - 32px))',
        maxHeight: 'min(420px, calc(100dvh - var(--header-ctrl, 64px) * 2 - 32px))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: bg,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${border}`,
        borderRadius: 16,
        zIndex: 10008,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0)',
        transformOrigin: 'bottom right',
        transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 10px',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative', height: 44, pointerEvents: 'none', userSelect: 'none', transform: 'rotate(8deg)' }}>
          <img
            src="/rbw-text.png"
            alt="Lameboy"
            style={{ height: 44, width: 'auto', display: 'block', filter: night ? 'invert(1)' : 'none' }}
          />
          <img
            src="/rbw-strokes.png"
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, height: 44, width: 'auto' }}
          />
        </div>
        <button
          type="button"
          aria-label="Close cart"
          onClick={() => closeHandler.current()}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            color: textMuted,
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
        >
          &times;
        </button>
      </div>

      {/* Scrollable items */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, padding: '0 8px', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            fontSize: 14,
            color: night ? '#999' : '#666',
          }}>
            Your cart is empty
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, paddingBottom: 10 }}>
            {items.map((item, i) => (
              <CheckoutItem key={`${item.id}-${item.size}-${i}`} item={item} night={night} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${border}`,
          flexShrink: 0,
        }}>
          <ShippingEstimate items={items} night={night} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
              ${(total / 100).toFixed(2)}
            </span>
          </div>
          <button
            style={{
              width: '100%',
              background: 'var(--hover-green, #0bf05f)',
              color: '#000',
              border: 'none',
              padding: '11px 0',
              borderRadius: 24,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={goToCheckout}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
