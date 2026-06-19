// src/lib/swell.js
import swell from 'swell-js'

let initialized = false

function getClient() {
  if (!initialized && typeof window !== 'undefined') {
    swell.init(
      process.env.NEXT_PUBLIC_SWELL_STORE,
      process.env.NEXT_PUBLIC_SWELL_KEY,
      { useCamelCase: true }
    )
    initialized = true
  }
  return swell
}

/** Fetch all active products from Swell, normalized to our Product shape */
export async function fetchSwellProducts() {
  const client = getClient()
  const result = await client.products.list({ limit: 100, active: true })
  const items = result?.results ?? []
  return items.map(normalizeProduct)
}

/** Add an item to the Swell cart and return updated cart */
export async function swellCartAdd(productId, options = {}) {
  const client = getClient()
  return client.cart.addItem({ productId, quantity: options.quantity ?? 1, options: options.variant ?? {} })
}

/** Remove an item from the Swell cart by item id */
export async function swellCartRemove(itemId) {
  const client = getClient()
  return client.cart.removeItem(itemId)
}

/** Update quantity of a cart item */
export async function swellCartUpdate(itemId, quantity) {
  const client = getClient()
  return client.cart.updateItem(itemId, { quantity })
}

/** Get the current Swell cart */
export async function swellCartGet() {
  const client = getClient()
  return client.cart.get()
}

/** Get the Swell checkout URL for the current cart */
export async function swellCheckoutUrl() {
  const client = getClient()
  const cart = await client.cart.get()
  return cart?.checkoutUrl ?? null
}

// Local image fallback keyed by Swell product slug
const LOCAL_IMAGES = {
  'hoodie-gray':  { image: '/products/gray.webp',  thumb: '/products/gray-thumb.webp' },
  'hoodie-brown': { image: '/products/brown.webp', thumb: '/products/brown-thumb.webp' },
  'hoodie-black': { image: '/products/black.webp', thumb: '/products/black-thumb.webp' },
  'hoodie-green': { image: '/products/green.webp', thumb: '/products/green-thumb.webp' },
  'hoodie-blue':  { image: '/products/blue.webp',  thumb: '/products/blue-thumb.webp' },
}

/** Normalize a Swell product to our internal Product shape */
function normalizeProduct(p) {
  const swellImages = (p.images ?? []).map((img) => img.file?.url ?? img.url ?? '').filter(Boolean)
  const local = LOCAL_IMAGES[p.slug] ?? {}

  const image = swellImages[0] || local.image || ''
  const thumb = swellImages[0] || local.thumb || ''

  const sizeOption = (p.options ?? []).find((o) => o.name?.toLowerCase() === 'size')
  const sizeValues = sizeOption
    ? (sizeOption.values ?? []).map((v) => v.name)
    : ['S', 'M', 'L', 'XL']

  return {
    id: p.id,
    swellId: p.id,
    title: p.name,
    name: p.name,
    price: Math.round((p.price ?? 0) * 100),
    category: p.categories?.[0]?.name ?? 'hoodies',
    image,
    thumb,
    images: swellImages.length ? swellImages : [image],
    sizes: sizeValues,
    slug: p.slug,
  }
}
