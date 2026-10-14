// src/components/OrbRain.jsx
// @ts-check
'use client'

import { useEffect, useRef } from 'react'

// The splash → shop transition: once "Let All Mankind Evolve" is up, orb
// crosses rain down over the whole page, bounce where they land until the
// screen is covered (the shop swaps in underneath), then drop away off the
// bottom to reveal the grid.
export const RAIN_DELAY_MS = 450 // after the proceed text shows
export const RAIN_COVER_MS = 1700 // from the first drop to a covered screen
const RAIN_CLEAR_MS = 900 // the drop-away

// The orb cross's balls: centre, then top/right/bottom/left
const CROSS = ['#e05500', '#ffd400', '#0066ff', '#00a832', '#6d5cff']

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** One glossy orb cross, drawn once and stamped for every falling orb. */
function crossSprite(px) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')
  if (!g) return c
  const r = px * 0.17 // ball radius
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
    const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.28, CROSS[i])
    grad.addColorStop(1, shade(CROSS[i], -0.35))
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = grad
    g.fill()
  }
  return c
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + v * amt)))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
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
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.scale(dpr, dpr)

    // Orb size scales with the screen; landing spots tile it (jittered) so
    // the orbs end up covering the whole page
    const size = Math.max(72, Math.min(130, Math.min(W, H) / 4.2))
    const step = size * 0.6
    const sprite = crossSprite(Math.round(size * dpr))
    const orbs = []
    const cols = Math.ceil(W / step) + 1
    const rows = Math.ceil(H / step) + 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const restY = r * step + (Math.random() - 0.5) * step * 0.5
        orbs.push({
          x: c * step + (r % 2 ? step / 2 : 0) + (Math.random() - 0.5) * step * 0.4,
          restY,
          y: -size - Math.random() * H * 0.3,
          vy: 0,
          // lower rows land first so the pile builds up the screen
          start: (1 - r / rows) * RAIN_COVER_MS * 0.35 + Math.random() * 120,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 6,
          landed: false,
          drop: 0, // the moment it starts falling away (ms)
        })
      }
    }
    // Back rows first, so later (higher) orbs draw on top
    orbs.sort((a, b) => a.restY - b.restY)

    const G = 6500 // px/s²
    const BOUNCE = 0.42
    let raf = 0
    let last = performance.now()
    const t0 = last
    const clearAt = RAIN_COVER_MS
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const t = now - t0
      ctx.clearRect(0, 0, W, H)
      let onScreen = 0
      for (const o of orbs) {
        if (t < o.start) {
          onScreen++
          continue
        }
        if (t >= clearAt && !o.drop) o.drop = clearAt + (o.restY / H) * 260 + Math.random() * 220
        const falling = o.drop && t >= o.drop
        o.vy += G * dt
        o.y += o.vy * dt
        o.rot += o.spin * dt
        if (!falling && o.y >= o.restY) {
          // bounce on the glass where it lands, settling a little each time
          o.y = o.restY
          o.vy = Math.abs(o.vy) < 140 ? 0 : -o.vy * BOUNCE
          o.spin *= 0.6
          o.landed = true
        }
        if (o.y - size / 2 > H) continue
        onScreen++
        ctx.save()
        ctx.translate(o.x, o.y)
        ctx.rotate(o.rot)
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size)
        ctx.restore()
      }
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
