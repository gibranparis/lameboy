// src/lib/tileRing.js
'use client'

// Grab a hoodie in the grid and a ring of clones of it (a black hoodie gets a
// ring of black hoodies) spins out around it, like the orb's balls around a
// dragged orb. The ring rolls with the drag like a wheel: dragged right it
// spins clockwise, dragged left counter-clockwise, as fast as it's dragged
// (and then some), and it keeps its momentum when the drag slows, winding
// down with friction. A rainbow glow lights the grabbed hoodie when it's
// really going. Let go and the clones fold back into it.
//
// Driven from dragSnap's onDragMove / onDrop on the grabbed tile. The clones
// live in their own fixed layer (just under the lifted, grabbed hoodie);
// nothing else on the page is touched apart from the grabbed hoodie's glow.

const CLONES = 6
const ROLL = 3.2 // spin = drag speed / ring radius × this (a wheel, and then some)
const MAX_SPIN = 40 // rad/s (over 6 turns a second)
const GRIP = 12 // 1/s: how quickly the drag gets the ring up to its speed
const FRICTION = 1.8 // s: how long the momentum takes to wind down once the drag stops
const IDLE_SPIN = 1.6 // rad/s: it never stops while held
const CLONE_SCALE = 0.58 // clone size against the grabbed hoodie
const GAP = 6 // px between the grabbed hoodie and the ring
const ENTER_S = 0.28 // s to spin out of the grabbed hoodie onto the ring
const LEAVE_S = 0.24 // s to fold back into it
const CENTRE_K = 260 // the ring's middle trails the grabbed hoodie a touch
const CENTRE_C = 26
const LAYER_Z = 99999 // under the lifted hoodie (dragSnap's layers start above 100000)

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** A tile's hoodie (the square card, not the name under it) */
const boxOf = (/** @type {HTMLElement} */ tile) => /** @type {HTMLElement} */ (tile.querySelector('.product-box') || tile)

const ease = (/** @type {number} */ t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

export function createTileRing() {
  /** @type {HTMLElement | null} */
  let grabbed = null
  /** @type {HTMLDivElement | null} */
  let layer = null
  /** @type {HTMLElement[]} */
  let clones = []
  let held = false
  let vx = 0 // smoothed drag velocity, px/s
  let spin = 0 // rad/s, + clockwise on screen
  let phase = 0 // the ring's turn, rad
  let vivid = 0 // 0–1 rainbow glow
  let out = 0 // 0–1: folded into the grabbed hoodie → out on the ring
  let cx = 0 // the ring's middle, trailing the grabbed hoodie
  let cy = 0
  let cvx = 0
  let cvy = 0
  let lastX = 0
  let lastT = 0
  let raf = 0
  let lastTick = 0

  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    layer?.remove()
    layer = null
    clones = []
    if (grabbed) boxOf(grabbed).style.filter = ''
    grabbed = null
    held = false
    vx = spin = vivid = out = 0
  }

  const tick = (/** @type {number} */ now) => {
    raf = 0
    const dt = Math.min(0.05, (now - lastTick) / 1000)
    lastTick = now
    if (dt <= 0) return void (raf = requestAnimationFrame(tick))
    // Folded into the stacks (or gone): clear it all away
    if (!grabbed || !layer || !grabbed.isConnected || !grabbed.closest("[data-view-mode='grid']")) return stop()

    const g = boxOf(grabbed).getBoundingClientRect()
    const gx = g.left + g.width / 2
    const gy = g.top + g.height / 2
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Ring size: clear of the grabbed hoodie, room for every clone, on screen
    let size = g.width * CLONE_SCALE
    const radius = (/** @type {number} */ sz) => Math.max(g.width * 0.71 + sz * 0.71 + GAP, (CLONES * sz * 1.05) / (2 * Math.PI))
    let R = radius(size)
    const maxR = Math.min(vw, vh) * 0.47
    if (R + size / 2 > maxR) {
      size *= Math.max(0.4, maxR / (R + size / 2))
      R = Math.min(radius(size), maxR - size / 2)
    }

    if (held) {
      // The drag stopped: its speed fades (the ring keeps what it has)
      if (now - lastT > 80) vx *= Math.exp(-dt * 10)
      // Rolls with the drag like a wheel: right = clockwise, left = counter-clockwise
      const drive = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, (ROLL * vx) / R))
      // Dragged faster than it's turning (or the other way): it grips and follows
      if (Math.abs(vx) > 30 && (Math.sign(drive) !== Math.sign(spin) || Math.abs(drive) > Math.abs(spin))) {
        spin += (drive - spin) * Math.min(1, dt * GRIP)
      } else {
        // Momentum: coasts on, slowing with friction, down to a steady turn
        const idle = (spin >= 0 ? 1 : -1) * IDLE_SPIN
        spin = idle + (spin - idle) * Math.exp(-dt / FRICTION)
      }
      vivid += (Math.min(1, Math.max(0, (Math.abs(spin) - 5) / 14)) - vivid) * Math.min(1, dt * 6)
      out = Math.min(1, out + dt / ENTER_S)
    } else {
      spin *= Math.exp(-dt / 0.5)
      vivid *= Math.exp(-dt / 0.5)
      out = Math.max(0, out - dt / LEAVE_S)
    }
    // The ring's middle trails the grabbed hoodie a touch (a little swing)
    cvx += (CENTRE_K * (gx - cx) - CENTRE_C * cvx) * dt
    cvy += (CENTRE_K * (gy - cy) - CENTRE_C * cvy) * dt
    cx += cvx * dt
    cy += cvy * dt
    phase += spin * dt

    const e = ease(out)
    const r = R * e
    // They lean into the spin
    const lean = Math.max(-22, Math.min(22, spin * 1.4))
    clones.forEach((c, k) => {
      const a = phase + (k / CLONES) * Math.PI * 2
      const x = cx + r * Math.cos(a) - size / 2
      const y = cy + r * Math.sin(a) - size / 2
      c.style.width = c.style.height = `${size.toFixed(1)}px`
      c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${lean.toFixed(1)}deg) scale(${(0.25 + 0.75 * e).toFixed(3)})`
      c.style.opacity = e.toFixed(3)
    })
    const glow =
      vivid > 0.01
        ? `drop-shadow(0 0 ${(4 + vivid * 18).toFixed(1)}px hsl(${((now / 4) % 360).toFixed(0)} 100% 60% / ${(vivid * 0.9).toFixed(2)}))`
        : ''
    boxOf(grabbed).style.filter = glow
    layer.style.filter = glow

    if (!held && out <= 0) return stop()
    raf = requestAnimationFrame(tick)
  }

  const run = () => {
    if (raf) return
    lastTick = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /** The ring forms around `tile`: clones of its hoodie */
  const form = (/** @type {HTMLElement} */ tile) => {
    if (!tile.closest("[data-view-mode='grid']")) return false
    const img = /** @type {HTMLImageElement | null} */ (boxOf(tile).querySelector('img'))
    const src = img?.currentSrc || img?.src
    if (!src) return false
    if (grabbed !== tile) {
      stop()
      layer = document.createElement('div')
      layer.setAttribute('aria-hidden', 'true')
      layer.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${LAYER_Z};overflow:hidden`
      for (let k = 0; k < CLONES; k++) {
        const c = document.createElement('img')
        c.src = src
        c.alt = ''
        c.draggable = false
        c.style.cssText = 'position:absolute;left:0;top:0;object-fit:contain;opacity:0;will-change:transform'
        layer.appendChild(c)
        clones.push(c)
      }
      document.body.appendChild(layer)
      grabbed = tile
      const g = boxOf(tile).getBoundingClientRect()
      cx = g.left + g.width / 2
      cy = g.top + g.height / 2
      cvx = cvy = 0
      phase = -Math.PI / 2
      spin = 0
    }
    return true
  }

  return {
    /** A drag moved a grid hoodie (dragSnap onDragMove) */
    move(/** @type {HTMLElement} */ tile, /** @type {number} */ x, /** @type {number} */ _y) {
      if (reducedMotion()) return
      const now = performance.now()
      if (!held || grabbed !== tile) {
        if (!form(tile)) return
        held = true
        vx = 0
        lastX = x
        lastT = now
        run()
        return
      }
      const dtm = Math.max(4, now - lastT)
      // Smoothed, but quick to follow
      vx = vx * 0.35 + (((x - lastX) / dtm) * 1000) * 0.65
      lastX = x
      lastT = now
    },
    /** Let go (dragSnap onDrop): the clones fold back into it */
    release(/** @type {HTMLElement} */ tile) {
      if (tile !== grabbed || !held) return
      held = false
      vx = 0
      run()
    },
    /** Clear it all away at once */
    stop,
  }
}
