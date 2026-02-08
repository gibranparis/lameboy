// scripts/compute-bbox.mjs
// Run once to compute opacity bounding boxes for all product images
// Usage: node scripts/compute-bbox.mjs

import { createCanvas, loadImage } from 'canvas'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const PRODUCTS = [
  { id: 'hoodie-gray', image: '/products/gray.png' },
  { id: 'hoodie-brown', image: '/products/brown.png' },
  { id: 'hoodie-black', image: '/products/black.png' },
  { id: 'hoodie-green', image: '/products/green.png' },
  { id: 'hoodie-blue', image: '/products/blue.png' },
]

async function computeOpaqueBBox(imagePath) {
  const fullPath = join(publicDir, imagePath)

  if (!existsSync(fullPath)) {
    console.warn(`⚠️  Image not found: ${fullPath}`)
    return null
  }

  try {
    const img = await loadImage(fullPath)
    const MAX_DIM = 150
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data

    let minX = w, minY = h, maxX = 0, maxY = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 20) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      const oW = maxX - minX
      const oH = maxY - minY
      const anchorY = (minY + oH * 0.08) / h
      const anchorX = (maxX - oW * 0.08) / w

      return {
        top: parseFloat(anchorY.toFixed(4)),
        right: parseFloat((1 - anchorX).toFixed(4)),
      }
    }

    return null
  } catch (err) {
    console.error(`Error processing ${imagePath}:`, err.message)
    return null
  }
}

console.log('Computing opacity bounding boxes...\n')

const results = {}
for (const product of PRODUCTS) {
  const bbox = await computeOpaqueBBox(product.image)
  if (bbox) {
    results[product.image] = bbox
    console.log(`✓ ${product.id}: top=${bbox.top}, right=${bbox.right}`)
  } else {
    console.log(`✗ ${product.id}: failed`)
  }
}

console.log('\n// Copy this into src/lib/product-bbox.js:')
console.log('export const PRODUCT_BBOX = ' + JSON.stringify(results, null, 2))
