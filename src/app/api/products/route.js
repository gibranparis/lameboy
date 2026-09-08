// src/app/api/products/route.js
// Public read of the product catalog. Server-side only (uses the Supabase
// service role key via src/lib/supabase.js), exposed to the browser through
// this JSON endpoint so client components never touch Supabase directly.
import { NextResponse } from 'next/server'
import { listProductsWithVariants } from '@/lib/supabase'

// Local image fallback keyed by product slug — same slugs as the static
// PRODUCTS list in src/lib/products.js, so a Supabase product row can be
// created without re-uploading images.
const LOCAL_IMAGES = {
  'hoodie-gray':  { image: '/products/gray.webp',  thumb: '/products/gray-thumb.webp' },
  'hoodie-brown': { image: '/products/brown.webp', thumb: '/products/brown-thumb.webp' },
  'hoodie-black': { image: '/products/black.webp', thumb: '/products/black-thumb.webp' },
  'hoodie-green': { image: '/products/green.webp', thumb: '/products/green-thumb.webp' },
  'hoodie-blue':  { image: '/products/blue.webp',  thumb: '/products/blue-thumb.webp' },
}

function normalizeProduct(p) {
  const variants = p.variants ?? []
  const local = LOCAL_IMAGES[p.slug] ?? {}
  const cheapestCents = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0

  return {
    id: p.id,
    title: p.name,
    name: p.name,
    price: cheapestCents,
    category: p.category ?? 'hoodies',
    image: local.image ?? '',
    thumb: local.thumb ?? local.image ?? '',
    images: local.image ? [local.image] : [],
    sizes: variants.map((v) => v.size),
    slug: p.slug,
    variants: variants.map((v) => ({ id: v.id, size: v.size, price: v.price_cents, stock: v.stock })),
  }
}

export async function GET() {
  try {
    const rows = await listProductsWithVariants()
    return NextResponse.json({ products: rows.map(normalizeProduct) })
  } catch (err) {
    console.error('[api/products]', err)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
