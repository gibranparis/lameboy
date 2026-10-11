// src/lib/freeShipping.js
// Free shipping, shared by the tokens meter (client) and the rate / checkout
// routes (server). A cart that reaches the threshold for where it ships gets
// the cheapest rate free, and a faster one costs only the difference.
// The server always re-derives this from Supabase prices and Shippo rates;
// the client only uses it to show progress.

export const FREE_SHIP_DOMESTIC_CENTS = 8000
export const FREE_SHIP_INTL_CENTS = 12000
// The meter counts tokens, never dollars: every $1 of merchandise is a token
// (so 80 tokens for free US shipping, 120 abroad)
const CENTS_PER_TOKEN = 100

/** Cents a cart needs for free shipping to `country` (US until we know). */
export function freeShipThreshold(country) {
  return !country || country === 'US' ? FREE_SHIP_DOMESTIC_CENTS : FREE_SHIP_INTL_CENTS
}

export function qualifiesForFreeShipping(subtotalCents, country) {
  return subtotalCents >= freeShipThreshold(country)
}

/** How full the tokens meter is, 0–100. */
export function freeShipPercent(subtotalCents, country) {
  return Math.min(100, (Math.max(0, subtotalCents) / freeShipThreshold(country)) * 100)
}

/** Tokens in the cart out of the tokens free shipping takes, e.g. "50 / 80". */
export function freeShipTally(subtotalCents, country) {
  const need = freeShipThreshold(country) / CENTS_PER_TOKEN
  const have = Math.min(need, Math.floor(Math.max(0, subtotalCents) / CENTS_PER_TOKEN))
  return `${have} / ${need}`
}

/** The line under the meter: tokens still to go, or that it's unlocked. */
export function freeShipCaption(subtotalCents, country) {
  const left = freeShipThreshold(country) - subtotalCents
  if (left <= 0) return 'free shipping unlocked'
  const tokens = Math.ceil(left / CENTS_PER_TOKEN)
  return `${tokens} token${tokens === 1 ? '' : 's'} to free shipping`
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
