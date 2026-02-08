// src/components/ShopGrid.jsx
// @ts-check
'use client'

import Image from 'next/image'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ProductOverlay from '@/components/ProductOverlay'
import { PRODUCTS, logMissingAssets, groupByCategory } from '@/lib/products'
import { useCart } from '@/contexts/CartContext'

/** Storage key for saved grid density */
const KEY_DENSITY = 'lb:grid-cols'
const MIN_COLS = 1
const MAX_COLS = 5

const VIEW_STACKS = 'stacks'
const VIEW_GRID = 'grid'

function clampCols(n) {
  const v = Number(n) || MAX_COLS
  return Math.max(MIN_COLS, Math.min(MAX_COLS, v | 0))
}

function readSavedCols() {
  try {
    const v = Number(sessionStorage.getItem(KEY_DENSITY) || '')
    if (!Number.isFinite(v)) return MAX_COLS
    return clampCols(v)
  } catch {
    return MAX_COLS
  }
}

/** Cache of image src → opaque bounding-box (percentage offsets) */
const _bboxCache = new Map()

/**
 * Load a PNG and scan its alpha channel to find the bounding box of
 * opaque pixels.  Returns `{ top, right, imageData, width, height }`
 * as 0-1 fractions of the image dimensions (how far the opaque edge is from each side).
 */
function computeOpaqueBBox(/** @type {string} */ src) {
  return new Promise((resolve) => {
    if (_bboxCache.has(src)) { resolve(_bboxCache.get(src)); return }
    const img = new window.Image()
    img.onload = () => {
      try {
        // Scale down for faster scanning
        const MAX_DIM = 150
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) { resolve(null); return }
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
          // Inset the anchor into the opaque content so the badge
          // sits ON the product (like a shopping tag) rather than
          // at the very edge of the bounding box.
          const oW = maxX - minX
          const oH = maxY - minY
          const anchorY = (minY + oH * 0.08) / h
          const anchorX = (maxX - oW * 0.08) / w
          const result = {
            top: anchorY,
            right: 1 - anchorX,
            imageData: data,
            width: w,
            height: h
          }
          _bboxCache.set(src, result)
          resolve(result)
        } else { resolve(null) }
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Check if a click on an image element happened on an opaque pixel
 * @param {any} e - The click event (React MouseEvent)
 * @param {HTMLImageElement} img - The image element
 * @param {Uint8ClampedArray} imageData - The image pixel data
 * @param {number} w - The image data width
 * @param {number} h - The image data height
 * @returns {boolean} - True if click was on opaque pixel
 */
function isClickOnOpaquePixel(e, img, imageData, w, h) {
  try {
    const rect = img.getBoundingClientRect()
    // Get click position relative to image
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Convert to 0-1 range
    const xPercent = x / rect.width
    const yPercent = y / rect.height
    // Map to imageData coordinates
    const imgX = Math.floor(xPercent * w)
    const imgY = Math.floor(yPercent * h)
    // Check bounds
    if (imgX < 0 || imgX >= w || imgY < 0 || imgY >= h) return false
    // Get alpha value at this pixel
    const alpha = imageData[(imgY * w + imgX) * 4 + 3]
    // Consider alpha > 20 as opaque (same threshold as bbox computation)
    return alpha > 20
  } catch {
    return true // Fallback to allowing click if detection fails
  }
}

export default function ShopGrid({ products, autoOpenFirstOnMount = false }) {
  /* ---------------- Seed products ---------------- */
  const seed = useMemo(() => {
    const fromProp = Array.isArray(products) ? products : null
    const fromWin =
      typeof window !== 'undefined' && Array.isArray(window.__LB_PRODUCTS)
        ? window.__LB_PRODUCTS
        : null

    /** @type {typeof PRODUCTS} */
    const base =
      fromProp && fromProp.length
        ? fromProp
        : fromWin && fromWin.length
          ? fromWin
          : PRODUCTS && PRODUCTS.length
            ? PRODUCTS
            : [
                {
                  id: 'hoodie-brown-1',
                  title: 'Brown',
                  price: 4000,
                  image: '/products/brown.png',
                  thumb: '/products/brown.png',
                  images: ['/products/brown.png'],
                  sizes: ['S', 'M', 'L', 'XL'],
                },
              ]

    if (base.length >= 2) return base

    return Array.from({ length: 5 }, (_, i) => ({
      ...base[0],
      id: `${base[0].id}-v${i + 1}`,
      title: i === 0 ? base[0].title : `${base[0].title} #${i + 1}`,
    }))
  }, [products])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') logMissingAssets()
  }, [])

  /* ---------------- View mode (stacks vs grid) ---------------- */
  const [viewMode, setViewMode] = useState(VIEW_STACKS)
  const [stackReversed, setStackReversed] = useState(false)
  const categoryGroups = useMemo(() => groupByCategory(seed), [seed])

  useEffect(() => {
    try { sessionStorage.setItem('lb:view-mode', viewMode) } catch {}
  }, [viewMode])

  /* ---------------- Cart integration ---------------- */
  const cart = useCart()

  const getProductQty = useCallback((productId) => {
    return cart.items
      .filter(item => item.id === productId)
      .reduce((sum, item) => sum + item.qty, 0)
  }, [cart.items])

  /* ---------------- Badge anchors (opaque bounding box) + click detection ---------------- */
  const [badgeAnchors, setBadgeAnchors] = useState(
    /** @type {Record<string, {top:number, right:number, imageData?:Uint8ClampedArray, width?:number, height?:number}>} */ ({})
  )

  useEffect(() => {
    let cancelled = false
    seed.forEach((/** @type {any} */ p) => {
      const src = p.thumb || p.image
      if (!src) return
      computeOpaqueBBox(src).then((bbox) => {
        if (cancelled || !bbox) return
        setBadgeAnchors((prev) => prev[src] ? prev : { ...prev, [src]: bbox })
      })
    })
    return () => { cancelled = true }
  }, [seed])

  /* ---------------- Hover detection on opaque pixels (GRID) ---------------- */
  useEffect(() => {
    if (viewMode !== VIEW_GRID) return

    const handleMouseMove = (/** @type {any} */ e) => {
      const tile = /** @type {HTMLElement|null} */ (e.target)?.closest?.('.product-tile')
      if (!tile) return

      const img = tile.querySelector('.product-img')
      if (!(img instanceof HTMLImageElement)) return

      // Get product index from tile
      const allTiles = Array.from(document.querySelectorAll('.shop-grid[data-view-mode="grid"] .product-tile'))
      const idx = allTiles.indexOf(tile)
      if (idx < 0 || idx >= seed.length) return

      const p = seed[idx]
      const src = p.thumb || p.image
      const anchorData = badgeAnchors[src]

      if (anchorData?.imageData && anchorData.width && anchorData.height) {
        const isOpaque = isClickOnOpaquePixel(e, img, anchorData.imageData, anchorData.width, anchorData.height)
        const box = tile.querySelector('.product-box')
        if (box instanceof HTMLElement) {
          if (isOpaque) {
            box.classList.add('hover-opaque')
          } else {
            box.classList.remove('hover-opaque')
          }
        }
      }
    }

    const handleMouseLeave = (/** @type {any} */ e) => {
      const tile = /** @type {HTMLElement|null} */ (e.target)?.closest?.('.product-tile')
      if (!tile) return
      const box = tile.querySelector('.product-box')
      if (box instanceof HTMLElement) {
        box.classList.remove('hover-opaque')
      }
    }

    const grid = document.querySelector('.shop-grid[data-view-mode="grid"]')
    if (grid) {
      grid.addEventListener('mousemove', handleMouseMove)
      grid.addEventListener('mouseleave', handleMouseLeave)
      return () => {
        grid.removeEventListener('mousemove', handleMouseMove)
        grid.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [viewMode, seed, badgeAnchors])

  /* ---------------- Hover detection on opaque pixels (STACKS) ---------------- */
  useEffect(() => {
    if (viewMode !== VIEW_STACKS) return

    const handleMouseMove = (/** @type {any} */ e) => {
      const stack = /** @type {HTMLElement|null} */ (e.target)?.closest?.('.category-stack')
      if (!stack) return

      // Find which image is actually under the cursor (top-most due to z-index)
      const elemAtPoint = document.elementFromPoint(e.clientX, e.clientY)
      const img = elemAtPoint?.closest?.('.product-img')
      if (!(img instanceof HTMLImageElement)) {
        // Clear all hovers in this stack
        stack.querySelectorAll('.product-box.hover-opaque').forEach(box => {
          box.classList.remove('hover-opaque')
        })
        return
      }

      // Get the src from the image element
      const src = img.src || img.getAttribute('src')
      if (!src) return

      // Extract just the path part (remove domain)
      const srcPath = src.includes('/products/')
        ? src.substring(src.indexOf('/products/'))
        : src

      const anchorData = badgeAnchors[srcPath]

      if (anchorData?.imageData && anchorData.width && anchorData.height) {
        const isOpaque = isClickOnOpaquePixel(e, img, anchorData.imageData, anchorData.width, anchorData.height)

        // Clear all hovers first
        stack.querySelectorAll('.product-box.hover-opaque').forEach(box => {
          box.classList.remove('hover-opaque')
        })

        // Add hover to all boxes in stack if opaque
        if (isOpaque) {
          stack.querySelectorAll('.product-box').forEach(box => {
            if (box instanceof HTMLElement) {
              box.classList.add('hover-opaque')
            }
          })
        }
      }
    }

    const handleMouseLeave = (/** @type {any} */ e) => {
      const stack = /** @type {HTMLElement|null} */ (e.target)?.closest?.('.category-stack')
      if (!stack) return
      stack.querySelectorAll('.product-box.hover-opaque').forEach(box => {
        box.classList.remove('hover-opaque')
      })
    }

    const grid = document.querySelector('.shop-grid[data-view-mode="stacks"]')
    if (grid) {
      grid.addEventListener('mousemove', handleMouseMove)
      grid.addEventListener('mouseleave', handleMouseLeave)
      return () => {
        grid.removeEventListener('mousemove', handleMouseMove)
        grid.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [viewMode, seed, badgeAnchors])

  /* ---------------- Overlay state ---------------- */
  const [overlayIdx, setOverlayIdx] = useState(/** @type {number|null} */ null)
  const [fromRect, setFromRect] = useState(
    /** @type {{left:number,top:number,width:number,height:number}|null} */ (null)
  )

  const overlayOpen = overlayIdx != null

  const openAt = useCallback((i, rect) => {
    setFromRect(rect || null)
    setOverlayIdx(i)
    // Add fade class to grid for fade-out effect
    const gridEl = document.querySelector('[data-component="shop-grid"]')
    if (gridEl) {
      gridEl.classList.add('overlay-fading')
      // Mark the active tile so it doesn't fade
      const tiles = gridEl.querySelectorAll('.product-tile')
      tiles.forEach((tile, idx) => {
        if (idx === i) {
          tile.setAttribute('data-flip-active', 'true')
        } else {
          tile.removeAttribute('data-flip-active')
        }
      })
    }
  }, [])

  const close = useCallback(() => {
    setOverlayIdx(null)
    // Remove fade class from grid and clear active tile marker
    const gridEl = document.querySelector('[data-component="shop-grid"]')
    if (gridEl) {
      gridEl.classList.remove('overlay-fading')
      const tiles = gridEl.querySelectorAll('.product-tile[data-flip-active]')
      tiles.forEach((tile) => tile.removeAttribute('data-flip-active'))
    }
  }, [])

  const clearFromRect = useCallback(() => setFromRect(null), [])

  /* ---------------- Render refs (used by auto-open) ---------------- */
  const firstTileRef = useRef(null)

  // Auto-open first product on mount (slight delay to allow layout)
  // Only fires in grid mode — stacks view should show the deck first.
  // Don't auto-open if we transitioned from stacks to grid (user clicked to reveal).
  useEffect(() => {
    if (autoOpenFirstOnMount && seed.length && viewMode === VIEW_GRID && gridRevealedAtRef.current === 0) {
      const t = setTimeout(() => {
        const el = firstTileRef.current
        const r = el?.getBoundingClientRect?.()
        openAt(0, r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null)
      }, 80)
      return () => clearTimeout(t)
    }
  }, [autoOpenFirstOnMount, seed.length, openAt, viewMode])

  /* ---------------- Grid density via orb ---------------- */

  const [cols, setCols] = useState(() => clampCols(readSavedCols()))
  const prevColsRef = useRef(cols)

  /* ---------- FLIP animation: smooth slide on density change ---------- */
  const flipSnapshotRef = useRef(/** @type {Map<number,DOMRect>|null} */ (null))

  /** Capture tile positions, then update cols so useLayoutEffect can FLIP */
  const setColsWithFlip = useCallback((/** @type {number|((p:number)=>number)} */ v) => {
    const grid = document.querySelector('[data-component="shop-grid"]')
    if (grid) {
      const tiles = grid.querySelectorAll('.product-tile')
      const snap = new Map()
      tiles.forEach((tile, idx) => snap.set(idx, tile.getBoundingClientRect()))
      flipSnapshotRef.current = snap
    }
    setCols(v)
  }, [])

  /** Track when grid was revealed to prevent immediate overlay opening */
  const gridRevealedAtRef = useRef(0)

  /** Transition from stacked deck → grid with FLIP animation */
  const revealGrid = useCallback(() => {
    const grid = document.querySelector('[data-component="shop-grid"]')
    if (grid) {
      const tiles = grid.querySelectorAll('.product-tile')
      const snap = new Map()
      tiles.forEach((tile, idx) => snap.set(idx, tile.getBoundingClientRect()))
      flipSnapshotRef.current = snap
    }
    gridRevealedAtRef.current = Date.now()
    setViewMode(VIEW_GRID)
    setCols(MAX_COLS)
  }, [])

  /** Transition from grid → stacked deck with FLIP animation */
  const collapseToStacks = useCallback(() => {
    const grid = document.querySelector('[data-component="shop-grid"]')
    if (grid) {
      const tiles = grid.querySelectorAll('.product-tile')
      const snap = new Map()
      tiles.forEach((tile, idx) => snap.set(idx, tile.getBoundingClientRect()))
      flipSnapshotRef.current = snap
    }
    setViewMode(VIEW_STACKS)
    // Toggle stack order after each full zoom cycle
    setStackReversed((prev) => !prev)
  }, [])

  /** After React re-renders with new cols, FLIP tiles from old → new pos */
  useLayoutEffect(() => {
    const snap = flipSnapshotRef.current
    if (!snap || !snap.size) return
    flipSnapshotRef.current = null

    const grid = document.querySelector('[data-component="shop-grid"]')
    if (!grid) return
    const tiles = /** @type {HTMLElement[]} */ (Array.from(grid.querySelectorAll('.product-tile')))

    const flips = []
    tiles.forEach((tile, idx) => {
      const prev = snap.get(idx)
      if (!prev) return
      const next = tile.getBoundingClientRect()
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      const sx = next.width > 0 ? prev.width / next.width : 1
      const sy = next.height > 0 ? prev.height / next.height : 1
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01) return
      flips.push({ tile, dx, dy, sx, sy })
    })

    if (!flips.length) return

    // Invert — place each tile at its OLD position
    flips.forEach(({ tile, dx, dy, sx, sy }) => {
      tile.style.transformOrigin = '0 0'
      tile.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
      tile.style.transition = 'none'
    })

    // Force reflow so the "from" state registers
    void grid.offsetHeight

    // Play — animate to final (natural) position
    flips.forEach(({ tile }) => {
      tile.style.transition = 'transform 380ms cubic-bezier(0.25, 1, 0.5, 1)'
      tile.style.transform = 'translate(0,0) scale(1,1)'
    })

    // Cleanup after animation finishes
    const t = setTimeout(() => {
      flips.forEach(({ tile }) => {
        // Disable transitions while clearing inline styles so the
        // CSS-defined transition doesn't fire on the non-visual change
        tile.style.transition = 'none'
        tile.style.transform = ''
        tile.style.transformOrigin = ''
      })
      // Re-enable CSS transitions next frame
      requestAnimationFrame(() => {
        flips.forEach(({ tile }) => { tile.style.transition = '' })
      })
    }, 400)

    return () => clearTimeout(t)
  }, [cols, viewMode])

  const broadcastDensity = useCallback((/** @type {number} */ density, /** @type {string} */ mode) => {
    const detail = { density, value: density, viewMode: mode }
    try {
      document.dispatchEvent(new CustomEvent('lb:grid-density', { detail }))
    } catch {}
    try {
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
    } catch {}
  }, [])

  const syncCssTokens = useCallback((n) => {
    try {
      const root = document.documentElement
      root.style.setProperty('--grid-cols', String(n))
      root.setAttribute('data-grid-cols', String(n))
    } catch {}
  }, [])

  // Keep CSS tokens, storage, bump flag, and broadcast in sync with `cols`
  useEffect(() => {
    const clamped = clampCols(cols)
    const prev = prevColsRef.current

    syncCssTokens(clamped)

    try {
      sessionStorage.setItem(KEY_DENSITY, String(clamped))
    } catch {}

    broadcastDensity(clamped, viewMode)

    // Grid "zoom" feel on density changes (only when value actually changes)
    if (prev !== clamped) {
      try {
        const root = document.documentElement
        root.setAttribute('data-grid-anim', '1')
        root.setAttribute('data-grid-dir', clamped < prev ? 'in' : 'out')
        const t = setTimeout(() => {
          root.removeAttribute('data-grid-anim')
          root.removeAttribute('data-grid-dir')
        }, 260)
        prevColsRef.current = clamped
        return () => clearTimeout(t)
      } catch {
        /* ignore */
      }
    }

    prevColsRef.current = clamped
  }, [cols, viewMode, broadcastDensity, syncCssTokens])

  // Listen for zoom/density events from the orb/header
  useEffect(() => {
    const onZoom = (e) => {
      const d = e?.detail || {}
      const explicit = Number(d.value)

      if (overlayIdx != null) {
        if (Number.isFinite(explicit)) {
          setCols(clampCols(explicit))
        }
        return
      }

      if (Number.isFinite(explicit)) {
        if (viewMode === VIEW_STACKS) {
          revealGrid()
        } else {
          setColsWithFlip(clampCols(explicit))
        }
        return
      }

      const step = Math.max(1, Math.min(3, Number(d.step) || 1))
      const dir = typeof d.dir === 'string' ? d.dir : null

      // Stacks is the "most zoomed out" stage, grid 5->1 are increasingly zoomed in
      if (viewMode === VIEW_STACKS) {
        // From stacks, only "zoom in" reveals grid at max cols
        if (dir === 'in' || !dir) {
          revealGrid()
        }
        // Zooming "out" from stacks does nothing (already at max zoom out)
        return
      }

      // In grid mode
      if (dir === 'in') {
        // Zoom in: decrease cols (5->4->3->2->1)
        setColsWithFlip((p) => clampCols(p - step))
        return
      }
      if (dir === 'out') {
        // Zoom out: increase cols (1->2->3->4->5)
        // If already at max cols (5), go back to stacks
        if (cols >= MAX_COLS) {
          collapseToStacks()
          return
        }
        setColsWithFlip((p) => clampCols(p + step))
        return
      }

      // No direction specified - toggle behavior
      if (cols <= MIN_COLS) {
        // At min cols, zoom back out
        setColsWithFlip((p) => clampCols(p + 1))
      } else if (cols >= MAX_COLS) {
        // At max cols, toggle to stacks
        collapseToStacks()
      } else {
        // In between, zoom in
        setColsWithFlip((p) => clampCols(p - 1))
      }
    }

    document.addEventListener('lb:zoom', onZoom)
    return () => {
      document.removeEventListener('lb:zoom', onZoom)
    }
  }, [overlayIdx, setColsWithFlip, viewMode, cols, revealGrid, collapseToStacks])

  /* ---------------- Signal "shop ready" (redundant safety) ---------------- */
  const readySent = useRef(false)
  const sendReady = useCallback(() => {
    if (readySent.current) return
    readySent.current = true
    try {
      window.dispatchEvent(new Event('lb:shop-ready'))
    } catch {}
  }, [])

  useEffect(() => {
    let id1 = 0,
      id2 = 0,
      to = 0
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        to = window.setTimeout(sendReady, 60)
      })
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
      clearTimeout(to)
    }
  }, [sendReady])

  const onFirstThumbRef = useRef(false)
  const handleFirstDecode = useCallback(
    (imgEl) => {
      if (!imgEl || onFirstThumbRef.current) return
      onFirstThumbRef.current = true
      try {
        const run = () => sendReady()
        imgEl.decode ? imgEl.decode().then(run).catch(run) : run()
      } catch {
        sendReady()
      }
    },
    [sendReady]
  )

  return (
    <div
      className="shop-wrap"
      data-shop-root
      style={{
        ['--grid-cols']: String(cols),
        background: 'var(--shop-offwhite, #F7F7F2)',
        minHeight: '100dvh',
      }}
    >
      <div className="shop-grid" data-component="shop-grid" data-view-mode={viewMode} data-stack-reversed={stackReversed ? 'true' : undefined}>
        {viewMode === VIEW_STACKS ? (
          /* ---------- STACKED DECK VIEW ---------- */
          Array.from(categoryGroups.entries()).map((/** @type {[string, any[]]} */ [category, items]) => {
            // Track the global seed index for each product so FLIP matches
            const seedIndices = items.map((/** @type {any} */ p) => seed.indexOf(p))
            return (
              <div
                key={category}
                className="category-stack"
                data-stack-reversed={stackReversed ? 'true' : undefined}
                role="button"
                tabIndex={0}
                aria-label={`${category} — ${items.length} products. Click to expand.`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  // Check if click is on opaque part of the top-most image
                  const elemAtPoint = document.elementFromPoint(e.clientX, e.clientY)
                  const img = elemAtPoint?.closest?.('.product-img')

                  if (img instanceof HTMLImageElement) {
                    const src = img.src || img.getAttribute('src')
                    const srcPath = src && src.includes('/products/')
                      ? src.substring(src.indexOf('/products/'))
                      : src

                    const anchorData = srcPath ? badgeAnchors[srcPath] : null

                    if (anchorData?.imageData && anchorData.width && anchorData.height) {
                      const isOpaque = isClickOnOpaquePixel(
                        e,
                        img,
                        anchorData.imageData,
                        anchorData.width,
                        anchorData.height
                      )
                      if (!isOpaque) return // Ignore clicks on transparent areas
                    }
                  }

                  revealGrid()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    revealGrid()
                  }
                }}
              >
                {items.map((/** @type {any} */ p, /** @type {number} */ i) => (
                  <div
                    key={p.id ?? i}
                    ref={seedIndices[i] === 0 ? firstTileRef : undefined}
                    className="product-tile lb-tile"
                    aria-hidden="true"
                  >
                    <div className="product-box">
                      <div className="product-img-wrap">
                        <Image
                          src={p.thumb || p.image}
                          alt={p.title || 'Product'}
                          width={800}
                          height={800}
                          className="product-img"
                          priority={i === 0}
                          unoptimized
                          sizes="(max-width: 480px) 42vw, (max-width: 768px) 28vw, (max-width: 1280px) 18vw, 14vw"
                          ref={(el) => {
                            if (seedIndices[i] === 0 && el?.complete) handleFirstDecode(el)
                          }}
                          onLoad={(e) => {
                            if (seedIndices[i] === 0) handleFirstDecode(e.currentTarget)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          /* ---------- GRID VIEW (existing) ---------- */
          seed.map((/** @type {any} */ p, /** @type {number} */ idx) => (
            <a
              key={p.id ?? idx}
              ref={idx === 0 ? firstTileRef : undefined}
              className="product-tile lb-tile"
              role="button"
              tabIndex={0}
              aria-label={`Open ${p.title ?? 'product'} details`}
              onClick={(e) => {
                e.preventDefault()
                // Prevent opening overlay immediately after revealing grid from stacks
                if (Date.now() - gridRevealedAtRef.current < 500) return

                // Check if click is on opaque part of image (not transparent background)
                const src = p.thumb || p.image
                const anchorData = badgeAnchors[src]
                if (anchorData?.imageData && anchorData.width && anchorData.height) {
                  const imgEl = e.currentTarget.querySelector('.product-img')
                  if (imgEl instanceof HTMLImageElement) {
                    const isOpaque = isClickOnOpaquePixel(
                      e,
                      imgEl,
                      anchorData.imageData,
                      anchorData.width,
                      anchorData.height
                    )
                    if (!isOpaque) return // Ignore clicks on transparent areas
                  }
                }

                const r = e.currentTarget.getBoundingClientRect()
                openAt(idx, { left: r.left, top: r.top, width: r.width, height: r.height })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  // Prevent opening overlay immediately after revealing grid from stacks
                  if (Date.now() - gridRevealedAtRef.current < 500) return
                  const el = /** @type {HTMLElement} */ (e.currentTarget)
                  const r = el.getBoundingClientRect()
                  openAt(idx, { left: r.left, top: r.top, width: r.width, height: r.height })
                }
              }}
            >
              <div className="product-box">
                <div className="product-img-wrap">
                  <Image
                    src={p.thumb || p.image}
                    alt={p.title || 'Product'}
                    width={800}
                    height={800}
                    className="product-img"
                    priority={idx === 0}
                    unoptimized
                    sizes="(max-width: 480px) 42vw, (max-width: 768px) 28vw, (max-width: 1280px) 18vw, 14vw"
                    ref={(el) => {
                      if (idx === 0 && el?.complete) handleFirstDecode(el)
                    }}
                    onLoad={(e) => {
                      if (idx === 0) handleFirstDecode(e.currentTarget)
                    }}
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.dataset.fallback === 'hero') {
                        img.src = '/products/brown.png'
                        img.dataset.fallback = 'final'
                      } else if (!img.dataset.fallback) {
                        img.src = p.image
                        img.dataset.fallback = 'hero'
                      }
                    }}
                  />
                  {(() => {
                    const qty = getProductQty(p.id)
                    if (qty <= 0) return null
                    const anchor = badgeAnchors[p.thumb || p.image]

                    return (
                      <span
                        className="product-badge"
                        aria-label={`${qty} in cart`}
                        style={anchor ? {
                          top: `${(anchor.top * 100).toFixed(1)}%`,
                          right: `${(anchor.right * 100).toFixed(1)}%`,
                          transform: 'translate(50%, -50%)',
                        } : undefined}
                      >
                        {qty}
                      </span>
                    )
                  })()}
                </div>
              </div>
              {cols < MAX_COLS && (
                <div className="product-meta">
                  {p.title}
                  {cols <= MIN_COLS + 1 && (
                    <span className="product-price">
                      {typeof p.price === 'number'
                        ? p.price % 100 === 0 ? `$${p.price / 100}` : `$${(p.price / 100).toFixed(2)}`
                        : p.price ?? ''}
                    </span>
                  )}
                </div>
              )}
            </a>
          ))
        )}
      </div>

      {overlayOpen && (
        <ProductOverlay
          products={seed}
          index={overlayIdx}
          fromRect={fromRect}
          onIndexChange={(i) => setOverlayIdx(((i % seed.length) + seed.length) % seed.length)}
          onClose={close}
          onClosed={clearFromRect}
        />
      )}

      <style jsx>{`
        .shop-wrap {
          width: 100%;
        }

        /* ---------- GRID VIEW ---------- */
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(var(--grid-cols, 5), minmax(0, 1fr));
          gap: clamp(10px, 2vw, 18px);
          padding: clamp(10px, 3vw, 24px);
          transition:
            gap 220ms ease,
            padding 220ms ease;
        }

        /* ---------- STACKED DECK VIEW ---------- */
        .shop-grid[data-view-mode='stacks'] {
          /* Use same grid layout as normal grid mode */
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: clamp(10px, 2vw, 18px);
          padding: clamp(10px, 3vw, 24px);
          min-height: calc(100dvh - var(--header-ctrl, 64px));
          align-items: start;
        }

        .category-stack {
          position: relative;
          cursor: pointer;
          /* Place in first column (where item 1 would be in 5-item grid) */
          grid-column: 1;
          /* Full width/height of the grid cell */
          width: 100%;
          aspect-ratio: 1 / 1;
          animation: stack-wiggle 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }

        @keyframes stack-wiggle {
          0% { transform: scale(0.98) rotate(0deg); }
          25% { transform: scale(1.01) rotate(-0.8deg); }
          50% { transform: scale(1.005) rotate(0.8deg); }
          75% { transform: scale(1.005) rotate(-0.4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .category-stack:focus-visible {
          outline: 2px solid #000;
          outline-offset: 4px;
          border-radius: 16px;
        }

        .category-stack .product-tile {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Slow down stack reveal FLIP animation on mobile only */
        @media (pointer: coarse) {
          .shop-grid[data-view-mode='stacks'] .product-tile {
            transition: transform 380ms cubic-bezier(0.25, 1, 0.5, 1);
            will-change: transform;
          }
        }

        /* Preserve z-order during FLIP transition */
        /* Default: Gray on top (z-5), Blue on bottom (z-1) */
        /* Apply to both stacks and grid view to maintain order throughout transition */
        .shop-grid[data-view-mode='stacks'] .product-tile:nth-child(1),
        .shop-grid[data-view-mode='grid'] .product-tile:nth-child(1) { z-index: 5; }
        .shop-grid[data-view-mode='stacks'] .product-tile:nth-child(2),
        .shop-grid[data-view-mode='grid'] .product-tile:nth-child(2) { z-index: 4; }
        .shop-grid[data-view-mode='stacks'] .product-tile:nth-child(3),
        .shop-grid[data-view-mode='grid'] .product-tile:nth-child(3) { z-index: 3; }
        .shop-grid[data-view-mode='stacks'] .product-tile:nth-child(4),
        .shop-grid[data-view-mode='grid'] .product-tile:nth-child(4) { z-index: 2; }
        .shop-grid[data-view-mode='stacks'] .product-tile:nth-child(5),
        .shop-grid[data-view-mode='grid'] .product-tile:nth-child(5) { z-index: 1; }

        /* Reversed: Blue on top (z-5), Gray on bottom (z-1) */
        .shop-grid[data-stack-reversed='true'][data-view-mode='stacks'] .product-tile:nth-child(1),
        .shop-grid[data-stack-reversed='true'][data-view-mode='grid'] .product-tile:nth-child(1) { z-index: 1; }
        .shop-grid[data-stack-reversed='true'][data-view-mode='stacks'] .product-tile:nth-child(2),
        .shop-grid[data-stack-reversed='true'][data-view-mode='grid'] .product-tile:nth-child(2) { z-index: 2; }
        .shop-grid[data-stack-reversed='true'][data-view-mode='stacks'] .product-tile:nth-child(3),
        .shop-grid[data-stack-reversed='true'][data-view-mode='grid'] .product-tile:nth-child(3) { z-index: 3; }
        .shop-grid[data-stack-reversed='true'][data-view-mode='stacks'] .product-tile:nth-child(4),
        .shop-grid[data-stack-reversed='true'][data-view-mode='grid'] .product-tile:nth-child(4) { z-index: 4; }
        .shop-grid[data-stack-reversed='true'][data-view-mode='stacks'] .product-tile:nth-child(5),
        .shop-grid[data-stack-reversed='true'][data-view-mode='grid'] .product-tile:nth-child(5) { z-index: 5; }

        /* Horizontal stack - each card offset to the right with slight vertical offset */
        /* Creates a "pile of clothes" look where each color is visible */
        /* Gray on top (z-5), Blue on bottom (z-1) - flips after full zoom cycle */
        .category-stack .product-tile:nth-child(1) { z-index: 5; transform: translateX(0px); }
        .category-stack .product-tile:nth-child(2) { z-index: 4; transform: translateX(3px); }
        .category-stack .product-tile:nth-child(3) { z-index: 3; transform: translateX(6px); }
        .category-stack .product-tile:nth-child(4) { z-index: 2; transform: translateX(9px); }
        .category-stack .product-tile:nth-child(5) { z-index: 1; transform: translateX(12px); }

        /* Reversed stack order after full zoom cycle - Blue on top, Gray on bottom */
        /* Blue shifts right to show its natural position in sequence */
        .category-stack[data-stack-reversed='true'] .product-tile:nth-child(1) { z-index: 1; transform: translateX(-12px); }
        .category-stack[data-stack-reversed='true'] .product-tile:nth-child(2) { z-index: 2; transform: translateX(-9px); }
        .category-stack[data-stack-reversed='true'] .product-tile:nth-child(3) { z-index: 3; transform: translateX(-6px); }
        .category-stack[data-stack-reversed='true'] .product-tile:nth-child(4) { z-index: 4; transform: translateX(-3px); }
        .category-stack[data-stack-reversed='true'] .product-tile:nth-child(5) { z-index: 5; transform: translateX(0px); }

        /* Hover: items slide out while maintaining stacked z-order */
        /* Explicitly set z-order so top item stays on top, items stay underneath */
        /* Only trigger when hovering over opaque pixels (controlled by JS via .hover-opaque class) */
        @media (pointer: fine) {
          .category-stack .product-box.hover-opaque:nth-child(1) { transform: translateX(0px) scale(1.05); z-index: 5; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(1) { z-index: 5; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(1) .product-box { transform: translateX(0px) scale(1.05); }

          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(2) { z-index: 4; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(2) .product-box { transform: translateX(16px) scale(1.05); }

          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(3) { z-index: 3; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(3) .product-box { transform: translateX(32px) scale(1.05); }

          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(4) { z-index: 2; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(4) .product-box { transform: translateX(48px) scale(1.05); }

          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(5) { z-index: 1; }
          .category-stack .product-tile:has(.product-box.hover-opaque):nth-child(5) .product-box { transform: translateX(64px) scale(1.05); }
        }

        /* Reversed state hover: maintain reversed z-order */
        @media (pointer: fine) {
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(1) { z-index: 1; }
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(1) .product-box { transform: translateX(-12px) scale(1.05); }

          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(2) { z-index: 2; }
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(2) .product-box { transform: translateX(4px) scale(1.05); }

          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(3) { z-index: 3; }
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(3) .product-box { transform: translateX(20px) scale(1.05); }

          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(4) { z-index: 4; }
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(4) .product-box { transform: translateX(36px) scale(1.05); }

          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(5) { z-index: 5; }
          .category-stack[data-stack-reversed='true'] .product-tile:has(.product-box.hover-opaque):nth-child(5) .product-box { transform: translateX(52px) scale(1.05); }
        }

        /* ---------- SHARED TILE STYLES ---------- */
        .product-box {
          aspect-ratio: 1 / 1;
          background: #fff;
          border-radius: 16px;
          overflow: visible;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
          transform: translateZ(0) scale(1);
          transition: transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1);
          will-change: transform;
          backface-visibility: hidden;
        }

        /* In grid mode, make only the image clickable, not the transparent areas */
        .shop-grid[data-view-mode='grid'] .product-tile {
          pointer-events: none;
        }
        .shop-grid[data-view-mode='grid'] .product-tile .product-img-wrap,
        .shop-grid[data-view-mode='grid'] .product-tile .product-meta {
          pointer-events: auto;
        }

        /* In stacks mode, make only the image area clickable */
        .shop-grid[data-view-mode='stacks'] .category-stack {
          pointer-events: none;
        }
        .shop-grid[data-view-mode='stacks'] .category-stack .product-img-wrap {
          pointer-events: auto;
        }

        /* Grid "zoom" feel when density changes via orb */
        :global(html[data-grid-anim='1'][data-grid-dir='in']) .product-box {
          transform: translateZ(0) scale(1.03);
        }
        :global(html[data-grid-anim='1'][data-grid-dir='out']) .product-box {
          transform: translateZ(0) scale(0.97);
        }

        /* Never animate grid tiles while overlay is open */
        :global(html[data-overlay-open='1']) .product-box {
          transform: translateZ(0) scale(1) !important;
        }

        /* Hover effect only when hovering over opaque pixels (controlled by JS) */
        @media (pointer: fine) {
          .shop-grid[data-view-mode='grid'] .product-tile .product-box.hover-opaque {
            transform: translateZ(0) scale(1.05);
          }
        }

        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .product-tile {
          text-decoration: none;
          color: inherit;
          outline: none;
          transition: transform 120ms cubic-bezier(0.2, 0.9, 0.3, 1);
          will-change: transform;
          transform: translateZ(0);
        }
        .product-tile:focus-visible .product-box {
          box-shadow:
            0 0 0 2px #000,
            0 1px 6px rgba(0, 0, 0, 0.08);
        }
        .product-meta {
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-top: 8px;
          text-align: center;
        }
        .product-price {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          opacity: 0.55;
          margin-top: 2px;
        }
      `}</style>
    </div>
  )
}
