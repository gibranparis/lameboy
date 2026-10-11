// src/lib/tileRing.js
'use client'

// Grab a hoodie in the grid and the others leave their spots and orbit it in
// a ring, like the orb's balls around a dragged orb. The ring spins the way
// it's dragged (right or left), faster the faster it's dragged, with a
// rainbow glow on the grabbed one when it's really going. Let go (a flick)
// and they bounce back into their spots.
//
// Driven from dragSnap's onDragMove / onDrop on the grabbed tile. The others
// are moved with the CSS translate / scale / rotate properties (dragSnap's
// own, for tiles parked earlier), so each one's styles are saved when the
// ring forms and put back exactly once it has landed home.

const BASE_SPIN = 1.1 // rad/s, the ring's lazy turn while held still
const MAX_SPIN = 9 // rad/s
const PER_PX = 0.006 // rad/s of extra spin per px/s of drag
const TILT = 0.55 // ring squashed this much top to bottom, so it reads as a tilted ring
const RING_SCALE = 0.62 // hoodies shrink to fit the ring (front ones a bit bigger)
const CHASE_K = 170 // they chase their spot on the moving ring...
const CHASE_C = 19
const HOME_K = 240 // ...and bounce home when it's let go
const HOME_C = 15

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** The px offset in an element's inline `translate` ({0, 0} when none) */
const offsetOf = (/** @type {HTMLElement} */ el) => {
  const t = el.style.translate
  const [x = 0, y = 0] = t && t !== 'none' ? t.split(/\s+/).map((v) => parseFloat(v) || 0) : []
  return { x, y }
}

/** A tile's hoodie (the square card, not the name under it) */
const boxOf = (/** @type {HTMLElement} */ tile) => /** @type {HTMLElement} */ (tile.querySelector('.product-box') || tile)

export function createTileRing() {
  /** @type {HTMLElement | null} */
  let grabbed = null
  let held = false
  let speed = 0 // smoothed drag speed, px/s
  let dir = 1 // +1 dragged right, -1 dragged left
  let spin = BASE_SPIN // rad/s
  let phase = 0 // the ring's turn, rad
  let vivid = 0 // 0–1 rainbow glow on the grabbed hoodie
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let raf = 0
  let lastTick = 0
  /**
   * The hoodies in the ring: where they are (x, y offset from their own
   * spot), how fast, their size, and their own styles to put back
   * @type {Map<HTMLElement, { x: number, y: number, vx: number, vy: number, s: number, vs: number, home: { x: number, y: number }, saved: Record<string, [string, string]> }>}
   */
  const ring = new Map()

  const SAVED = ['translate', 'scale', 'rotate', 'z-index', 'transition', 'transform-origin']

  /** Put one hoodie's own styles back, as they were before the ring */
  const restore = (/** @type {HTMLElement} */ el) => {
    const r = ring.get(el)
    if (!r) return
    for (const p of SAVED) el.style.setProperty(p, r.saved[p][0], r.saved[p][1])
    ring.delete(el)
  }

  const clearGlow = () => {
    if (grabbed) boxOf(grabbed).style.filter = ''
  }

  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    for (const el of [...ring.keys()]) restore(el)
    clearGlow()
    grabbed = null
    held = false
    speed = vivid = 0
    spin = BASE_SPIN
  }

  const tick = (/** @type {number} */ now) => {
    raf = 0
    const dt = Math.min(0.05, (now - lastTick) / 1000)
    lastTick = now
    // Folded into the stacks (or gone): put everything back
    if (!grabbed || !grabbed.isConnected || !grabbed.closest("[data-view-mode='grid']")) return stop()

    if (held) {
      if (now - lastT > 120) speed *= Math.exp(-dt * 5)
      // Turning the drag around swings the ring through still and back the other way
      const want = dir * (BASE_SPIN + Math.min(MAX_SPIN - BASE_SPIN, speed * PER_PX))
      spin += (want - spin) * Math.min(1, dt * 6)
      vivid += (Math.min(1, Math.max(0, (speed - 300) / 1400)) - vivid) * Math.min(1, dt * 6)
    } else {
      vivid *= Math.exp(-dt / 0.6)
    }
    phase += spin * dt

    const g = boxOf(grabbed).getBoundingClientRect()
    const cx = g.left + g.width / 2
    const cy = g.top + g.height / 2
    const n = ring.size
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Wide enough to clear the grabbed hoodie and fit them all, small enough to stay on screen
    const R = Math.min(Math.max(g.width * 1.2, (n * g.width * RING_SCALE) / (2 * Math.PI * TILT) * 1.1), Math.min(vw, vh / TILT) * 0.42)

    let moving = held
    let k = 0
    for (const [el, r] of ring) {
      const b = boxOf(el).getBoundingClientRect()
      // Its own spot: where it's drawn, less where we've moved it
      const hx = b.left + b.width / 2 - r.x
      const hy = b.top + b.height / 2 - r.y
      let tx = r.home.x
      let ty = r.home.y
      let ts = 1
      let depth = 0
      if (held) {
        const a = phase + (k / n) * Math.PI * 2
        depth = Math.sin(a) // + in front, − behind
        tx = cx + R * Math.cos(a) - hx
        ty = cy + R * TILT * depth - hy
        ts = RING_SCALE * (0.8 + 0.25 * depth)
      }
      const K = held ? CHASE_K : HOME_K
      const C = held ? CHASE_C : HOME_C
      r.vx += (K * (tx - r.x) - C * r.vx) * dt
      r.vy += (K * (ty - r.y) - C * r.vy) * dt
      r.vs += (K * (ts - r.s) - C * r.vs) * dt
      r.x += r.vx * dt
      r.y += r.vy * dt
      r.s += r.vs * dt
      if (!held) {
        const near = Math.abs(tx - r.x) < 0.5 && Math.abs(ty - r.y) < 0.5 && Math.abs(r.vx) + Math.abs(r.vy) < 8 && Math.abs(ts - r.s) < 0.005
        if (near) {
          restore(el)
          continue
        }
        moving = true
      }
      el.style.translate = `${r.x.toFixed(2)}px ${r.y.toFixed(2)}px`
      el.style.scale = r.s.toFixed(4)
      // Leans into the way it's flying
      el.style.rotate = `${Math.max(-28, Math.min(28, r.vx * 0.03)).toFixed(2)}deg`
      // Front of the ring over the back (all under the grabbed one)
      if (held) el.style.setProperty('z-index', String(60 + Math.round(depth * 10)), 'important')
      k++
    }

    boxOf(grabbed).style.filter =
      vivid > 0.01
        ? `drop-shadow(0 0 ${(4 + vivid * 18).toFixed(1)}px hsl(${((now / 4) % 360).toFixed(0)} 100% 60% / ${(vivid * 0.9).toFixed(2)}))`
        : ''

    if (!moving && !ring.size && vivid <= 0.01) return stop()
    raf = requestAnimationFrame(tick)
  }

  const run = () => {
    if (raf) return
    lastTick = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /** The ring forms around `tile`: every other hoodie in the grid joins it */
  const form = (/** @type {HTMLElement} */ tile) => {
    const grid = tile.closest("[data-view-mode='grid']")
    if (!grid) return false
    // Grabbing one that's still bouncing home: it's dragSnap's again
    restore(tile)
    if (grabbed && grabbed !== tile) clearGlow()
    grabbed = tile
    for (const node of grid.querySelectorAll('.product-tile')) {
      const el = /** @type {HTMLElement} */ (node)
      if (el === tile || ring.has(el)) continue
      /** @type {Record<string, [string, string]>} */
      const saved = {}
      for (const p of SAVED) saved[p] = [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]
      const home = offsetOf(el) // a hoodie parked earlier goes back to where it was parked
      const s = parseFloat(el.style.scale) || 1
      ring.set(el, { x: home.x, y: home.y, vx: 0, vy: 0, s, vs: 0, home, saved })
      el.style.transition = 'none'
      // Turn and size about the hoodie's middle
      const t = el.getBoundingClientRect()
      const bx = boxOf(el).getBoundingClientRect()
      el.style.transformOrigin = `${bx.left + bx.width / 2 - t.left}px ${bx.top + bx.height / 2 - t.top}px`
    }
    return ring.size > 0
  }

  return {
    /** A drag moved a grid hoodie (dragSnap onDragMove) */
    move(/** @type {HTMLElement} */ tile, /** @type {number} */ x, /** @type {number} */ y) {
      if (reducedMotion()) return
      const now = performance.now()
      if (!held || grabbed !== tile) {
        if (!form(tile)) return
        held = true
        speed = 0
        spin = dir * BASE_SPIN
        lastX = x
        lastY = y
        lastT = now
        run()
        return
      }
      const dx = x - lastX
      const v = (Math.hypot(dx, y - lastY) / Math.max(4, now - lastT)) * 1000
      // Spins the way it's dragged (a straight up/down drag keeps the last way)
      if (Math.abs(dx) > 1.5) dir = Math.sign(dx)
      // Quick to wind up, slower to let go
      speed = v > speed ? speed * 0.3 + v * 0.7 : speed * 0.75 + v * 0.25
      lastX = x
      lastY = y
      lastT = now
    },
    /** Let go (dragSnap onDrop): the ring bounces back into its spots */
    release(/** @type {HTMLElement} */ tile) {
      if (tile !== grabbed || !held) return
      held = false
      speed = 0
      run()
    },
    /** Stop and put every hoodie back in its spot at once */
    stop,
  }
}
