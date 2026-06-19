// src/contexts/CartContext.js
'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { swellCartAdd, swellCartGet, swellCartRemove, swellCartUpdate } from '@/lib/swell'

const CartCtx = createContext(null)

function normalizeSwellItem(item) {
  return {
    id: item.productId,
    swellItemId: item.id,
    name: item.product?.name ?? item.productName ?? '',
    price: Math.round((item.price ?? 0) * 100),
    size: item.options?.find((o) => o.name?.toLowerCase() === 'size')?.value ?? '',
    qty: item.quantity ?? 1,
    image: item.product?.images?.[0]?.file?.url ?? '',
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [bumpKey, setBumpKey] = useState(0)
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const syncingRef = useRef(false)

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items])

  const syncCart = async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      const cart = await swellCartGet()
      const swellItems = cart?.items ?? []
      setItems(swellItems.map(normalizeSwellItem))
      setCheckoutUrl(cart?.checkoutUrl ?? null)
    } catch (err) {
      console.error('Cart sync failed', err)
    } finally {
      syncingRef.current = false
    }
  }

  useEffect(() => { syncCart() }, [])

  const add = async (product, size, qty = 1) => {
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
          swellItemId: null,
          name: product.name ?? product.title,
          price: product.price,
          size,
          qty,
          image: product.images?.[0]?.src ?? product.images?.[0] ?? product.image,
        },
      ]
    })
    setBumpKey((k) => k + 1)
    try { window.dispatchEvent(new CustomEvent('cart:bump')) } catch {}

    try {
      const options = size ? { Size: size } : {}
      await swellCartAdd(product.swellId ?? product.id, { quantity: qty, variant: options })
      await syncCart()
    } catch (err) {
      console.error('Swell add failed', err)
    }
  }

  const remove = async (id, size) => {
    const item = items.find((i) => i.id === id && i.size === size)
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)))
    if (item?.swellItemId) {
      try {
        await swellCartRemove(item.swellItemId)
        await syncCart()
      } catch (err) {
        console.error('Swell remove failed', err)
      }
    }
  }

  const updateQty = async (id, size, qty) => {
    if (qty <= 0) return remove(id, size)
    const item = items.find((i) => i.id === id && i.size === size)
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.size === size ? { ...i, qty } : i))
    )
    if (item?.swellItemId) {
      try {
        await swellCartUpdate(item.swellItemId, qty)
        await syncCart()
      } catch (err) {
        console.error('Swell update failed', err)
      }
    }
  }

  const reset = () => {
    setItems([])
    setBumpKey((k) => k + 1)
  }

  const goToCheckout = async () => {
    try {
      const url = checkoutUrl ?? (await swellCartGet())?.checkoutUrl
      if (url) window.location.href = url
    } catch (err) {
      console.error('Checkout URL failed', err)
    }
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
    () => ({ items, count, total, add, remove, updateQty, reset, bumpKey, goToCheckout }),
    [items, count, total, bumpKey, checkoutUrl]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
