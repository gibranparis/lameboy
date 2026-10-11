// src/lib/cartFlight.js
'use client'

// While an added item jumps into the cart button, the button holds its bump
// until the item lands (the cart count itself updates straight away).

const ATTR = 'data-cart-flying'
export const CART_LANDED = 'lb:cart-landed'
// Lands anyway if the flight never finishes (e.g. the overlay closed another way)
const SAFETY_MS = 2500

let safety = /** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined)

export const cartFlying = () => document.documentElement.hasAttribute(ATTR)

export function startCartFlight() {
  document.documentElement.setAttribute(ATTR, '1')
  clearTimeout(safety)
  safety = setTimeout(landCartFlight, SAFETY_MS)
}

export function landCartFlight() {
  clearTimeout(safety)
  if (!cartFlying()) return
  document.documentElement.removeAttribute(ATTR)
  try { window.dispatchEvent(new Event(CART_LANDED)) } catch {}
}
