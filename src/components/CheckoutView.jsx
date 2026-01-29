'use client'

import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { animateFlipEnter } from '@/lib/flip'
import CheckoutItem from './CheckoutItem'

export default function CheckoutView() {
  const { items, total, count } = useCart()
  const router = useRouter()
  const [closing, setClosing] = useState(false)
  const [night, setNight] = useState(false)
  const containerRef = useRef(null)

  // FLIP animation on mount from cart button
  useEffect(() => {
    const fromRectStr = sessionStorage.getItem('cart-btn-rect')
    if (!fromRectStr || !containerRef.current) return

    const fromRect = JSON.parse(fromRectStr)
    sessionStorage.removeItem('cart-btn-rect')

    animateFlipEnter(containerRef.current, fromRect, { duration: 220 })
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
    setClosing(true)
    setTimeout(() => router.push('/'), 200)
  }

  return (
    <div
      ref={containerRef}
      className="checkout-overlay"
      data-closing={closing ? 'true' : undefined}
      data-theme={night ? 'night' : 'day'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 420,
        background: night ? '#0f1115' : '#fafaf8',
        overflowY: 'auto',
        opacity: closing ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '60px 20px 40px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: night ? '#fff' : '#0f1115' }}>
            Cart ({count})
          </h1>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              color: night ? '#fff' : '#0f1115',
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            Continue Shopping
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: night ? '#999' : '#666' }}>
            <p style={{ fontSize: 16, marginBottom: 20 }}>Your cart is empty</p>
            <button
              onClick={handleClose}
              style={{
                background: night ? '#fff' : '#0f1115',
                color: night ? '#0f1115' : '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 24,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Start Shopping
            </button>
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
  )
}
