// src/app/api/products/route.js
// Public read of the product catalog. Server-side only (uses the Supabase
// service role key via src/lib/supabase.js), exposed to the browser through
// this JSON endpoint so client components never touch Supabase directly.
import { NextResponse } from 'next/server'
import { listProductsWithVariants } from '@/lib/supabase'

// Fallback for the five original static-catalog slugs, so those Supabase
// rows work without re-uploading images. New products should set
// image_url/thumb_url on the row instead — see add_product_image_columns.sql.
const LOCAL_IMAGES = {
  'hoodie-gray':  { image: '/products/gray.webp',  thumb: '/products/gray-thumb.webp' },
  'hoodie-brown': { image: '/products/brown.webp', thumb: '/products/brown-thumb.webp' },
  'hoodie-black': { image: '/products/black.webp', thumb: '/products/black-thumb.webp' },
  'hoodie-green': { image: '/products/green.webp', thumb: '/products/green-thumb.webp' },
  'hoodie-blue':  { image: '/products/blue.webp',  thumb: '/products/blue-thumb.webp' },
}

// Last-resort placeholder for a product with neither image_url set nor a
// LOCAL_IMAGES match, so a new product never renders as a blank tile.
const PLACEHOLDER_IMAGE = { image: '/products/black.webp', thumb: '/products/black-thumb.webp' }

function normalizeProduct(p) {
  const variants = p.variants ?? []
  const local = LOCAL_IMAGES[p.slug] ?? PLACEHOLDER_IMAGE
  const cheapestCents = variants.length ? Math.min(...variants.map((v) => v.price_cents)) : 0

  const image = p.image_url || local.image
  const thumb = p.thumb_url || p.image_url || local.thumb

  return {
    id: p.id,
    title: p.name,
    name: p.name,
    price: cheapestCents,
    category: p.category ?? 'hoodies',
    image,
    thumb,
    images: [image],
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
