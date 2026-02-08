// scripts/create-progressive-images.mjs
// Create dual-size images: tiny thumbs for instant load + high-res for detail views
// Usage: node scripts/create-progressive-images.mjs

import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const productsDir = join(__dirname, '../public/products')

// Image sizes
const THUMB_SIZE = 600   // Grid view - must load instantly
const FULL_SIZE = 2400   // Detail overlay - preload during gate

async function processImage(inputPath) {
  const ext = extname(inputPath).toLowerCase()
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null

  const baseName = basename(inputPath, ext)
  const thumbPath = join(productsDir, `${baseName}-thumb.webp`)
  const fullPath = join(productsDir, `${baseName}.webp`)

  try {
    // Create tiny thumbnail (grid view) - optimized for speed
    await sharp(inputPath)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })  // Lower effort = faster encode
      .toFile(thumbPath)

    // Create high-res version (detail view) - optimized for quality
    await sharp(inputPath)
      .resize(FULL_SIZE, FULL_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 })  // Higher quality for close-up viewing
      .toFile(fullPath)

    const thumbStats = statSync(thumbPath)
    const fullStats = statSync(fullPath)

    return {
      name: baseName,
      thumb: `${(thumbStats.size / 1024).toFixed(0)}KB`,
      full: `${(fullStats.size / 1024).toFixed(0)}KB`,
    }
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err.message)
    return null
  }
}

console.log('🖼️  Creating progressive images (thumb + full-res)...\n')

const files = readdirSync(productsDir)
  .filter(f => ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()))
  .filter(f => !f.includes('thumb') && !f.includes('.webp'))

if (files.length === 0) {
  console.log('No source images found. Looking for PNG/JPG files...')
  process.exit(0)
}

console.log(`Found ${files.length} images to process.\n`)

const results = []
for (const file of files) {
  const inputPath = join(productsDir, file)
  console.log(`Processing ${file}...`)
  const result = await processImage(inputPath)
  if (result) {
    results.push(result)
    console.log(`  ✓ Thumb: ${result.thumb} | Full: ${result.full}`)
  }
}

console.log('\n📊 Summary:')
console.log('━'.repeat(60))
results.forEach(r => {
  console.log(`${r.name.padEnd(20)} thumb: ${r.thumb.padStart(7)} | full: ${r.full.padStart(7)}`)
})

const totalThumb = results.reduce((sum, r) => sum + parseFloat(r.thumb), 0)
const totalFull = results.reduce((sum, r) => sum + parseFloat(r.full), 0)

console.log('━'.repeat(60))
console.log(`Total thumbs: ${totalThumb.toFixed(0)}KB (loads instantly)`)
console.log(`Total full:   ${totalFull.toFixed(0)}KB (preloads during gate)`)

console.log('\n✅ Done! Update src/lib/products:')
console.log('   thumb: \'/products/gray-thumb.webp\'  // Grid view')
console.log('   image: \'/products/gray.webp\'        // Detail view')
