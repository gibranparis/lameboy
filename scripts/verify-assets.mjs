// scripts/verify-assets.mjs
// Build-time verification that all product images exist
// Usage: node scripts/verify-assets.mjs

import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const PRODUCTS = [
  { id: 'hoodie-gray', image: '/products/gray.webp', thumb: '/products/gray.webp' },
  { id: 'hoodie-brown', image: '/products/brown.webp', thumb: '/products/brown.webp' },
  { id: 'hoodie-black', image: '/products/black.webp', thumb: '/products/black.webp' },
  { id: 'hoodie-green', image: '/products/green.webp', thumb: '/products/green.webp' },
  { id: 'hoodie-blue', image: '/products/blue.webp', thumb: '/products/blue.webp' },
]

console.log('Verifying product assets...\n')

let allGood = true
for (const product of PRODUCTS) {
  const imagePath = join(publicDir, product.image)
  const thumbPath = product.thumb ? join(publicDir, product.thumb) : imagePath

  const imageExists = existsSync(imagePath)
  const thumbExists = existsSync(thumbPath)

  if (!imageExists) {
    console.error(`✗ ${product.id}: Missing image at ${product.image}`)
    allGood = false
  } else if (!thumbExists) {
    console.error(`✗ ${product.id}: Missing thumb at ${product.thumb}`)
    allGood = false
  } else {
    console.log(`✓ ${product.id}`)
  }
}

if (allGood) {
  console.log('\n✓ All product assets verified!')
  process.exit(0)
} else {
  console.error('\n✗ Some assets are missing!')
  process.exit(1)
}
