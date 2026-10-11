// src/lib/freeShipping.js
// Free shipping, shared by the tokens meter (client) and the rate / checkout
// routes (server). A cart that reaches the threshold for where it ships gets
// the cheapest rate free, and a faster one costs only the difference.
// The server always re-derives this from Supabase prices and Shippo rates;
// the client only uses it to show progress.

export const FREE_SHIP_DOMESTIC_CENTS = 8000
export const FREE_SHIP_INTL_CENTS = 12000
// The meter counts tokens, never dollars: a token is 8¢ of merchandise
// (12.5 per $1), so free US shipping takes 1,000 tokens and abroad 1,500
export const CENTS_PER_TOKEN = 8

/** Cents a cart needs for free shipping to `country` (US until we know). */
export function freeShipThreshold(country) {
  return !country || country === 'US' ? FREE_SHIP_DOMESTIC_CENTS : FREE_SHIP_INTL_CENTS
}

export function qualifiesForFreeShipping(subtotalCents, country) {
  return subtotalCents >= freeShipThreshold(country)
}

/** Tokens the cart holds, and the goal that unlocks free shipping to `country`. */
export function freeShipTokens(subtotalCents, country) {
  return {
    tokens: Math.floor(Math.max(0, subtotalCents) / CENTS_PER_TOKEN),
    goal: freeShipThreshold(country) / CENTS_PER_TOKEN,
  }
}

/**
 * Rates as charged for this cart: once it qualifies, each one drops by the
 * cheapest rate's price (so the cheapest is free). `fullPrice` keeps the
 * carrier's price.
 * @template {{ price: number }} R
 * @param {R[]} rates
 * @param {number} subtotalCents
 * @param {string} country
 * @returns {(R & { fullPrice: number })[]}
 */
export function applyFreeShipping(rates, subtotalCents, country) {
  const cheapest = rates.length ? Math.min(...rates.map((r) => r.price)) : 0
  const off = qualifiesForFreeShipping(subtotalCents, country) ? cheapest : 0
  return rates.map((r) => ({ ...r, fullPrice: r.price, price: Math.max(0, r.price - off) }))
}
