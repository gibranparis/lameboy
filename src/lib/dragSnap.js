// src/lib/dragSnap.js
'use client'

import { useEffect } from 'react'

// Drag-and-park for UI elements: press squeezes, a drag past a few px lifts
// the element and it follows the pointer 1:1, and on release it stays where
// it was dropped (a drop never counts as a tap). A tap on a parked element
// springs it home and still acts as a tap. Everything parked also goes home
// together on resetDragged(), which the shop calls when the grid folds back
// into its stacks. The orb has its own drag and always springs straight home.
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
// Where keyed elements were left, so one that remounts (a pop-up reopened)
// comes back where it was parked
/** @type {Map<string, {x: number, y: number}>} */
const parkedAt = new Map()

/** Parts of a pop-up a press should use as-is instead of dragging it */
export const POPUP_CONTROLS = 'button, a, input, select, textarea, label, iframe, [contenteditable]'

/** Sends every parked element home (the grid folding back into stacks) */
export function resetDragged() {
  parkedAt.clear()
  try { window.dispatchEvent(new Event(RESET_EVENT)) } catch {}
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
 * @property {boolean} [independent] ignores resetDragged(); only a tap sends
 *   it home
 * @property {boolean} [jumpHome] on resetDragged(), parked elements jump home
 *   with no spring, for a caller that animates them itself (the grid's FLIP)
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
  const { targets, enabled, touchAction, ignore, key, independent, jumpHome, onLift } = opts
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
      m = { x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, held: false, parked: false, lifted: false, raf: 0, trans: null, z: null }
      states.set(el, m)
    }
    return m
  }

  const write = (/** @type {HTMLElement} */ el, m) => {
    el.style.translate = `${m.x}px ${m.y}px`
    el.style.scale = String(m.s)
  }

  // Lifted above its neighbours (never lowered: pop-ups already sit high)
  const raise = (/** @type {HTMLElement} */ el, m) => {
    if (m.z !== null) return
    m.z = el.style.zIndex
    const z = parseInt(getComputedStyle(el).zIndex, 10)
    if (!(z >= 50)) el.style.zIndex = '50'
  }

  const lift = (/** @type {HTMLElement} */ el, m) => {
    raise(el, m)
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
        if (m.z !== null) {
          el.style.zIndex = m.z
          m.z = null
        }
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
      if (m.z !== null) {
        el.style.zIndex = m.z
        m.z = null
      }
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
      // A tap: the element's own click acts, and a parked one goes home
      if (e.type === 'pointerup' && stateOf(p.el).parked) sendHome(p.el)
      else setScale(p.el, 1)
      return
    }
    suppress = true
    drop(p)
  }

  const onReset = () => {
    for (const el of [...parked]) sendHome(el, !!jumpHome)
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
    lift(root, m)
  }

  const prevTouchAction = root.style.touchAction
  if (touchAction) root.style.touchAction = touchAction
  if (!independent) window.addEventListener(RESET_EVENT, onReset)
  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointermove', onMove)
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
    root.removeEventListener('pointerdown', onDown)
    root.removeEventListener('pointermove', onMove)
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
