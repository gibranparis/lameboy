// src/lib/pileSpin.js
'use client'

// The pile's whirlwind: drag a stack fast and its hoodies spin with it, the
// way it's dragged (right or left), each one a little faster than the one
// under it so the pile twists, with a rainbow glow the harder it's flung.
// Let go and the momentum carries on, winds down, and each hoodie springs
// upright again. Same feel as the orb's momentum (OrbShell).
//
// Driven from dragSnap's onDragMove / onDrop; it only writes the CSS
// `rotate` and `filter` properties, so drag (translate / scale) and the
// FLIP / wiggle transforms are left alone.

const MAX_SPIN = 1080 // deg/s while held
const MAX_FLING = 1400 // deg/s right after a fling
const PER_PX = 0.5 // deg/s of spin per px/s of drag
const TWIST = 0.14 // each hoodie up the pile spins this much faster
const SETTLE_BELOW = 240 // deg/s: slower than this, they glide upright
const GLIDE_DECEL = 400 // deg/s² easing into upright (never faster than it was going)
const GLIDE_MIN = 90 // deg/s, so the last bit doesn't crawl
const BOUNCE_WITHIN = 12 // deg from upright: the spring takes over for a small bounce
const K = 140 // settle spring
const C = 13 // settle damping

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function createPileSpin() {
  /** @type {HTMLElement | null} */
  let pile = null
  let held = false
  let speed = 0 // smoothed drag speed, px/s
  let dir = 1 // +1 dragged right, -1 dragged left
  let spin = 0 // deg/s of the bottom hoodie
  let vivid = 0 // 0–1 rainbow glow
  let settling = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let raf = 0
  let lastTick = 0
  // a: angle (deg), v: deg/s, to: the upright it's springing to (locked once settling)
  /** @type {{ el: HTMLElement, a: number, v: number, to: number | null }[]} */
  let cards = []

  const clear = () => {
    for (const c of cards) c.el.style.rotate = ''
    if (pile) pile.style.filter = ''
    cancelAnimationFrame(raf)
    raf = 0
    cards = []
    pile = null
    held = false
    settling = false
    speed = spin = vivid = 0
  }

  const tick = (/** @type {number} */ now) => {
    raf = 0
    // Unfolded into the grid (or gone): put everything back
    if (!pile || !pile.isConnected || !pile.closest("[data-view-mode='stacks']")) return clear()
    const dt = Math.min(0.05, (now - lastTick) / 1000)
    lastTick = now

    if (held) {
      // Held still, the wind-up fades; moving keeps it fed (move())
      if (now - lastT > 120) speed *= Math.exp(-dt * 5)
      // Turning the drag around swings it through zero and back up the other way
      spin += (dir * Math.min(MAX_SPIN, speed * PER_PX) - spin) * Math.min(1, dt * 8)
      vivid += (Math.min(1, Math.max(0, (speed - 250) / 1400)) - vivid) * Math.min(1, dt * 6)
    } else {
      spin *= Math.exp(-dt / 1.1)
      vivid *= Math.exp(-dt / 1.5)
      if (!settling && Math.abs(spin) < SETTLE_BELOW) settling = true
    }

    let moving = held || !settling
    cards.forEach((c, i) => {
      if (!settling || held) {
        c.v = spin * (1 + i * TWIST)
        c.to = null
      } else {
        // Spring upright at the next full turn the way it was turning (no
        // rewinding); locked, so a bounce past it doesn't chase the next one
        if (c.to === null) c.to = (c.v >= 0 ? Math.ceil(c.a / 360) : Math.floor(c.a / 360)) * 360
        const d = c.to - c.a
        if (Math.abs(d) > BOUNCE_WITHIN) {
          c.v = Math.sign(d) * Math.min(Math.max(Math.abs(c.v), GLIDE_MIN), Math.sqrt(2 * GLIDE_DECEL * Math.abs(d)))
        } else c.v += (K * d - C * c.v) * dt
        if (Math.abs(c.to - c.a) > 0.3 || Math.abs(c.v) > 2) moving = true
        else {
          c.a = c.to
          c.v = 0
        }
      }
      c.a += c.v * dt
      c.el.style.rotate = `${(c.a % 360).toFixed(2)}deg`
    })

    pile.style.filter =
      vivid > 0.01
        ? `drop-shadow(0 0 ${(4 + vivid * 18).toFixed(1)}px hsl(${((now / 4) % 360).toFixed(0)} 100% 60% / ${(vivid * 0.9).toFixed(2)}))`
        : ''

    if (!moving && vivid <= 0.01) return clear()
    raf = requestAnimationFrame(tick)
  }
  const run = () => {
    if (raf) return
    lastTick = performance.now()
    raf = requestAnimationFrame(tick)
  }

  return {
    /** A drag moved the pile (dragSnap onDragMove) */
    move(/** @type {HTMLElement} */ el, /** @type {number} */ x, /** @type {number} */ y) {
      if (reducedMotion()) return
      const now = performance.now()
      if (pile !== el) {
        if (pile) clear()
        pile = el
        cards = [...el.querySelectorAll(':scope > .product-tile')].map((t) => ({ el: /** @type {HTMLElement} */ (t), a: 0, v: 0, to: null }))
      }
      if (!held) {
        held = true
        settling = false
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
    /** The pile was let go (dragSnap onDrop): fling the momentum on */
    release(/** @type {HTMLElement} */ el) {
      if (el !== pile || !held) return
      held = false
      spin = dir * Math.min(MAX_FLING, Math.max(dir * spin, speed * PER_PX) * 1.3)
      vivid = Math.min(1, Math.max(vivid, speed / 1100))
      speed = 0
      run()
    },
    /** Stop and put every hoodie back upright at once */
    stop: clear,
  }
}
