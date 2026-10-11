// src/lib/dragSnap.js
'use client'

import { useEffect } from 'react'

// Drag-and-park for UI elements: press squeezes, a drag past a few px lifts
// the element and it follows the pointer 1:1, and on release it stays where
// it was dropped (a drop never counts as a tap). A tap on a parked element
// still acts as a tap (opens / closes) and springs it home, unless
// `stayOnTap`. Everything parked also goes home together on resetDragged(),
// which the shop calls when the grid folds back into its stacks. The orb has
// its own drag and always springs straight home.
//
// Elements are moved with the CSS `translate` / `scale` properties, which
// compose with `transform`, so an element's own transform animations (FLIP,
// hover scale, reveal) are left alone.

const DRAG_THRESHOLD_PX = 8
const POS_K = 260 // position stiffness
const POS_C = 18 // position damping (≈0.56: one small overshoot)
const SCALE_K = 420
const SCALE_C = 20 // ≈0.5: a crisp bounce
const PRESS_SCALE = 0.94
const LIFT_SCALE = 1.06

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const RESET_EVENT = 'lb:drag-reset'
export const DRAG_RESET = RESET_EVENT
// Where keyed elements were left, so one that remounts (a pop-up reopened)
// comes back where it was parked
/** @type {Map<string, {x: number, y: number}>} */
const parkedAt = new Map()

/** Parts of a pop-up a press should use as-is instead of dragging it */
export const POPUP_CONTROLS = 'button, a, input, select, textarea, label, iframe, [contenteditable]'

// Each attached root's controls, so parkAt() / sendHome() can move it from outside
/** @type {WeakMap<HTMLElement, { to: (x: number, y: number) => void, home: () => void }>} */
const movers = new WeakMap()

/**
 * Parks an attached element `x`/`y` px from its home, as if dropped there
 * (e.g. the video opening beside a moved iPod)
 * @param {HTMLElement | null | undefined} el
 * @param {number} x
 * @param {number} y
 */
export function parkAt(el, x, y) {
  if (el) movers.get(el)?.to(x, y)
}

/**
 * Springs one attached element home (e.g. the product photo on a new product)
 * @param {HTMLElement | null | undefined} el
 */
export function springHome(el) {
  if (el) movers.get(el)?.home()
}

/**
 * Forgets remembered parked spots whose key starts with `prefix`, so those
 * elements mount at home next time (e.g. the product page's pills once it closes)
 * @param {string} prefix
 */
export function forgetParked(prefix) {
  for (const k of [...parkedAt.keys()]) if (k.startsWith(prefix)) parkedAt.delete(k)
}

/**
 * How far an element has been dragged from home ({0, 0} when it's home)
 * @param {Element | null | undefined} el
 */
export function parkedOffset(el) {
  const t = el instanceof HTMLElement ? el.style.translate : ''
  const [x = 0, y = 0] = t ? t.split(/\s+/).map((v) => parseFloat(v) || 0) : []
  return { x, y }
}

// Last dragged on top: every lift takes the next layer, for the element and
// for the outermost layer it lives in (the top bar, the bottom bar, the
// video's holder, the product page), so it rises over things in other
// layers too. Starts above every resting layer; never lowers anything (the
// pop-ups, quick-add pills and a dragged orb stay higher still).
const LAYER_BASE = 100000
let topLayer = LAYER_BASE
/** @type {Map<HTMLElement, { v: string, p: string, owners: Set<HTMLElement> }>} */
const raisedOuter = new Map()

const zOf = (/** @type {HTMLElement} */ el) => parseInt(getComputedStyle(el).zIndex, 10)

/** The outermost positioned, z-indexed (or fixed) ancestor: the layer that
 *  competes with other layers on the page */
const outerLayer = (/** @type {HTMLElement} */ el) => {
  let outer = null
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const s = getComputedStyle(a)
    if (s.position === 'fixed' || s.position === 'sticky' || (s.position !== 'static' && s.zIndex !== 'auto')) {
      outer = /** @type {HTMLElement} */ (a)
    }
  }
  return outer
}

/** Puts `el` (and its outer layer) on top; returns that outer layer. With
 *  `bump` false (a remounted drag keeping its spot) it only re-registers. */
const takeTopLayer = (/** @type {HTMLElement} */ el, bump = true) => {
  const layer = bump ? ++topLayer : 0
  if (bump && !(zOf(el) > layer)) el.style.setProperty('z-index', String(layer), 'important')
  const outer = outerLayer(el)
  if (outer) {
    let held = raisedOuter.get(outer)
    if (!held) {
      held = { v: outer.style.getPropertyValue('z-index'), p: outer.style.getPropertyPriority('z-index'), owners: new Set() }
      raisedOuter.set(outer, held)
    }
    held.owners.add(el)
    if (bump && !(zOf(outer) > layer)) outer.style.setProperty('z-index', String(layer), 'important')
  }
  return outer
}

/** `el` is home: its outer layer goes back once nothing in it is lifted */
const leaveTopLayer = (/** @type {HTMLElement} */ el, /** @type {HTMLElement | null} */ outer) => {
  const held = outer && raisedOuter.get(outer)
  if (!held) return
  held.owners.delete(el)
  if (held.owners.size) return
  raisedOuter.delete(outer)
  outer.style.setProperty('z-index', held.v, held.p)
}

/**
 * Sends every parked element home: the grid folding back into stacks, or a
 * re-rack after an add to cart (`spring`: even the tiles spring home, since
 * no fold animates them)
 * @param {{ spring?: boolean }} [opts]
 */
export function resetDragged(opts = {}) {
  parkedAt.clear()
  try { window.dispatchEvent(new CustomEvent(RESET_EVENT, { detail: opts })) } catch {}
}

/**
 * @typedef {object} DragSnapOptions
 * @property {string[]} [targets] selectors tried in order (closest match from
 *   the pressed element) to pick what moves; omit to move `root` itself
 * @property {() => boolean} [enabled] checked on every press
 * @property {string} [touchAction] set on `root` so touch drags reach it
 *   (e.g. 'none'); leave unset when the caller styles the targets itself
 * @property {string} [ignore] presses that start on a match (e.g. a pop-up's
 *   buttons and fields) are left alone and never drag
 * @property {string} [key] remembers where `root` is parked across remounts
 *   (only when `targets` is unset), until it goes home
 * @property {boolean} [stayOnTap] a tap on a parked element acts as usual but
 *   leaves it parked; only resetDragged() sends it home
 * @property {boolean} [jumpHome] on resetDragged(), parked elements jump home
 *   with no spring, for a caller that animates them itself (the grid's FLIP)
 * @property {(el: HTMLElement, x: number, y: number) => void} [onDragMove]
 *   called with the pointer's position on every move of a live drag
 * @property {(el: HTMLElement, x: number, y: number, cancelled: boolean) => boolean} [onDrop]
 *   called when a drag ends; return true when the drop was used (e.g. on the
 *   cart) and the element springs home instead of parking
 * @property {(lifted: boolean) => void} [onLift] called with true when a drag
 *   lifts an element, and false once it is back home and at rest (e.g. to
 *   raise its container above everything while it's away)
 */

/**
 * @param {HTMLElement} root element that receives the pointer events
 * @param {DragSnapOptions} [opts]
 * @returns {() => void} cleanup
 */
export function attachDragSnap(root, opts = {}) {
  const { targets, enabled, touchAction, ignore, key, stayOnTap, jumpHome, onDragMove, onDrop, onLift } = opts
  /** @type {WeakMap<HTMLElement, any>} */
  const states = new WeakMap()
  /** @type {Set<HTMLElement>} parked away from home, for the reset */
  const parked = new Set()
  /** @type {null | { id: number, el: HTMLElement, hit: EventTarget | null, x: number, y: number, bx: number, by: number, active: boolean }} */
  let press = null
  // Pointers currently down that started on root (to spot a pinch)
  const down = new Set()
  // Set when a drag ends, so the click (and touchend) the browser sends
  // right after it doesn't also fire the element's tap action
  let suppress = false

  const findTarget = (/** @type {EventTarget|null} */ t) => {
    if (!targets) return root
    const node = /** @type {HTMLElement|null} */ (t)
    for (const sel of targets) {
      const el = node?.closest?.(sel)
      if (el instanceof HTMLElement && root.contains(el)) return el
    }
    return null
  }

  const stateOf = (/** @type {HTMLElement} */ el) => {
    let m = states.get(el)
    if (!m) {
      // trans / z: the element's own inline transition and z-index while we
      // override them (null when not overridden)
      m = { x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, held: false, parked: false, lifted: false, raf: 0, trans: null, z: null, outer: null }
      states.set(el, m)
    }
    return m
  }

  const write = (/** @type {HTMLElement} */ el, m) => {
    el.style.translate = `${m.x}px ${m.y}px`
    el.style.scale = String(m.s)
  }

  // Every lift goes on top of everything dragged before it. A parked element
  // re-attached after a re-render keeps the layer it already has.
  const raise = (/** @type {HTMLElement} */ el, m, bump = true) => {
    const kept = !bump && parseInt(el.style.zIndex, 10) > LAYER_BASE
    if (m.z === null) m.z = kept ? { v: '', p: '' } : { v: el.style.getPropertyValue('z-index'), p: el.style.getPropertyPriority('z-index') }
    m.outer = takeTopLayer(el, !kept)
  }

  // Home again: back to its own layer
  const lower = (/** @type {HTMLElement} */ el, m) => {
    if (m.z === null) return
    el.style.setProperty('z-index', m.z.v, m.z.p)
    m.z = null
    leaveTopLayer(el, m.outer)
    m.outer = null
  }

  const lift = (/** @type {HTMLElement} */ el, m, bump = true) => {
    raise(el, m, bump)
    if (!m.lifted) {
      m.lifted = true
      onLift?.(true)
    }
  }

  // Stop the frame loop and hand the element its own transitions back (a
  // parked pop-up still fades / scales closed)
  const rest = (/** @type {HTMLElement} */ el, m) => {
    m.raf = 0
    if (m.trans !== null) {
      el.style.transition = m.trans
      m.trans = null
    }
  }

  const run = (/** @type {HTMLElement} */ el) => {
    const m = stateOf(el)
    if (m.raf) return
    if (m.trans === null) {
      // Keep the element's own transitions from smoothing per-frame writes
      m.trans = el.style.transition
      el.style.transition = 'none'
    }
    let last = performance.now()
    const tick = (/** @type {number} */ now) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (!m.held && !m.parked) {
        m.vx += (-POS_K * m.x - POS_C * m.vx) * dt
        m.vy += (-POS_K * m.y - POS_C * m.vy) * dt
        m.x += m.vx * dt
        m.y += m.vy * dt
      }
      m.vs += (-SCALE_K * (m.s - m.ts) - SCALE_C * m.vs) * dt
      m.s += m.vs * dt

      const scaleSettled = Math.abs(m.s - m.ts) < 0.002 && Math.abs(m.vs) < 0.02
      if (m.parked && !m.held && scaleSettled) {
        // Parked away from home: rest there (still lifted above its row)
        m.s = m.ts
        m.vs = 0
        write(el, m)
        rest(el, m)
        return
      }
      const settled =
        !m.held &&
        Math.hypot(m.x, m.y) < 0.5 && Math.hypot(m.vx, m.vy) < 10 &&
        Math.abs(m.s - m.ts) < 0.002 && Math.abs(m.vs) < 0.02
      if (settled && m.ts === 1) {
        m.x = m.y = m.vx = m.vy = m.vs = 0
        m.s = 1
        el.style.translate = ''
        el.style.scale = ''
        rest(el, m)
        lower(el, m)
        if (m.lifted) {
          m.lifted = false
          onLift?.(false)
        }
        return
      }
      if (settled) {
        // Resting while pressed (squeezed): hold still until released
        m.s = m.ts
        m.vs = 0
        write(el, m)
        rest(el, m)
        return
      }
      write(el, m)
      m.raf = requestAnimationFrame(tick)
    }
    m.raf = requestAnimationFrame(tick)
  }

  const setScale = (/** @type {HTMLElement} */ el, /** @type {number} */ ts) => {
    const m = stateOf(el)
    m.ts = reducedMotion() ? 1 : ts
    run(el)
  }

  const onDown = (/** @type {PointerEvent} */ e) => {
    down.add(e.pointerId)
    suppress = false
    if (down.size > 1) {
      // A second finger (pinch): let go of the drag without acting
      if (press) drop(press)
      press = null
      return
    }
    if (enabled && !enabled()) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (ignore && /** @type {any} */ (e.target)?.closest?.(ignore)) return
    const el = findTarget(e.target)
    if (!el) return
    const m = stateOf(el)
    // Drags continue from where the element is (it may be parked away)
    press = { id: e.pointerId, el, hit: e.target, x: e.clientX, y: e.clientY, bx: m.x, by: m.y, active: false }
    setScale(el, PRESS_SCALE)
  }

  const onMove = (/** @type {PointerEvent} */ e) => {
    if (!press || press.id !== e.pointerId) return
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    const m = stateOf(press.el)
    if (!press.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      press.active = true
      try { press.el.setPointerCapture(e.pointerId) } catch {}
      m.held = true
      setScale(press.el, LIFT_SCALE)
      lift(press.el, m)
      try { window.getSelection()?.removeAllRanges() } catch {}
    }
    m.x = press.bx + dx
    m.y = press.by + dy
    m.vx = m.vy = 0
    write(press.el, m)
    onDragMove?.(press.el, e.clientX, e.clientY)
  }

  /** Spring home (or jump, with no animation) */
  const sendHome = (/** @type {HTMLElement} */ el, jump = false) => {
    const m = stateOf(el)
    parked.delete(el)
    if (key && el === root) parkedAt.delete(key)
    m.held = false
    m.parked = false
    m.ts = 1
    if (jump || reducedMotion()) {
      m.x = m.y = m.vx = m.vy = 0
      m.s = 1
      m.vs = 0
      write(el, m)
    }
    run(el)
    // A jump settles on the loop's first frame; finish it now so the caller
    // measures the element at home
    if (jump) {
      cancelAnimationFrame(m.raf)
      m.raf = 0
      el.style.translate = ''
      el.style.scale = ''
      rest(el, m)
      lower(el, m)
      if (m.lifted) {
        m.lifted = false
        onLift?.(false)
      }
    }
  }

  /** A drag ends: the element stays where it was let go */
  const drop = (/** @type {{ el: HTMLElement, active: boolean }} */ p) => {
    const m = stateOf(p.el)
    m.held = false
    if (p.active) {
      m.parked = true
      m.vx = m.vy = 0
      parked.add(p.el)
      if (key && p.el === root) parkedAt.set(key, { x: m.x, y: m.y })
    }
    setScale(p.el, 1)
  }

  // Counted on window: a mouse can be released anywhere
  const onAnyUp = (/** @type {PointerEvent} */ e) => { down.delete(e.pointerId) }

  const onUp = (/** @type {PointerEvent} */ e) => {
    if (!press || press.id !== e.pointerId) return
    const p = press
    press = null
    if (!p.active) {
      // A tap: the element's own click acts (opens / closes), and a parked
      // one goes home unless it stays put on taps
      if (e.type === 'pointerup' && !stayOnTap && stateOf(p.el).parked) sendHome(p.el)
      else setScale(p.el, 1)
      return
    }
    suppress = true
    if (onDrop?.(p.el, e.clientX, e.clientY, e.type !== 'pointerup')) {
      stateOf(p.el).held = false
      sendHome(p.el)
      return
    }
    drop(p)
  }

  const onReset = (/** @type {any} */ e) => {
    const jump = !!jumpHome && !e?.detail?.spring
    for (const el of [...parked]) sendHome(el, jump)
  }

  // While a drag is live, don't let ancestors (e.g. a pull-to-pan) see moves
  const onTouchMove = (/** @type {TouchEvent} */ e) => {
    if (press?.active) e.stopPropagation()
  }
  const onTouchEnd = (/** @type {TouchEvent} */ e) => {
    if (!suppress) return
    // Stop the tap handlers on the element and the click that would follow
    if (e.cancelable) e.preventDefault()
  }
  // No native image drag or text selection while pressing
  const onNativeDrag = (/** @type {Event} */ e) => { if (press) e.preventDefault() }
  const onClick = (/** @type {MouseEvent} */ e) => {
    if (!suppress) return
    suppress = false
    e.stopPropagation()
    e.preventDefault()
  }

  // A keyed element that was parked before it remounted comes back there
  const saved = key && !targets ? parkedAt.get(key) : null
  if (saved) {
    const m = stateOf(root)
    m.x = saved.x
    m.y = saved.y
    m.parked = true
    parked.add(root)
    write(root, m)
    lift(root, m, false)
  }

  if (!targets) {
    movers.set(root, {
      home: () => { if (stateOf(root).parked) sendHome(root) },
      to: (x, y) => {
        const m = stateOf(root)
        m.x = x
        m.y = y
        m.vx = m.vy = 0
        m.held = false
        m.parked = true
        parked.add(root)
        if (key) parkedAt.set(key, { x, y })
        write(root, m)
        lift(root, m)
      },
    })
  }

  const prevTouchAction = root.style.touchAction
  if (touchAction) root.style.touchAction = touchAction
  window.addEventListener(RESET_EVENT, onReset)
  root.addEventListener('pointerdown', onDown)
  // On window: a quick mouse can leave a small element before the drag
  // starts (and captures the pointer); touch is captured from the start
  window.addEventListener('pointermove', onMove)
  root.addEventListener('pointerup', onUp)
  root.addEventListener('pointercancel', onUp)
  window.addEventListener('pointerup', onAnyUp, true)
  window.addEventListener('pointercancel', onAnyUp, true)
  root.addEventListener('touchmove', onTouchMove, { passive: true })
  root.addEventListener('touchend', onTouchEnd)
  root.addEventListener('dragstart', onNativeDrag)
  root.addEventListener('selectstart', onNativeDrag)
  root.addEventListener('click', onClick, true)
  return () => {
    if (touchAction) root.style.touchAction = prevTouchAction
    window.removeEventListener(RESET_EVENT, onReset)
    movers.delete(root)
    root.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerup', onUp)
    root.removeEventListener('pointercancel', onUp)
    window.removeEventListener('pointerup', onAnyUp, true)
    window.removeEventListener('pointercancel', onAnyUp, true)
    root.removeEventListener('touchmove', onTouchMove)
    root.removeEventListener('touchend', onTouchEnd)
    root.removeEventListener('dragstart', onNativeDrag)
    root.removeEventListener('selectstart', onNativeDrag)
    root.removeEventListener('click', onClick, true)
  }
}

/**
 * React wrapper: attaches drag-and-park to `ref.current`.
 * @param {React.RefObject<HTMLElement>} ref
 * @param {DragSnapOptions} [opts]
 * @param {any[]} [deps] re-attach when these change (e.g. the element remounts)
 */
export function useDragSnap(ref, opts, deps = []) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    return attachDragSnap(el, opts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
