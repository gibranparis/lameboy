// The bag the cart button wears: one picked at random per page load, shared
// by the cart button and the splash warmup (which preloads just that one).
// Each bag carries an accent (and the ink that reads on it) so the cart's
// buttons and highlights match the bag on show.
const HIMALAYA = { accent: '#b9a596', ink: '#000' }

export const CART_BAG_LIST = [
  { src: '/cart/birkin-green.png', accent: '#2fbf6a', ink: '#000' },
  { src: '/cart/birkin-royal.png', accent: '#2a6fd6', ink: '#fff' },
  { src: '/cart/birkin-sky.png', accent: '#5fb4e0', ink: '#000' },
  { src: '/cart/birkin-purple.png', accent: '#5b3fa6', ink: '#fff' },
  { src: '/cart/birkin-red.png', accent: '#c8103e', ink: '#fff' },
  { src: '/cart/birkin-croc-red.png', accent: '#9e1530', ink: '#fff' },
  { src: '/cart/birkin-teal.png', accent: '#1f5f78', ink: '#fff' },
  { src: '/cart/birkin-croc-brown.png', accent: '#8a4a2c', ink: '#fff' },
  { src: '/cart/birkin-himalaya.png', ...HIMALAYA },
  { src: '/cart/birkin-himalaya-2.png', ...HIMALAYA },
  { src: '/cart/birkin-himalaya-3.png', ...HIMALAYA },
  { src: '/cart/birkin-himalaya-4.png', ...HIMALAYA },
  { src: '/cart/kelly-orange.png', accent: '#ff6a3d', ink: '#000' },
  { src: '/cart/kelly-emerald.png', accent: '#13865f', ink: '#fff' },
  { src: '/cart/kelly-green.png', accent: '#1fa951', ink: '#000' },
]

export const CART_BAGS = CART_BAG_LIST.map((b) => b.src)

export const CART_BAG_START = Math.floor(Math.random() * CART_BAGS.length)

// The fallback accent (the site's green) when no bag has been shown yet
export const DEFAULT_BAG_ACCENT = { accent: '#0bf05f', ink: '#000' }

const STORE_KEY = 'lb:bag'

/**
 * Paint the accent for this load's bag onto the page (--bag-accent and
 * --bag-ink) and remember it for the session, so /checkout (a fresh page
 * load) keeps the same colour.
 */
export function applyCartBagAccent() {
  const bag = CART_BAG_LIST[CART_BAG_START]
  try { sessionStorage.setItem(STORE_KEY, bag.src) } catch {}
  paint(bag)
  return bag
}

/** The accent of the bag shown earlier this session (for /checkout). */
export function storedBagAccent() {
  let src = null
  try { src = sessionStorage.getItem(STORE_KEY) } catch {}
  const bag = CART_BAG_LIST.find((b) => b.src === src) || DEFAULT_BAG_ACCENT
  paint(bag)
  return bag
}

function paint({ accent, ink }) {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--bag-accent', accent)
  root.setProperty('--bag-ink', ink)
}
