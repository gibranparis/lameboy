// src/contexts/CartContext.js
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartCtx = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // Array of {id, name, price, size, qty, image}
  const [bumpKey, setBumpKey] = useState(0)

  const count = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0)
  }, [items])

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [items])

  const add = (product, size, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.size === size)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, qty: item.qty + qty }
            : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name || product.title,
          price: product.price,
          size,
          qty,
          image: product.images?.[0]?.src || product.images?.[0] || product.image,
        },
      ]
    })
    setBumpKey((k) => k + 1)
    try {
      window.dispatchEvent(new CustomEvent('cart:bump'))
    } catch {}
  }

  const remove = (id, size) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)))
  }

  const updateQty = (id, size, qty) => {
    if (qty <= 0) return remove(id, size)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size ? { ...item, qty } : item
      )
    )
  }

  const reset = () => {
    setItems([])
    setBumpKey((k) => k + 1)
  }

  // Listen for lb:add-to-cart events from ProductOverlay
  useEffect(() => {
    const onAddEvent = (e) => {
      const { product, size, qty } = e?.detail || {}
      if (product) add(product, size, qty || 1)
    }
    window.addEventListener('lb:add-to-cart', onAddEvent)
    return () => window.removeEventListener('lb:add-to-cart', onAddEvent)
  }, [])

  const value = useMemo(
    () => ({ items, count, total, add, remove, updateQty, reset, bumpKey }),
    [items, count, total, bumpKey]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
