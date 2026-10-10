// src/lib/dragSnap.js
'use client'

import { useEffect } from 'react'

// Drag-and-spring-back for UI elements, matching the orb: press squeezes,
// a drag past a few px lifts the element and it follows the pointer 1:1,
// and on release it springs home. As it arrives it gets a click on whatever
// was pressed, so a drag ends exactly like a tap.
//
// Elements are moved with the CSS `translate` / `scale` properties, which
// compose with `transform`, so an element's own transform animations (FLIP,
// hover scale, reveal) are left alone.

const DRAG_THRESHOLD_PX = 8
const ARRIVE_PX = 6 // counts as home within this distance
const POS_K = 260 // position stiffness
const POS_C = 18 // position damping (≈0.56: one small overshoot)
const SCALE_K = 420
const SCALE_C = 20 // ≈0.5: a crisp bounce
const PRESS_SCALE = 0.94
const LIFT_SCALE = 1.06

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * @typedef {object} DragSnapOptions
 * @property {string[]} [targets] selectors tried in order (closest match from
 *   the pressed element) to pick what moves; omit to move `root` itself
 * @property {() => boolean} [enabled] checked on every press
 * @property {string} [touchAction] set on `root` so touch drags reach it
 *   (e.g. 'none'); leave unset when the caller styles the targets itself
 */

/**
 * @param {HTMLElement} root element that receives the pointer events
 * @param {DragSnapOptions} [opts]
 * @returns {() => void} cleanup
 */
export function attachDragSnap(root, opts = {}) {
  const { targets, enabled, touchAction } = opts
  /** @type {WeakMap<HTMLElement, any>} */
  const states = new WeakMap()
  /** @type {null | { id: number, el: HTMLElement, hit: EventTarget | null, x: number, y: number, active: boolean }} */
  let press = null
  // Pointers currently down that started on root (to spot a pinch)
  const down = new Set()
  // Set when a drag ends, so the click (and touchend) the browser sends
  // right after it doesn't also fire the element's tap action
  let suppress = false
  // Our own click on arrival must get through
  let releasing = false

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
      m = { x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, held: false, raf: 0, onArrive: null, saved: null }
      states.set(el, m)
    }
    return m
  }

  const write = (/** @type {HTMLElement} */ el, m) => {
    el.style.translate = `${m.x}px ${m.y}px`
    el.style.scale = String(m.s)
  }

  const run = (/** @type {HTMLElement} */ el) => {
    const m = stateOf(el)
    if (m.raf) return
    if (!m.saved) {
      // Keep the element's own transitions from smoothing per-frame writes
      m.saved = { transition: el.style.transition, zIndex: el.style.zIndex }
      el.style.transition = 'none'
    }
    let last = performance.now()
    const tick = (/** @type {number} */ now) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (!m.held) {
        m.vx += (-POS_K * m.x - POS_C * m.vx) * dt
        m.vy += (-POS_K * m.y - POS_C * m.vy) * dt
        m.x += m.vx * dt
        m.y += m.vy * dt
      }
      m.vs += (-SCALE_K * (m.s - m.ts) - SCALE_C * m.vs) * dt
      m.s += m.vs * dt

      if (m.onArrive && !m.held && Math.hypot(m.x, m.y) < ARRIVE_PX) {
        const done = m.onArrive
        m.onArrive = null
        done()
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
        if (m.saved) {
          el.style.transition = m.saved.transition
          el.style.zIndex = m.saved.zIndex
          m.saved = null
        }
        m.raf = 0
        return
      }
      if (settled) {
        // Resting while pressed (squeezed): hold still until released
        m.s = m.ts
        m.vs = 0
        write(el, m)
        m.raf = 0
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
      if (press) release(press.el, false)
      press = null
      return
    }
    if (enabled && !enabled()) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const el = findTarget(e.target)
    if (!el) return
    press = { id: e.pointerId, el, hit: e.target, x: e.clientX, y: e.clientY, active: false }
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
      if (!m.saved) m.saved = { transition: press.el.style.transition, zIndex: press.el.style.zIndex }
      press.el.style.zIndex = '50'
      try { window.getSelection()?.removeAllRanges() } catch {}
    }
    m.x = dx
    m.y = dy
    m.vx = m.vy = 0
    write(press.el, m)
  }

  /** Spring home; when `act`, click what was pressed as it arrives */
  const release = (/** @type {HTMLElement} */ el, /** @type {boolean} */ act, hit = null) => {
    const m = stateOf(el)
    m.held = false
    m.ts = 1
    if (act) {
      m.onArrive = () => {
        const target = /** @type {HTMLElement|null} */ (hit && /** @type {any} */ (hit).isConnected ? hit : el)
        releasing = true
        try { target?.click() } finally { releasing = false }
      }
    }
    if (reducedMotion()) {
      m.x = m.y = 0
      write(el, m)
      const done = m.onArrive
      m.onArrive = null
      if (done) done()
    }
    run(el)
  }

  // Counted on window: a mouse can be released anywhere
  const onAnyUp = (/** @type {PointerEvent} */ e) => { down.delete(e.pointerId) }

  const onUp = (/** @type {PointerEvent} */ e) => {
    if (!press || press.id !== e.pointerId) return
    const p = press
    press = null
    if (!p.active) {
      setScale(p.el, 1) // a tap: let the element's own click handler act
      return
    }
    suppress = true
    // A cancelled gesture (e.g. the browser took it for a scroll) only springs back
    release(p.el, e.type === 'pointerup', p.hit)
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
    if (releasing || !suppress) return
    suppress = false
    e.stopPropagation()
    e.preventDefault()
  }

  const prevTouchAction = root.style.touchAction
  if (touchAction) root.style.touchAction = touchAction
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
 * React wrapper: attaches drag-and-spring-back to `ref.current`.
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
