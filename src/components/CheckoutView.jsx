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
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Side panel */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 460,
          background: night ? '#0f1115' : '#fafaf8',
          overflowY: 'auto',
          transform: slideOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ padding: '20px 24px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: night ? '#fff' : '#0f1115' }}>
              {`(${count})`}
            </h1>
          </div>

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

          {/* Total */}
          {items.length > 0 && (
            <div
              style={{
                marginTop: 40,
                padding: '24px 0',
                borderTop: `1px solid ${night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
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
        </div>
      </div>
    </div>
  )
}
