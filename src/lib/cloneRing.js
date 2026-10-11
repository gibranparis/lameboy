// src/lib/cloneRing.js
'use client'

// Grab anything on the shop page and a ring of clones of it spins out around
// it (a black hoodie gets a ring of black hoodies, the bag a ring of bags, the
// orb a ring of little spinning orbs). The ring rolls with the drag like a
// wheel: dragged right it spins clockwise, dragged left counter-clockwise, as
// fast as it's dragged, and it keeps its momentum when the drag slows,
// winding down with friction. A rainbow glow lights the grabbed piece when
// it's really going. Let go and the clones fold back into it.
//
// dragSnap runs one for everything it moves with a fling (see its `ring`
// option); the orb drives its own. The clones are copies of the piece as it
// looks right then, stripped of ids and data-* hooks so nothing ever picks
// them for the real thing; a video shows as its thumbnail and a canvas (the
// orb) is copied live every frame. They live in their own fixed layer, just
// under the lifted piece; nothing else on the page is touched apart from the
// grabbed piece's glow.

const CLONES = 6
const ROLL = 1.4 // spin = drag speed / ring radius × this (a wheel rolling with the drag)
const MAX_SPIN = 11 // rad/s (under 2 turns a second, so it reads clearly)
const GRIP = 12 // 1/s: how quickly the drag gets the ring up to its speed
const FRICTION = 1.5 // s: how long the momentum takes to wind down once the drag stops
const IDLE_SPIN = 1 // rad/s: it never stops while held
const CLONE_SCALE = 0.58 // clone size against the grabbed piece
const GAP = 6 // px between the grabbed piece and the ring
const ENTER_S = 0.28 // s to spin out of the grabbed piece onto the ring
const LEAVE_S = 0.24 // s to fold back into it
const CENTRE_K = 260 // the ring's middle trails the grabbed piece a touch
const CENTRE_C = 26
const LAYER_Z = 99999 // under the lifted piece (dragSnap's layers start above 100000)

/** Marks the clones' layer, so nothing (e.g. pinball's walls) mistakes a clone for the real thing */
export const CLONE_RING_ATTR = 'data-clone-ring'

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const ease = (/** @type {number} */ t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

/** A YouTube embed's thumbnail, for a video's clones */
const thumbOf = (/** @type {Element} */ frame) => {
  const id = /\/embed\/([\w-]{6,})/.exec(frame.getAttribute('src') || '')?.[1]
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''
}

/**
 * A copy of `src` as it looks now, sized to its box: no ids or data-* / aria
 * hooks, players swapped for their thumbnail, canvases paired with the
 * originals to copy each frame.
 * @param {HTMLElement} src
 */
function snapshot(src) {
  const r = src.getBoundingClientRect()
  const copy = /** @type {HTMLElement} */ (src.cloneNode(true))
  for (const n of [copy, ...copy.querySelectorAll('*')]) {
    for (const a of [...n.attributes]) {
      if (a.name === 'id' || a.name === 'role' || a.name === 'tabindex' || a.name.startsWith('data-') || a.name.startsWith('aria-')) n.removeAttribute(a.name)
    }
  }
  // Players: a still of the video instead of another player
  const frames = [...src.querySelectorAll('iframe, video')]
  ;[...copy.querySelectorAll('iframe, video')].forEach((f, i) => {
    const o = frames[i]
    const box = o?.getBoundingClientRect()
    const still = document.createElement('div')
    const thumb = o?.tagName === 'IFRAME' ? thumbOf(o) : ''
    still.style.cssText =
      `width:${box ? box.width : 0}px;height:${box ? box.height : 0}px;background:#000 center/cover no-repeat;border-radius:inherit` +
      (thumb ? `;background-image:url("${thumb}")` : '')
    f.replaceWith(still)
  })
  // Canvases copy the real ones live (the orb keeps spinning in every clone)
  const origCanvases = src instanceof HTMLCanvasElement ? [src] : [...src.querySelectorAll('canvas')]
  const copyCanvases = copy instanceof HTMLCanvasElement ? [copy] : [...copy.querySelectorAll('canvas')]
  const canvases = copyCanvases.map((c, i) => ({ to: /** @type {HTMLCanvasElement} */ (c), from: /** @type {HTMLCanvasElement} */ (origCanvases[i]) }))

  // The copy stands on its own: where it is, how it's moved and layered, and
  // any glow belong to the real one
  const s = copy.style
  for (const [k, v] of [
    ['position', 'relative'], ['inset', 'auto'], ['margin', '0'], ['translate', 'none'], ['scale', 'none'],
    ['transform', 'none'], ['transition', 'none'], ['z-index', 'auto'], ['filter', 'none'], ['opacity', '1'],
    ['width', `${r.width}px`], ['height', `${r.height}px`], ['pointer-events', 'none'], ['visibility', 'visible'],
  ]) s.setProperty(k, v, 'important')

  const wrap = document.createElement('div')
  wrap.style.cssText = `position:absolute;left:0;top:0;width:${r.width}px;height:${r.height}px;opacity:0;will-change:transform;transform-origin:50% 50%`
  wrap.appendChild(copy)
  return { el: wrap, w: r.width, h: r.height, canvases }
}

/**
 * @param {{ box?: (el: HTMLElement) => Element | null | undefined, alive?: (el: HTMLElement) => boolean }} [opts]
 *   box: the part of the grabbed piece that's cloned and circled (default
 *   the piece itself, e.g. a tile's hoodie card); alive: false clears the
 *   ring away (e.g. the grid folded into its stacks)
 */
export function createCloneRing(opts = {}) {
  const boxOf = (/** @type {HTMLElement} */ el) => /** @type {HTMLElement} */ (opts.box?.(el) || el)
  /** @type {HTMLElement | null} */
  let grabbed = null
  /** @type {HTMLDivElement | null} */
  let layer = null
  /** @type {{ el: HTMLElement, w: number, h: number, canvases: { to: HTMLCanvasElement, from: HTMLCanvasElement }[] }[]} */
  let clones = []
  let held = false
  let vx = 0 // smoothed drag velocity, px/s
  let spin = 0 // rad/s, + clockwise on screen
  let phase = 0 // the ring's turn, rad
  let vivid = 0 // 0–1 rainbow glow
  let out = 0 // 0–1: folded into the grabbed piece → out on the ring
  let cx = 0 // the ring's middle, trailing the grabbed piece
  let cy = 0
  let cvx = 0
  let cvy = 0
  let lastX = 0
  let lastT = 0
  let raf = 0
  let lastTick = 0
  let filterBefore = ''

  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    layer?.remove()
    layer = null
    clones = []
    if (grabbed) boxOf(grabbed).style.filter = filterBefore
    grabbed = null
    held = false
    vx = spin = vivid = out = 0
  }

  const tick = (/** @type {number} */ now) => {
    raf = 0
    const dt = Math.min(0.05, (now - lastTick) / 1000)
    lastTick = now
    if (dt <= 0) return void (raf = requestAnimationFrame(tick))
    // Gone (unmounted, or folded into the stacks): clear it all away
    if (!grabbed || !layer || !grabbed.isConnected || (opts.alive && !opts.alive(grabbed))) return stop()

    const g = boxOf(grabbed).getBoundingClientRect()
    const gx = g.left + g.width / 2
    const gy = g.top + g.height / 2
    const span = Math.max(g.width, g.height)
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Ring size: clear of the grabbed piece, room for every clone, on screen
    let size = span * CLONE_SCALE
    const radius = (/** @type {number} */ sz) => Math.max(span * 0.71 + sz * 0.71 + GAP, (CLONES * sz * 1.05) / (2 * Math.PI))
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
    // The ring's middle trails the grabbed piece a touch (a little swing)
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
      const k2 = (size / Math.max(c.w, c.h, 1)) * (0.25 + 0.75 * e)
      const x = cx + r * Math.cos(a) - c.w / 2
      const y = cy + r * Math.sin(a) - c.h / 2
      c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${lean.toFixed(1)}deg) scale(${k2.toFixed(3)})`
      c.el.style.opacity = e.toFixed(3)
      for (const { to, from } of c.canvases) {
        if (!from?.isConnected || !from.width) continue
        if (to.width !== from.width || to.height !== from.height) {
          to.width = from.width
          to.height = from.height
        }
        const ctx = to.getContext('2d')
        if (!ctx) continue
        ctx.clearRect(0, 0, to.width, to.height)
        try { ctx.drawImage(from, 0, 0) } catch {}
      }
    })
    const glow =
      vivid > 0.01
        ? `drop-shadow(0 0 ${(4 + vivid * 18).toFixed(1)}px hsl(${((now / 4) % 360).toFixed(0)} 100% 60% / ${(vivid * 0.9).toFixed(2)}))`
        : ''
    boxOf(grabbed).style.filter = glow || filterBefore
    layer.style.filter = glow

    if (!held && out <= 0) return stop()
    raf = requestAnimationFrame(tick)
  }

  const run = () => {
    if (raf) return
    lastTick = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /** The ring forms around `el`: clones of it */
  const form = (/** @type {HTMLElement} */ el) => {
    if (opts.alive && !opts.alive(el)) return false
    if (grabbed === el && layer) return true
    stop()
    const box = boxOf(el)
    if (!box.getBoundingClientRect().width) return false
    layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    layer.setAttribute(CLONE_RING_ATTR, '')
    layer.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${LAYER_Z};overflow:hidden`
    for (let k = 0; k < CLONES; k++) {
      const c = snapshot(box)
      layer.appendChild(c.el)
      clones.push(c)
    }
    document.body.appendChild(layer)
    grabbed = el
    filterBefore = box.style.filter
    const g = box.getBoundingClientRect()
    cx = g.left + g.width / 2
    cy = g.top + g.height / 2
    cvx = cvy = 0
    phase = -Math.PI / 2
    spin = 0
    return true
  }

  return {
    /** A drag moved `el` (the pointer is at x, y) */
    move(/** @type {HTMLElement} */ el, /** @type {number} */ x, /** @type {number} */ _y) {
      if (reducedMotion()) return
      const now = performance.now()
      if (!held || grabbed !== el) {
        if (!form(el)) return
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
    /** Let go: the clones fold back into it */
    release(/** @type {HTMLElement} */ el) {
      if (el !== grabbed || !held) return
      held = false
      vx = 0
      run()
    },
    /** Clear it all away at once */
    stop,
  }
}
