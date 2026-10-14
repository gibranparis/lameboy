// src/components/OrbRain.jsx
// @ts-check
'use client'

import { useEffect, useRef } from 'react'

// The splash → shop transition: once "Let All Mankind Evolve" is up, orb
// crosses pour down over the whole page like raindrops (flat, outlined and
// smiling, after Takashi Murakami's flowers), bounce where they land and pile
// up until the screen is covered (the shop swaps in underneath), then drop
// away off the bottom to reveal the grid.
export const RAIN_DELAY_MS = 450 // after the proceed text shows
export const RAIN_COVER_MS = 1700 // from the first drop to a covered screen
const RAIN_CLEAR_MS = 900 // the drop-away

// Poppy flat colours; each cross gets its own mix
const POP = ['#ff4fa3', '#ffd400', '#33b6ff', '#3ccf4e', '#8b5cf6', '#ff7a00', '#ff2d55', '#00d1c1']
const INK = '#111'
const VARIANTS = 8

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * One cartoon orb cross: five flat balls with a thick ink outline and a
 * white shine, the centre one wearing a smiley face. Drawn once per variant
 * and stamped for every falling orb.
 */
function crossSprite(px, seed) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')
  if (!g) return c
  const r = px * 0.165 // ball radius
  const arm = px * 0.3 // centre to arm ball
  const mid = px / 2
  const line = Math.max(2, px * 0.028)
  const pick = (k) => POP[(seed * 3 + k * 5) % POP.length]
  const balls = [
    [0, -arm, pick(1)],
    [arm, 0, pick(2)],
    [0, arm, pick(3)],
    [-arm, 0, pick(4)],
    [0, 0, pick(0)], // centre last, on top
  ]
  for (const [dx, dy, fill] of balls) {
    const x = mid + dx
    const y = mid + dy
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = fill
    g.fill()
    g.lineWidth = line
    g.strokeStyle = INK
    g.stroke()
    // flat cartoon shine
    g.beginPath()
    g.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2)
    g.fillStyle = 'rgba(255,255,255,0.92)'
    g.fill()
  }
  // the smiley on the centre ball
  const ex = r * 0.32
  const ey = -r * 0.1
  g.fillStyle = INK
  for (const s of [-1, 1]) {
    g.beginPath()
    g.ellipse(mid + s * ex, mid + ey, r * 0.09, r * 0.15, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.beginPath()
  g.arc(mid, mid + r * 0.08, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI)
  g.lineWidth = line * 0.9
  g.lineCap = 'round'
  g.strokeStyle = INK
  g.stroke()
  g.fillStyle = 'rgba(255,90,140,0.55)'
  for (const s of [-1, 1]) {
    g.beginPath()
    g.ellipse(mid + s * r * 0.58, mid + r * 0.22, r * 0.14, r * 0.09, 0, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

/**
 * Full-screen orb rain. Mount it when the transition starts; it plays once
 * and calls onDone when the last orb has left the screen.
 * @param {{ onDone?: () => void }} props
 */
export default function OrbRain({ onDone }) {
  const ref = useRef(/** @type {HTMLCanvasElement | null} */ (null))
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reducedMotion()) {
      doneRef.current?.()
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = window.innerWidth
    const H = window.innerHeight
    // 1.5× is plenty for flat cartoon shapes and keeps the fill rate down
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    // Orbs that have settled are painted once onto this layer, so each frame
    // only redraws the ones still moving
    const pile = document.createElement('canvas')
    pile.width = canvas.width
    pile.height = canvas.height
    const pctx = pile.getContext('2d')
    if (!pctx) return

    // Base size scales with the screen; each drop is 0.65–1.4× that. Landing
    // spots tile the page (jittered) so the pile covers it completely.
    const base = Math.max(70, Math.min(124, Math.min(W, H) / 4.4))
    const spritePx = Math.round(base * 1.4 * dpr)
    const sprites = Array.from({ length: VARIANTS }, (_, i) => crossSprite(spritePx, i))
    const step = base * 0.42
    const orbs = []
    for (let y = -step / 2; y < H + step; y += step) {
      for (let x = -step / 2; x < W + step; x += step) {
        const size = base * (0.65 + Math.random() * 0.75)
        orbs.push({
          x: x + (Math.random() - 0.5) * step,
          restY: y + (Math.random() - 0.5) * step,
          y: -size - Math.random() * H * 0.35,
          vx: (Math.random() - 0.5) * 40,
          vy: 200 + Math.random() * 300,
          size,
          sprite: sprites[Math.floor(Math.random() * VARIANTS)],
          // they pour in all over, the bottom of the pile a touch first
          start: Math.random() * RAIN_COVER_MS * 0.45 + (1 - y / H) * 120,
          rot: (Math.random() - 0.5) * 0.9,
          spin: (Math.random() - 0.5) * 3,
          squash: 0,
          drop: 0, // the moment it starts falling away (ms)
          settled: false,
        })
      }
    }
    // Later drops land on top of earlier ones
    orbs.sort((a, b) => a.start - b.start)

    const G = 6500 // px/s²
    const BOUNCE = 0.45
    let raf = 0
    let last = performance.now()
    const t0 = last
    const clearAt = RAIN_COVER_MS
    let pileDirty = false
    let pileAt = 0

    /** Draw one orb (squash/stretch while moving) onto a context. */
    const paint = (g, o) => {
      const s = o.size
      const stretch = Math.min(0.22, Math.max(0, o.vy) / 9000)
      const sx = 1 - stretch * 0.5 + o.squash * 0.28
      const sy = 1 + stretch - o.squash * 0.28
      const c = Math.cos(o.rot)
      const n = Math.sin(o.rot)
      // translate → scale → rotate, as one matrix
      g.setTransform(dpr * sx * c, dpr * sy * n, -dpr * sx * n, dpr * sy * c, dpr * o.x, dpr * (o.y + o.squash * s * 0.1))
      g.drawImage(o.sprite, -s / 2, -s / 2, s, s)
    }
    const rebuildPile = () => {
      pctx.setTransform(1, 0, 0, 1, 0, 0)
      pctx.clearRect(0, 0, pile.width, pile.height)
      for (const o of orbs) if (o.settled) paint(pctx, o)
      pileDirty = false
    }

    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const t = now - t0
      let onScreen = 0
      const moving = []
      for (const o of orbs) {
        if (t < o.start) {
          onScreen++
          continue
        }
        if (t >= clearAt && !o.drop) o.drop = clearAt + (1 - o.restY / H) * 220 + Math.random() * 260
        const falling = o.drop && t >= o.drop
        if (o.settled) {
          if (!falling) {
            onScreen++
            continue
          }
          // the floor gives way: off the pile and moving again
          o.settled = false
          pileDirty = true
        }
        o.vy += G * dt
        o.y += o.vy * dt
        o.x += o.vx * dt
        o.rot += o.spin * dt
        o.squash *= Math.pow(0.0005, dt) // springs back quickly
        if (!falling && o.y >= o.restY) {
          // splat and bounce where it lands, a little less each time
          o.squash = Math.min(1, o.vy / 1800)
          o.y = o.restY
          o.vy = Math.abs(o.vy) < 160 ? 0 : -o.vy * BOUNCE
          o.vx *= 0.5
          o.spin *= 0.5
          if (o.vy === 0) {
            // at rest: onto the pile layer for good
            o.squash = 0
            o.spin = 0
            o.settled = true
            paint(pctx, o)
            onScreen++
            continue
          }
        }
        if (o.y - o.size / 2 > H) continue
        onScreen++
        moving.push(o)
      }
      if (pileDirty && now - pileAt > 80) {
        rebuildPile()
        pileAt = now
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(pile, 0, 0)
      for (const o of moving) paint(ctx, o)
      if (t > clearAt && onScreen === 0) {
        doneRef.current?.()
        return
      }
      if (t > clearAt + RAIN_CLEAR_MS + 1200) {
        doneRef.current?.()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483000,
        pointerEvents: 'none',
      }}
    />
  )
}
