// src/components/OrbRain.jsx
// @ts-check
'use client'

import { useEffect, useRef } from 'react'

// The splash → shop transition: once "Let All Mankind Evolve" is up, orb
// crosses (the orb shell's own glossy form, each in one of its colours) float
// down over the whole page, bounce lightly where they land and settle until
// the screen is covered (the shop swaps in underneath), then drift away off
// the bottom to reveal the grid.
export const RAIN_DELAY_MS = 450 // after the proceed text shows
export const RAIN_COVER_MS = 2100 // from the first drop to a covered screen
const RAIN_CLEAR_MS = 900 // the drop-away

// The orb's colour forms (see OrbShell): each cross is one solid chakra
// colour, or the full rainbow cross
const FORMS = [
  ['#cc0014'], // root
  ['#e05500'], // sacral
  ['#ffd400'], // solar
  ['#00a832'], // heart
  ['#0066ff'], // throat
  ['#6d5cff'], // third eye
  ['#c86bff'], // crown
  ['#32ffc7'], // seafoam
  ['#e05500', '#ffd400', '#0066ff', '#00a832', '#6d5cff'], // rainbow
]

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v : 255 - v) * amt)))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

/**
 * One orb cross in the orb shell's form: five glossy balls (centre plus four
 * arms) lit from the top left. Drawn once per colour form and stamped for
 * every falling orb.
 */
function crossSprite(px, colors) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')
  if (!g) return c
  const r = px * 0.16 // ball radius
  const arm = px * 0.31 // centre to arm ball
  const mid = px / 2
  const at = [
    [0, 0],
    [0, -arm],
    [arm, 0],
    [0, arm],
    [-arm, 0],
  ]
  // arms first so the centre ball sits on top
  for (const i of [1, 2, 3, 4, 0]) {
    const x = mid + at[i][0]
    const y = mid + at[i][1]
    const col = colors[i % colors.length]
    const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.22, shade(col, 0.35))
    grad.addColorStop(0.6, col)
    grad.addColorStop(1, shade(col, -0.4))
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = grad
    g.fill()
  }
  return c
}

/**
 * Full-screen orb rain. Mount it when the transition starts; it plays once,
 * calls onCovered when the pile covers the page (swap what's underneath
 * then) and onDone when the last orb has left the screen. Its clock runs on
 * animation time, so a slow device just plays it slower, never uncovered.
 * @param {{ onCovered?: () => void, onDone?: () => void }} props
 */
export default function OrbRain({ onCovered, onDone }) {
  const ref = useRef(/** @type {HTMLCanvasElement | null} */ (null))
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const coveredRef = useRef(onCovered)
  coveredRef.current = onCovered

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reducedMotion()) {
      coveredRef.current?.()
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
    const sprites = FORMS.map((f) => crossSprite(spritePx, f))
    const step = base * 0.42
    const orbs = []
    for (let y = -step / 2; y < H + step; y += step) {
      for (let x = -step / 2; x < W + step; x += step) {
        const size = base * (0.65 + Math.random() * 0.75)
        orbs.push({
          x: x + (Math.random() - 0.5) * step,
          restY: y + (Math.random() - 0.5) * step,
          y: -size - Math.random() * H * 0.2,
          vx: (Math.random() - 0.5) * 70,
          vy: 150 + Math.random() * 200,
          size,
          sprite: sprites[Math.floor(Math.random() * sprites.length)],
          // they pour in all over, the bottom of the pile a touch first
          start: Math.random() * RAIN_COVER_MS * 0.3 + (1 - y / H) * 120,
          rot: (Math.random() - 0.5) * 0.9,
          spin: (Math.random() - 0.5) * 1.6,
          sway: Math.random() * Math.PI * 2, // its own phase of side-to-side float
          squash: 0,
          drop: 0, // the moment it starts falling away (ms)
          settled: false,
        })
      }
    }
    // Later drops land on top of earlier ones
    orbs.sort((a, b) => a.start - b.start)

    // Light and airy: gentle gravity, air drag caps the fall speed, and a
    // springy bounce that settles soon after
    const G = 3200 // px/s²
    const DRAG = 2.4 // per second, so terminal speed is G / DRAG
    const BOUNCE = 0.58
    let raf = 0
    let last = performance.now()
    let t = 0 // animation time (ms)
    let covered = false
    const clearAt = RAIN_COVER_MS
    let pileDirty = false
    let pileAt = 0

    /** Draw one orb (squash/stretch while moving) onto a context. */
    const paint = (g, o) => {
      const s = o.size
      const stretch = Math.min(0.08, Math.max(0, o.vy) / 16000)
      const sx = 1 - stretch * 0.5 + o.squash * 0.18
      const sy = 1 + stretch - o.squash * 0.18
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
      t += dt * 1000
      if (!covered && t >= clearAt) {
        covered = true
        coveredRef.current?.()
      }
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
        o.vy += (G - DRAG * o.vy) * dt
        o.y += o.vy * dt
        // a soft side-to-side float while airborne
        o.sway += dt * 5
        o.x += (o.vx + (o.settled ? 0 : Math.sin(o.sway) * 35)) * dt
        o.rot += o.spin * dt
        o.squash *= Math.pow(0.0005, dt) // springs back quickly
        if (!falling && o.y >= o.restY) {
          // land softly and bounce, a little less each time
          o.squash = Math.min(0.6, o.vy / 2600)
          o.y = o.restY
          o.vy = Math.abs(o.vy) < 120 ? 0 : -o.vy * BOUNCE
          o.vx *= 0.4
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
