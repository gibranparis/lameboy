// scripts/verify-assets.mjs
// Build-time verification that all product images exist
// Usage: node scripts/verify-assets.mjs

import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const PRODUCTS = [
  { id: 'hoodie-gray', image: '/products/gray.png', thumb: '/products/gray.png' },
  { id: 'hoodie-brown', image: '/products/brown.png', thumb: '/products/brown.png' },
  { id: 'hoodie-black', image: '/products/black.png', thumb: '/products/black.png' },
  { id: 'hoodie-green', image: '/products/green.png', thumb: '/products/green.png' },
  { id: 'hoodie-blue', image: '/products/blue.png', thumb: '/products/blue.png' },
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
