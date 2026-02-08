// scripts/optimize-images.mjs
// Optimize product images for web (reduce from ~7MB to <200KB)
// Usage: node scripts/optimize-images.mjs

import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const productsDir = join(publicDir, 'products')
const backupDir = join(productsDir, 'originals')

// Create backup directory
if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true })
}

async function optimizeImage(filePath, outputPath) {
  const ext = extname(filePath).toLowerCase()
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null

  const stats = statSync(filePath)
  const sizeBefore = (stats.size / 1024 / 1024).toFixed(2)

  try {
    // Optimize: resize to max 2000px width, convert to WebP with high quality
    await sharp(filePath)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 85,
        effort: 6
      })
      .toFile(outputPath)

    const statsAfter = statSync(outputPath)
    const sizeAfter = (statsAfter.size / 1024 / 1024).toFixed(2)
    const reduction = ((1 - statsAfter.size / stats.size) * 100).toFixed(1)

    return {
      file: basename(filePath),
      sizeBefore: `${sizeBefore}MB`,
      sizeAfter: `${sizeAfter}MB`,
      reduction: `${reduction}%`
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message)
    return null
  }
}

console.log('🖼️  Optimizing product images...\n')

const files = readdirSync(productsDir)
  .filter(f => ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()))
  .filter(f => !f.includes('optimized'))

if (files.length === 0) {
  console.log('No images found to optimize.')
  process.exit(0)
}

console.log(`Found ${files.length} images to optimize.\n`)

const results = []
for (const file of files) {
  const inputPath = join(productsDir, file)
  const baseName = basename(file, extname(file))
  const outputPath = join(productsDir, `${baseName}.webp`)

  console.log(`Processing ${file}...`)
  const result = await optimizeImage(inputPath, outputPath)

  if (result) {
    results.push(result)
    console.log(`  ✓ ${result.sizeBefore} → ${result.sizeAfter} (saved ${result.reduction})`)
  }
}

console.log('\n📊 Summary:')
console.log('━'.repeat(60))
results.forEach(r => {
  console.log(`${r.file.padEnd(20)} ${r.sizeBefore.padEnd(8)} → ${r.sizeAfter.padEnd(8)} (-${r.reduction})`)
})

const totalBefore = results.reduce((sum, r) => sum + parseFloat(r.sizeBefore), 0)
const totalAfter = results.reduce((sum, r) => sum + parseFloat(r.sizeAfter), 0)
const totalSaved = ((1 - totalAfter / totalBefore) * 100).toFixed(1)

console.log('━'.repeat(60))
console.log(`Total: ${totalBefore.toFixed(2)}MB → ${totalAfter.toFixed(2)}MB (-${totalSaved}%)`)

console.log('\n✅ Done! Now update src/lib/products to use .webp files:')
console.log('   image: \'/products/gray.webp\'  (instead of .png)')
