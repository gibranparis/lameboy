// The bag the cart button wears: one picked at random per page load, shared
// by the cart button and the splash warmup (which preloads just that one).
export const CART_BAGS = [
  '/cart/birkin-green.png',
  '/cart/birkin-royal.png',
  '/cart/birkin-sky.png',
  '/cart/birkin-purple.png',
  '/cart/birkin-red.png',
  '/cart/birkin-croc-red.png',
  '/cart/birkin-teal.png',
  '/cart/birkin-croc-brown.png',
  '/cart/birkin-himalaya.png',
  '/cart/birkin-himalaya-2.png',
  '/cart/birkin-himalaya-3.png',
  '/cart/birkin-himalaya-4.png',
  '/cart/kelly-orange.png',
  '/cart/kelly-emerald.png',
  '/cart/kelly-green.png',
]

export const CART_BAG_START = Math.floor(Math.random() * CART_BAGS.length)
