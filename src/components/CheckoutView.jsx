'use client'

import { useCart } from '@/contexts/CartContext'
import { useState, useEffect, useRef } from 'react'
import CheckoutItem from './CheckoutItem'


export default function CheckoutView({ onClose }) {
  const { items, total, count } = useCart()
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const [night, setNight] = useState(false)
  const panelRef = useRef(null)

  // Trigger slide-in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      if (typeof document !== 'undefined') {
        const isNight = document.documentElement.dataset.theme === 'night' ||
                       document.documentElement.classList.contains('dark')
        setNight(isNight)
      }
    }
    checkTheme()

    const onTheme = (e) => {
      const t = e?.detail?.theme
      if (t === 'night') setNight(true)
      else if (t === 'day') setNight(false)
      else checkTheme()
    }
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  const handleClose = () => {
    if (closing) return
    setClosing(true)
    setTimeout(() => onClose?.(), 340)
  }

  // Listen for external close requests (e.g. cart button toggle)
  useEffect(() => {
    const onRequestClose = () => handleClose()
    window.addEventListener('checkout:request-close', onRequestClose)
    return () => window.removeEventListener('checkout:request-close', onRequestClose)
  })

  const slideOpen = entered && !closing

  return (
    <div
      className="checkout-overlay"
      data-theme={night ? 'night' : 'day'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700,
        pointerEvents: slideOpen ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          opacity: slideOpen ? 1 : 0,
          transition: 'opacity 250ms ease',
        }}
      />

      {/* Panel — reveals from purse (bottom-right corner) */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          top: 'unset',
          left: 'unset',
          maxHeight: 'calc(100% - 60px)',
          width: '100%',
          maxWidth: 460,
          background: night ? '#0f1115' : '#fafaf8',
          overflowY: 'auto',
          transform: slideOpen ? 'scale(1)' : 'scale(0)',
          transformOrigin: 'bottom right',
          opacity: slideOpen ? 1 : 0,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
          borderRadius: '18px 18px 0 0',
          paddingBottom: 'calc(var(--header-ctrl, 64px) + var(--safe-bottom, 0px))',
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            background: night ? '#0f1115' : '#fafaf8',
            padding: '20px 24px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Lameboy signature — top left */}
          <div
            style={{
              fontSize: 32,
              fontFamily: "'Jalliya', var(--mono)",
              color: night ? '#fff' : '#0f1115',
              pointerEvents: 'none',
              userSelect: 'none',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            Lameboy
          </div>
          {/* X close button — top right */}
          <button
            type="button"
            aria-label="Close cart"
            onClick={handleClose}
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              borderRadius: '50%',
              color: night ? '#fff' : '#0f1115',
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 24px 40px' }}>
          {/* Total + Checkout button at top */}
          {items.length > 0 && (
            <div
              style={{
                marginBottom: 24,
                padding: '16px 0',
                borderBottom: `1px solid ${night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: night ? '#fff' : '#0f1115' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: night ? '#fff' : '#0f1115' }}>
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
              <button
                style={{
                  width: '100%',
                  background: 'var(--hover-green, #0bf05f)',
                  color: '#000',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: 28,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                }}
                onClick={() => alert('Checkout flow to be integrated with Swell')}
              >
                Checkout
              </button>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: night ? '#999' : '#666' }}>
              <p style={{ fontSize: 16 }}>Your cart is empty</p>
            </div>
          )}

          {/* Items */}
          <div style={{ display: 'grid', gap: 16 }}>
            {items.map((item, i) => (
              <CheckoutItem key={`${item.id}-${item.size}-${i}`} item={item} night={night} />
            ))}
          </div>
        </div>

        {/* Item count — bottom left, same level as purse button */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 'calc(var(--header-ctrl, 64px) + var(--safe-bottom, 0px))',
            display: 'grid',
            placeItems: 'center',
            paddingLeft: 24,
            paddingBottom: 'var(--safe-bottom, 0px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: night ? '#fff' : '#0f1115',
              userSelect: 'none',
            }}
          >
            {`(${count})`}
          </span>
        </div>
      </div>
    </div>
  )
}
