// src/lib/shake.js
'use client'

// Shake the phone: a few sharp jolts close together (device motion) count as
// a shake. iOS only shares motion after the person allows it, and only asks
// from inside a tap, so askForMotion() is wired to the first tap.

const JOLT = 22 // m/s² change between readings that counts as a jolt
const JOLTS = 3 // jolts needed...
const WITHIN_MS = 900 // ...this close together
const COOLDOWN_MS = 1200 // one shake, one call

/**
 * Asks for motion access where the browser requires it (iOS 13+). Must run
 * inside a user gesture; elsewhere it's a no-op.
 */
export function askForMotion() {
  const DME = /** @type {any} */ (typeof window !== 'undefined' ? window.DeviceMotionEvent : undefined)
  if (DME && typeof DME.requestPermission === 'function') {
    DME.requestPermission().catch(() => {})
  }
}

/**
 * Calls `cb` when the device is shaken.
 * @param {() => void} cb
 * @returns {() => void} stop listening
 */
export function onShake(cb) {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return () => {}
  /** @type {number[]} */
  let jolts = []
  let last = /** @type {null | { x: number, y: number, z: number }} */ (null)
  let quietUntil = 0
  const onMotion = (/** @type {DeviceMotionEvent} */ e) => {
    const a = e.accelerationIncludingGravity
    if (!a || a.x == null || a.y == null || a.z == null) return
    const now = performance.now()
    if (last && now > quietUntil) {
      const d = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z)
      if (d > JOLT) {
        jolts = jolts.filter((t) => now - t < WITHIN_MS)
        jolts.push(now)
        if (jolts.length >= JOLTS) {
          jolts = []
          quietUntil = now + COOLDOWN_MS
          cb()
        }
      }
    }
    last = { x: a.x, y: a.y, z: a.z }
  }
  window.addEventListener('devicemotion', onMotion)
  return () => window.removeEventListener('devicemotion', onMotion)
}
