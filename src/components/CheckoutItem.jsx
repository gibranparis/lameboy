'use client'

import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'

export default function CheckoutItem({ item, night }) {
  const { updateQty, remove } = useCart()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr auto',
        gap: 16,
        padding: 16,
        background: night ? 'rgba(255,255,255,0.04)' : '#fff',
        borderRadius: 12,
        border: `1px solid ${night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5' }}>
        {item.image && (
          <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
        )}
      </div>

      {/* Details */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: night ? '#fff' : '#0f1115', marginBottom: 4 }}>
          {item.name}
        </h3>
        <p style={{ fontSize: 14, color: night ? '#999' : '#666', marginBottom: 8 }}>
          Size: {item.size}
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: night ? '#fff' : '#0f1115' }}>
          ${(item.price / 100).toFixed(2)}
        </p>
      </div>

      {/* Quantity + Remove */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => updateQty(item.id, item.size, item.qty - 1)}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: night ? '#fff' : '#0f1115',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <span style={{ fontSize: 14, minWidth: 20, textAlign: 'center', color: night ? '#fff' : '#0f1115' }}>
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.id, item.size, item.qty + 1)}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: night ? '#fff' : '#0f1115',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
        <button
          onClick={() => remove(item.id, item.size)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            color: night ? '#999' : '#666',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
