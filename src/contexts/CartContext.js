// src/contexts/CartContext.js
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartCtx = createContext(null)
const STORAGE_KEY = 'lb:cart'

function loadStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [bumpKey, setBumpKey] = useState(0)
  const [cartReady, setCartReady] = useState(false)

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items])

  // Load persisted cart once on mount
  useEffect(() => {
    setItems(loadStoredItems())
    setCartReady(true)
  }, [])

  // Persist on every change, once the initial load has happened
  useEffect(() => {
    if (!cartReady) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, cartReady])

  const add = (product, size, qty = 1) => {
    const variant = product.variants?.find((v) => v.size === size)
    const variantId = variant?.id ?? null
    const price = variant?.price ?? product.price ?? 0

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          variantId,
          name: product.name ?? product.title,
          price,
          size,
          qty,
          image: product.images?.[0]?.src ?? product.images?.[0] ?? product.image,
        },
      ]
    })
    setBumpKey((k) => k + 1)
    try { window.dispatchEvent(new CustomEvent('cart:bump')) } catch {}
  }

  const remove = (id, size) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)))
  }

  const updateQty = (id, size, qty) => {
    if (qty <= 0) return remove(id, size)
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.size === size ? { ...i, qty } : i))
    )
  }

  const reset = () => {
    setItems([])
    setBumpKey((k) => k + 1)
  }

  const goToCheckout = () => {
    window.location.href = '/checkout'
  }

  useEffect(() => {
    const onAddEvent = (e) => {
      const { product, size, qty } = e?.detail || {}
      if (product) add(product, size, qty || 1)
    }
    window.addEventListener('lb:add-to-cart', onAddEvent)
    return () => window.removeEventListener('lb:add-to-cart', onAddEvent)
  }, [])

  const value = useMemo(
    () => ({ items, count, total, add, remove, updateQty, reset, bumpKey, goToCheckout, cartReady }),
    [items, count, total, bumpKey, cartReady]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
