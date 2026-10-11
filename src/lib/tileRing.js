// src/lib/tileRing.js
'use client'

// Grab a hoodie in the grid and the others leave their spots and orbit it in
// a ring around it, like the orb's balls around a dragged orb. The ring rolls
// with the drag like a wheel: dragged right it spins clockwise, dragged left
// counter-clockwise, as fast as it's dragged, and it keeps its momentum when
// the drag slows, winding down with friction. A rainbow glow lights the
// grabbed hoodie when it's really going. Let go (a flick) and they bounce
// back into their spots.
//
// Driven from dragSnap's onDragMove / onDrop on the grabbed tile. The others
// are moved with the CSS translate / scale / rotate properties (dragSnap's
// own, for tiles parked earlier), so each one's styles are saved when the
// ring forms and put back exactly once it has landed home.

const ROLL = 1.5 // spin = drag speed / ring radius × this (a wheel rolling with the drag)
const MAX_SPIN = 26 // rad/s
const GRIP = 9 // 1/s: how quickly the drag gets the ring up to its speed
const FRICTION = 1.4 // s: how long the momentum takes to wind down once the drag stops
const IDLE_SPIN = 0.5 // rad/s: it never quite stops while held
const RING_SCALE = 0.6 // hoodies shrink to fit the ring
const GAP = 8 // px between the grabbed hoodie and the ring
const ENTER_S = 0.32 // s to fly out of their spots onto the ring
const CENTRE_K = 260 // the ring's middle trails the grabbed hoodie a touch
const CENTRE_C = 26
const HOME_K = 240 // they bounce home when it's let go
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

const ease = (/** @type {number} */ t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

export function createTileRing() {
  /** @type {HTMLElement | null} */
  let grabbed = null
  let held = false
  let vx = 0 // smoothed drag velocity, px/s
  let vy = 0
  let spin = 0 // rad/s, + clockwise on screen
  let phase = 0 // the ring's turn, rad
  let vivid = 0 // 0–1 rainbow glow on the grabbed hoodie
  let enter = 0 // 0–1 out of their spots onto the ring
  let cx = 0 // the ring's middle, trailing the grabbed hoodie
  let cy = 0
  let cvx = 0
  let cvy = 0
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let raf = 0
  let lastTick = 0
  /**
   * The hoodies in the ring: where they are (x, y offset from their own
   * spot), how fast, their size, where they started, and their own styles
   * to put back
   * @type {Map<HTMLElement, { x: number, y: number, vx: number, vy: number, s: number, vs: number, from: { x: number, y: number, s: number }, home: { x: number, y: number }, unit: number, saved: Record<string, [string, string]> }>}
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
    vx = vy = spin = vivid = enter = 0
  }

  const tick = (/** @type {number} */ now) => {
    raf = 0
    const dt = Math.min(0.05, (now - lastTick) / 1000)
    lastTick = now
    if (dt <= 0) return void (raf = requestAnimationFrame(tick))
    // Folded into the stacks (or gone): put everything back
    if (!grabbed || !grabbed.isConnected || !grabbed.closest("[data-view-mode='grid']")) return stop()

    const g = boxOf(grabbed).getBoundingClientRect()
    const gx = g.left + g.width / 2
    const gy = g.top + g.height / 2
    const n = ring.size
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Ring size: clear of the grabbed hoodie, room for them all, on screen
    const unit = ring.values().next().value?.unit || g.width
    let s = RING_SCALE
    const radius = (/** @type {number} */ sc) =>
      Math.max(g.width * 0.71 + unit * sc * 0.71 + GAP, (n * unit * sc * 1.1) / (2 * Math.PI))
    let R = radius(s)
    const maxR = Math.min(vw, vh) * 0.46
    if (R + (unit * s) / 2 > maxR) {
      s *= Math.max(0.35, maxR / (R + (unit * s) / 2))
      R = Math.min(radius(s), maxR - (unit * s) / 2)
    }

    if (held) {
      // The drag stopped: its speed fades (the ring keeps what it has)
      if (now - lastT > 90) {
        const f = Math.exp(-dt * 8)
        vx *= f
        vy *= f
      }
      // Rolls with the drag like a wheel: right = clockwise, left = counter-clockwise
      const drive = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, (ROLL * vx) / R))
      const dragging = Math.abs(vx) > 40
      // Dragged faster than it's turning (or the other way): it grips and follows
      if (dragging && (Math.sign(drive) !== Math.sign(spin) || Math.abs(drive) > Math.abs(spin))) {
        spin += (drive - spin) * Math.min(1, dt * GRIP)
      }
      else {
        // Momentum: coasts on, slowing with friction, down to a lazy turn
        const idle = (spin >= 0 ? 1 : -1) * IDLE_SPIN
        spin = idle + (spin - idle) * Math.exp(-dt / FRICTION)
      }
      const fast = Math.min(1, Math.max(0, (Math.abs(spin) - 4) / 10))
      vivid += (fast - vivid) * Math.min(1, dt * 6)
      enter = Math.min(1, enter + dt / ENTER_S)
      // The ring's middle trails the grabbed hoodie a touch (a little swing)
      cvx += (CENTRE_K * (gx - cx) - CENTRE_C * cvx) * dt
      cvy += (CENTRE_K * (gy - cy) - CENTRE_C * cvy) * dt
      cx += cvx * dt
      cy += cvy * dt
    } else {
      vivid *= Math.exp(-dt / 0.6)
    }
    phase += spin * dt

    let moving = held
    let k = 0
    for (const [el, r] of ring) {
      const b = boxOf(el).getBoundingClientRect()
      // Its own spot: where it's drawn, less where we've moved it
      const hx = b.left + b.width / 2 - r.x
      const hy = b.top + b.height / 2 - r.y
      if (held) {
        // Exactly on the ring (no corner-cutting into the middle), flying
        // out of its spot as the ring forms
        const a = phase + (k / n) * Math.PI * 2
        const e = ease(enter)
        const tx = cx + R * Math.cos(a) - hx
        const ty = cy + R * Math.sin(a) - hy
        const nx = r.from.x + (tx - r.from.x) * e
        const ny = r.from.y + (ty - r.from.y) * e
        r.vx = (nx - r.x) / dt
        r.vy = (ny - r.y) / dt
        r.x = nx
        r.y = ny
        r.s = r.from.s + (s - r.from.s) * e
        r.vs = 0
      } else {
        // Let go: a spring back into its spot, carrying the ring's swing
        r.vx += (HOME_K * (r.home.x - r.x) - HOME_C * r.vx) * dt
        r.vy += (HOME_K * (r.home.y - r.y) - HOME_C * r.vy) * dt
        r.vs += (HOME_K * (1 - r.s) - HOME_C * r.vs) * dt
        r.x += r.vx * dt
        r.y += r.vy * dt
        r.s += r.vs * dt
        const near =
          Math.abs(r.home.x - r.x) < 0.5 && Math.abs(r.home.y - r.y) < 0.5 &&
          Math.abs(r.vx) + Math.abs(r.vy) < 8 && Math.abs(1 - r.s) < 0.005
        if (near) {
          restore(el)
          continue
        }
        moving = true
      }
      el.style.translate = `${r.x.toFixed(2)}px ${r.y.toFixed(2)}px`
      el.style.scale = r.s.toFixed(4)
      // Leans into the way it's flying
      el.style.rotate = `${Math.max(-24, Math.min(24, r.vx * 0.012)).toFixed(2)}deg`
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
    const g = boxOf(tile).getBoundingClientRect()
    cx = g.left + g.width / 2
    cy = g.top + g.height / 2
    cvx = cvy = 0
    enter = 0
    const tiles = /** @type {HTMLElement[]} */ ([...grid.querySelectorAll('.product-tile')]).filter((el) => el !== tile)
    // Start the ring with each hoodie on the side of it it's already on
    // (in grid order round the ring), so none has to cross the middle
    tiles.forEach((el) => {
      const prev = ring.get(el)
      if (!prev) {
        /** @type {Record<string, [string, string]>} */
        const saved = {}
        for (const p of SAVED) saved[p] = [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]
        const home = offsetOf(el) // a hoodie parked earlier goes back to where it was parked
        const s0 = parseFloat(el.style.scale) || 1
        ring.set(el, { x: home.x, y: home.y, vx: 0, vy: 0, s: s0, vs: 0, from: { x: home.x, y: home.y, s: s0 }, home, saved, unit: boxOf(el).offsetWidth })
        el.style.transition = 'none'
        // Turn and size about the hoodie's middle
        const t = el.getBoundingClientRect()
        const bx = boxOf(el).getBoundingClientRect()
        el.style.transformOrigin = `${bx.left + bx.width / 2 - t.left}px ${bx.top + bx.height / 2 - t.top}px`
      } else {
        // Still bouncing home from the last ring: it sets off from where it is
        prev.from = { x: prev.x, y: prev.y, s: prev.s }
      }
    })
    if (!ring.size) return false
    // Order the ring by where each one sits around the grabbed hoodie, and
    // turn the ring so each starts on its own side
    const angleOf = (/** @type {HTMLElement} */ el) => {
      const b = boxOf(el).getBoundingClientRect()
      return Math.atan2(b.top + b.height / 2 - cy, b.left + b.width / 2 - cx)
    }
    const sorted = [...ring.keys()].map((el) => [el, angleOf(el)]).sort((a, b) => /** @type {number} */ (a[1]) - /** @type {number} */ (b[1]))
    const entries = sorted.map(([el]) => [el, ring.get(/** @type {HTMLElement} */ (el))])
    ring.clear()
    for (const [el, r] of entries) ring.set(/** @type {HTMLElement} */ (el), /** @type {any} */ (r))
    phase = /** @type {number} */ (sorted[0][1])
    return true
  }

  return {
    /** A drag moved a grid hoodie (dragSnap onDragMove) */
    move(/** @type {HTMLElement} */ tile, /** @type {number} */ x, /** @type {number} */ y) {
      if (reducedMotion()) return
      const now = performance.now()
      if (!held || grabbed !== tile) {
        if (!form(tile)) return
        held = true
        vx = vy = 0
        spin = 0
        lastX = x
        lastY = y
        lastT = now
        run()
        return
      }
      const dtm = Math.max(4, now - lastT)
      const ivx = ((x - lastX) / dtm) * 1000
      const ivy = ((y - lastY) / dtm) * 1000
      // Smoothed, but quick to follow
      vx = vx * 0.4 + ivx * 0.6
      vy = vy * 0.4 + ivy * 0.6
      lastX = x
      lastY = y
      lastT = now
    },
    /** Let go (dragSnap onDrop): the ring bounces back into its spots */
    release(/** @type {HTMLElement} */ tile) {
      if (tile !== grabbed || !held) return
      held = false
      vx = vy = 0
      run()
    },
    /** Stop and put every hoodie back in its spot at once */
    stop,
  }
}
