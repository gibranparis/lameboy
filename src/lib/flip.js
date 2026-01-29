/**
 * Reusable FLIP animation utilities
 * First, Last, Invert, Play pattern for smooth transitions
 */

const TIMING = {
  enter: 220,
  exit: 200,
  fadeEnter: 180,
  fadeExit: 200,
}

const EASING = {
  enter: 'cubic-bezier(.2,.9,.2,1)',
  exit: 'cubic-bezier(.2,.8,.2,1)',
}

function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Animate element from fromRect to its current position
 * @param {HTMLElement} element - Target element
 * @param {DOMRect|Object} fromRect - Starting position {left, top, width, height}
 * @param {Object} options - Animation options
 */
export function animateFlipEnter(element, fromRect, options = {}) {
  if (!element || !fromRect || prefersReducedMotion()) return Promise.resolve()

  const {
    duration = TIMING.enter,
    fadeDuration = TIMING.fadeEnter,
    easing = EASING.enter,
  } = options

  return new Promise((resolve) => {
    const target = element.getBoundingClientRect()

    const sx = fromRect.width / Math.max(1, target.width)
    const sy = fromRect.height / Math.max(1, target.height)
    const dx = fromRect.left - target.left
    const dy = fromRect.top - target.top

    // Set initial inverted state
    element.style.transition = 'none'
    element.style.opacity = '0'
    element.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    element.style.willChange = 'transform, opacity'

    // Trigger reflow
    element.offsetWidth

    // Animate to final state
    requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ${easing}, opacity ${fadeDuration}ms ease`
      element.style.transform = 'none'
      element.style.opacity = '1'

      setTimeout(() => {
        element.style.willChange = ''
        resolve()
      }, Math.max(duration, fadeDuration))
    })
  })
}

/**
 * Animate element from current position to toRect
 * @param {HTMLElement} element - Target element
 * @param {DOMRect|Object} toRect - Ending position {left, top, width, height}
 * @param {Object} options - Animation options
 */
export function animateFlipExit(element, toRect, options = {}) {
  if (!element || !toRect || prefersReducedMotion()) return Promise.resolve()

  const {
    duration = TIMING.exit,
    fadeDuration = TIMING.fadeExit,
    easing = EASING.exit,
    scaleDown = 0.94,
  } = options

  return new Promise((resolve) => {
    const current = element.getBoundingClientRect()

    const sx = toRect.width / Math.max(1, current.width)
    const sy = toRect.height / Math.max(1, current.height)
    const dx = toRect.left - current.left
    const dy = toRect.top - current.top

    element.style.willChange = 'transform, opacity'
    element.style.transition = `transform ${duration}ms ${easing}, opacity ${fadeDuration}ms ease`
    element.style.transform = scaleDown ? `scale(${scaleDown})` : 'none'
    element.style.opacity = '0'

    setTimeout(() => {
      element.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`

      setTimeout(() => {
        element.style.willChange = ''
        resolve()
      }, duration)
    }, fadeDuration)
  })
}

export { TIMING, EASING }
