// src/lib/products.js
// Client-safe product data. The static PRODUCTS list below is the offline
// fallback rendered instantly on load; fetchProducts() then hits /api/products
// (backed by Supabase) and the page swaps in live data — same pattern the old
// fetchSwellProducts() followed, just against our own database instead of Swell.
// All image paths are in /public/products (lowercase filenames).

/**
 * @typedef {{ id:string, size:string, price:number, stock:number }} ProductVariant
 * @typedef {{ id:string, title:string, price:number, image:string, thumb?:string, images?:string[], sizes?:string[], category?:string, slug?:string, variants?:ProductVariant[] }} Product
 */

/** @type {Product[]} */
export const PRODUCTS = [
  {
    id: 'hoodie-gray',
    title: 'Gray',
    price: 5000,
    category: 'hoodies',
    thumb: '/products/gray-thumb.webp',    // 41KB - loads instantly in grid
    image: '/products/gray.webp',           // 428KB - high-res for detail view
    images: ['/products/gray.webp'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie-brown',
    title: 'Brown',
    price: 5000,
    category: 'hoodies',
    thumb: '/products/brown-thumb.webp',   // 19KB
    image: '/products/brown.webp',          // 144KB
    images: ['/products/brown.webp'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie-black',
    title: 'Black',
    price: 5000,
    category: 'hoodies',
    thumb: '/products/black-thumb.webp',   // 21KB
    image: '/products/black.webp',          // 182KB
    images: ['/products/black.webp'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie-green',
    title: 'Green',
    price: 5000,
    category: 'hoodies',
    thumb: '/products/green-thumb.webp',   // 21KB
    image: '/products/green.webp',          // 223KB
    images: ['/products/green.webp'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie-blue',
    title: 'Blue',
    price: 5000,
    category: 'hoodies',
    thumb: '/products/blue-thumb.webp',    // 26KB
    image: '/products/blue.webp',           // 234KB
    images: ['/products/blue.webp'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
]

// Default export so `import products from '@/lib/products'` works.
const products = PRODUCTS
export default products

/** Pre-computed category groups (never recompute client-side) */
const _categoryGroupsCache = new Map()
for (const p of PRODUCTS) {
  const cat = p.category || 'uncategorized'
  if (!_categoryGroupsCache.has(cat)) _categoryGroupsCache.set(cat, [])
  _categoryGroupsCache.get(cat).push(p)
}

/** @returns {Map<string, Product[]>} */
export function getCategoryGroups() {
  return _categoryGroupsCache
}

/** Fetch live products from Supabase (via /api/products), normalized to the same Product shape as PRODUCTS. */
export async function fetchProducts() {
  const res = await fetch('/api/products', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`)
  const { products: list } = await res.json()
  return Array.isArray(list) ? list : []
}
