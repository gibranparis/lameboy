// src/components/OrbRain.jsx
// @ts-check
'use client'

import { useEffect, useRef } from 'react'
import { RAIN_COVER_MS } from '@/lib/orbRainScene'

// The splash → shop transition: once "Let All Mankind Evolve" is up, clones
// of the splash orb rain down over the whole page, pinball off their spots
// until the screen is covered (the shop swaps in underneath), then pour on
// out the bottom. The scene itself is lib/orbRainScene; this hosts it, on a
// worker where the browser can draw WebGL off the main thread.
export const RAIN_DELAY_MS = 450 // after the proceed text shows
export { RAIN_COVER_MS }

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const offscreenOk = () =>
  typeof window !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype

/** @type {Worker | null} */
let warm = null
/** Start the rain's worker (and its download) ahead of time, e.g. on the gate */
export function prepareOrbRain() {
  if (warm || !offscreenOk() || reducedMotion()) return
  try {
    warm = new Worker(new URL('../lib/orbRain.worker.js', import.meta.url), { type: 'module' })
  } catch {
    warm = null
  }
}

/**
 * Full-screen orb rain. Mount it when the transition starts; it plays once,
 * calls onCovered when the orbs cover the page (swap what's underneath then)
 * and onDone when the last orb has left the screen.
 * @param {{ onCovered?: () => void, onDone?: () => void }} props
 */
export default function OrbRain({ onCovered, onDone }) {
  const ref = useRef(/** @type {HTMLCanvasElement | null} */ (null))
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const coveredRef = useRef(onCovered)
  coveredRef.current = onCovered

  useEffect(() => {
    const canvas = ref.current
    let covered = false
    let done = false
    const cover = () => {
      if (covered) return
      covered = true
      coveredRef.current?.()
    }
    const finish = () => {
      cover()
      if (done) return
      done = true
      doneRef.current?.()
    }
    if (!canvas || reducedMotion()) {
      finish()
      return
    }
    const W = window.innerWidth
    const H = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const coarse = !!window.matchMedia?.('(pointer:coarse)').matches

    if (offscreenOk()) {
      prepareOrbRain()
      const worker = warm
      warm = null
      if (worker) {
        let offscreen
        try {
          offscreen = canvas.transferControlToOffscreen()
        } catch {
          offscreen = null
        }
        if (offscreen) {
          worker.onmessage = (e) => {
            if (e.data?.type === 'covered') cover()
            else if (e.data?.type === 'done') finish()
          }
          // a worker that can't run it hands straight over
          worker.onerror = finish
          worker.postMessage({ type: 'start', canvas: offscreen, W, H, dpr, coarse }, [offscreen])
          return () => {
            worker.postMessage({ type: 'stop' })
            worker.terminate()
          }
        }
        worker.terminate()
      }
    }

    // On the page itself
    let stop = () => {}
    let alive = true
    import('@/lib/orbRainScene').then(({ runOrbRain }) => {
      if (!alive) return
      stop = runOrbRain({ canvas, W, H, dpr, coarse, onCovered: cover, onDone: finish })
    }, finish)
    return () => {
      alive = false
      stop()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483000,
        pointerEvents: 'none',
      }}
    />
  )
}
