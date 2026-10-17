// src/lib/orbRain.worker.js
// Runs the orb rain (lib/orbRainScene) on an OffscreenCanvas, off the main
// thread, so the shop mounting underneath never stalls it

import { runOrbRain } from './orbRainScene'

/** @type {null | (() => void)} */
let stop = null

self.onmessage = (e) => {
  const d = e.data
  if (d?.type === 'start') {
    stop?.()
    stop = runOrbRain({
      canvas: d.canvas,
      W: d.W,
      H: d.H,
      dpr: d.dpr,
      coarse: d.coarse,
      onCovered: () => self.postMessage({ type: 'covered' }),
      onDone: () => {
        stop = null
        self.postMessage({ type: 'done' })
      },
    })
  } else if (d?.type === 'stop') {
    stop?.()
    stop = null
  }
}
