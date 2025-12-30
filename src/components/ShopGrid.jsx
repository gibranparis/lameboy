// @ts-check
'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProductOverlay from '@/components/ProductOverlay'
import { PRODUCTS, logMissingAssets } from '@/lib/products'

/** Storage key for saved grid density */
const KEY_DENSITY = 'lb:grid-cols'
const MIN_COLS = 1
const MAX_COLS = 5

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

  /* ---------------- Overlay state ---------------- */
  const [overlayIdx, setOverlayIdx] = useState(/** @type {number|null} */ null)
  const overlayOpen = overlayIdx != null
  const open = useCallback((i) => setOverlayIdx(i), [])
  const close = useCallback(() => setOverlayIdx(null), [])

  // Auto-open first product on mount (slight delay to allow layout)
  useEffect(() => {
    if (autoOpenFirstOnMount && seed.length) {
      const t = setTimeout(() => setOverlayIdx(0), 80)
      return () => clearTimeout(t)
    }
  }, [autoOpenFirstOnMount, seed.length])

  /* ---------------- Grid density via orb ---------------- */

  const [cols, setCols] = useState(() => clampCols(readSavedCols()))
  const prevColsRef = useRef(cols)

  const broadcastDensity = useCallback((density) => {
    const detail = { density, value: density }
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
    syncCssTokens(clamped)

    try {
      sessionStorage.setItem(KEY_DENSITY, String(clamped))
    } catch {}

    // On first run, still broadcast once so header orb knows initial density
    const isFirst = prevColsRef.current === clamped
    broadcastDensity(clamped)

    // Bump animation only when value actually changes
    if (!isFirst) {
      try {
        const root = document.documentElement
        root.style.setProperty('--grid-anim', '1')
        const t = setTimeout(() => {
          root.style.removeProperty('--grid-anim')
        }, 280)
        return () => clearTimeout(t)
      } catch {
        /* ignore */
      }
    }

    prevColsRef.current = clamped
  }, [cols, broadcastDensity, syncCssTokens])

  // Listen for zoom/density events from the orb/header
  useEffect(() => {
    const onZoom = (e) => {
      // If overlay is open, close it first (keeps the “single page” interaction clean)
      if (overlayIdx != null) {
        setOverlayIdx(null)
        return
      }

      const d = e?.detail || {}

      // If an explicit value is provided, prefer it (direct set)
      const explicit = Number(d.value)
      if (Number.isFinite(explicit)) {
        setCols(clampCols(explicit))
        return
      }

      const step = Math.max(1, Math.min(3, Number(d.step) || 1))
      const dir = typeof d.dir === 'string' ? d.dir : null

      if (dir === 'in') {
        setCols((p) => clampCols(p - step))
        return
      }
      if (dir === 'out') {
        setCols((p) => clampCols(p + step))
        return
      }

      // Toggle one step by default
      setCols((p) => {
        const goingIn = p > MIN_COLS
        return clampCols(goingIn ? p - 1 : p + 1)
      })
    }

    const names = ['lb:zoom', 'lb:zoom/grid-density']
    names.forEach((n) => {
      window.addEventListener(n, onZoom)
      document.addEventListener(n, onZoom)
    })
    return () => {
      names.forEach((n) => {
        window.removeEventListener(n, onZoom)
        document.removeEventListener(n, onZoom)
      })
    }
  }, [overlayIdx])

  /* ---------------- Signal “shop ready” (redundant safety) ---------------- */
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

  /* ---------------- Render ---------------- */
  const firstTileRef = useRef(null)

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
      <div className="shop-grid">
        {seed.map((p, idx) => (
          <a
            key={p.id ?? idx}
            ref={idx === 0 ? firstTileRef : undefined}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            aria-label={`Open ${p.title ?? 'product'} details`}
            onClick={(e) => {
              e.preventDefault()
              open(idx)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open(idx)
              }
            }}
          >
            <div className="product-box">
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
                  // two-step fallback: thumb -> image -> brown.png
                  if (img.dataset.fallback === 'hero') {
                    img.src = '/products/brown.png'
                    img.dataset.fallback = 'final'
                  } else if (!img.dataset.fallback) {
                    img.src = p.image
                    img.dataset.fallback = 'hero'
                  }
                }}
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {overlayOpen && (
        <ProductOverlay
          products={seed}
          index={overlayIdx}
          onIndexChange={(i) => setOverlayIdx(((i % seed.length) + seed.length) % seed.length)}
          onClose={close}
        />
      )}

      <style jsx>{`
        .shop-wrap {
          width: 100%;
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(var(--grid-cols, 5), minmax(0, 1fr));
          gap: clamp(10px, 2vw, 18px);
          padding: clamp(10px, 3vw, 24px);
        }
        .product-box {
          aspect-ratio: 1 / 1;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
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
      `}</style>
    </div>
  )
}
