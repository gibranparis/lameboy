// src/lib/haptics.js
'use client'

/**
 * A light haptic tap where the device allows it: navigator.vibrate on
 * Android, and on iOS 18+ Safari (no vibrate) toggling a hidden
 * <input type="checkbox" switch>, which ticks the Taptic Engine. iOS only
 * honours it inside a tap, so call it from a click / pointerup.
 * @param {number | number[]} [pattern] vibrate pattern in ms (Android)
 */
export function haptic(pattern = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
      return
    }
  } catch {}
  try {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    label.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none'
    document.body.appendChild(label)
    label.click()
    label.remove()
  } catch {}
}
