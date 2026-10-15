// src/components/OrbRain.jsx
// @ts-check
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// The splash → shop transition: once "Let All Mankind Evolve" is up, clones
// of the splash orb (same 3D cross, same lighting and glow, spinning the same
// way) rain down over the whole page in its colour forms, pinball off the
// floor and the screen edges until the screen is covered (the shop swaps in
// underneath), then drop away off the bottom to reveal the grid.
export const RAIN_DELAY_MS = 450 // after the proceed text shows
export const RAIN_COVER_MS = 2400 // from the first drop to a covered screen (at the earliest)
const RAIN_COVER_MAX_MS = 3600 // covered by now even if some are still bouncing high
const RAIN_CLEAR_MS = 900 // the drop-away

// The splash orb's shape (BlueOrbCross3D as OrbShell draws it on the gate)
const GEOM_SCALE = 1.2
const OFFSET_FACTOR = 2.05
const ARM_RATIO = 0.33
const GLOW_SCALE = 1.25
const CAMERA_Z = 3 // its camera distance, for the same depth as it turns
const SPLASH_RPM = 44

const CHAKRA = {
  root: '#cc0014',
  sacral: '#e05500',
  solar: '#ffd400',
  heart: '#00a832',
  throat: '#0066ff',
  thirdEye: '#6d5cff',
  crownV: '#c86bff',
  crownW: '#d8d0f0',
}
const SEAFOAM = '#32ffc7'

// Ball centres in the order BlueOrbCross3D lays them out: centre, ±x, ±y, ±z
const R = 0.144 * GEOM_SCALE
const OFFSET = R * OFFSET_FACTOR
const ARM_R = R * ARM_RATIO
const ARM_LEN = 2 * (OFFSET - R * 0.12)
const CENTERS = [
  [0, 0, 0],
  [OFFSET, 0, 0],
  [-OFFSET, 0, 0],
  [0, OFFSET, 0],
  [0, -OFFSET, 0],
  [0, 0, OFFSET],
  [0, 0, -OFFSET],
]
const AXES = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]
const EXTENT = OFFSET + R * GLOW_SCALE // centre to the edge of the outer glow

/**
 * The orb's colour forms: the rainbow cross it rests in (chakra balls, white
 * crown core, seafoam arms) and each solid chakra colour it steps through.
 * @typedef {{ solid: boolean, cores: string[], halos: string[], bar: string, barHalo: string }} Form
 * @type {Form[]}
 */
const RAINBOW = {
  solid: false,
  cores: [CHAKRA.crownW, CHAKRA.root, CHAKRA.sacral, CHAKRA.solar, CHAKRA.heart, CHAKRA.throat, CHAKRA.thirdEye],
  halos: [CHAKRA.crownV, CHAKRA.root, CHAKRA.sacral, CHAKRA.solar, CHAKRA.heart, CHAKRA.throat, CHAKRA.thirdEye],
  bar: SEAFOAM,
  barHalo: SEAFOAM,
}
const solidForm = (c, halo = c) => ({ solid: true, cores: Array(7).fill(c), halos: Array(7).fill(halo), bar: c, barHalo: halo })
const FORMS = [
  RAINBOW,
  RAINBOW, // the original look turns up a bit more often
  solidForm(CHAKRA.root, '#880011'), // its halo goes blood-crimson on the splash
  solidForm(CHAKRA.sacral),
  solidForm(CHAKRA.solar),
  solidForm(CHAKRA.heart),
  solidForm(CHAKRA.throat),
  solidForm(CHAKRA.thirdEye),
  solidForm(CHAKRA.crownV),
]

// Pinball, like a flicked control on the shop page (lib/dragSnap): a firm
// fall, lively bounces off each orb's resting spot and the screen edges, a
// kick and a change of roll on every hit
const G = 4200 // px/s²
const DRAG = 0.3 // per second
const BOUNCE = 0.72 // speed kept off the floor
const WALL_BOUNCE = 0.86 // and off a screen edge (as FLING_BOUNCE)
const MAX_REBOUND = 1150 // px/s, so a long fall still bounces near its spot
const REST_V = 160 // px/s: slower than this off the floor and it stays down
const HOME_K = 14 // per s²: a light pull back over its own spot
const HOME_C = 5 // per s: so it settles there rather than swinging about it

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** MeshStandardMaterial whose emissive takes each instance's colour too, as
 * the splash orb's balls glow in their own colour */
function glowingMat(/** @type {THREE.MeshStandardMaterialParameters} */ params) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', ...params })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 totalEmissiveRadiance = emissive;',
      'vec3 totalEmissiveRadiance = emissive * vColor;'
    )
  }
  return m
}

/**
 * Full-screen orb rain. Mount it when the transition starts; it plays once,
 * calls onCovered when the orbs cover the page (swap what's underneath then)
 * and onDone when the last orb has left the screen. Its clock runs on
 * animation time, so a slow device just plays it slower, never uncovered.
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
    if (!canvas || reducedMotion()) {
      coveredRef.current?.()
      doneRef.current?.()
      return
    }
    const W = window.innerWidth
    const H = window.innerHeight
    /** @type {THREE.WebGLRenderer} */
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      coveredRef.current?.()
      doneRef.current?.()
      return
    }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
    renderer.setSize(W, H, false)
    renderer.setClearColor(0x000000, 0)
    // as react-three-fiber sets up the splash orb's canvas
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Pixel units: x right, y up (screen y is -y), camera looking down -z
    const camera = new THREE.OrthographicCamera(0, W, 0, -H, 0.1, 1e6)
    camera.position.z = 5e5
    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 1.25)
    key.position.set(3, 2, 4)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-3, -2, -4)
    scene.add(key, fill)

    // The splash orb's glow is softer on touch screens
    const coarse = !!window.matchMedia?.('(pointer:coarse)').matches
    const glowK = coarse ? 0.55 : 1

    // Base size scales with the screen; each drop is 0.65–1.4× that. Landing
    // spots tile the page (jittered) so the orbs cover it completely.
    const base = Math.max(70, Math.min(124, Math.min(W, H) / 4.4))
    const step = base * 0.42
    const orbs = []
    for (let y = -step / 2; y < H + step; y += step) {
      for (let x = -step / 2; x < W + step; x += step) {
        const size = base * (0.65 + Math.random() * 0.75)
        const homeX = x + (Math.random() - 0.5) * step
        orbs.push({
          homeX,
          x: homeX + (Math.random() - 0.5) * step,
          restY: y + (Math.random() - 0.5) * step,
          y: -size - Math.random() * H * 0.2,
          vx: (Math.random() - 0.5) * 260,
          vy: 300 + Math.random() * 400,
          size,
          form: FORMS[Math.floor(Math.random() * FORMS.length)],
          // they pour in all over, the bottom of the pile a touch first
          start: Math.random() * RAIN_COVER_MS * 0.28 + (1 - y / H) * 120,
          // turning like the splash orb, each at its own angle and pace
          turn: Math.random() * Math.PI * 2,
          turnW: ((SPLASH_RPM * Math.PI * 2) / 60) * (0.8 + Math.random() * 0.4),
          roll: (Math.random() - 0.5) * 0.5,
          rollW: (Math.random() - 0.5) * 2,
          squash: 0,
          drop: 0, // the moment it starts falling away (ms)
          down: false, // at rest on its spot
          gone: false, // fell off the bottom
          slot: 0, // its index within its group's instances
          z: 0,
        })
      }
    }
    // Later drops land on top of earlier ones
    orbs.sort((a, b) => a.start - b.start)
    const zStep = base * 1.6
    orbs.forEach((o, i) => (o.z = i * zStep))

    // One set of instanced meshes for the solid forms and one for the
    // rainbow form (they light differently), each mesh holding that part of
    // every orb in the group
    const sphereGeo = new THREE.SphereGeometry(R, 28, 20)
    const haloGeo = new THREE.SphereGeometry(R * GLOW_SCALE, 24, 16)
    const armGeo = new THREE.CylinderGeometry(ARM_R, ARM_R, ARM_LEN, 16, 1, true)
    const armGlowGeo = new THREE.CylinderGeometry(ARM_R * 1.28, ARM_R * 1.28, ARM_LEN * 1.02, 16, 1, true)
    const haloMat = (/** @type {number} */ op) =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    const groups = [true, false].map((solid) => {
      const members = orbs.filter((o) => o.form.solid === solid)
      members.forEach((o, i) => (o.slot = i))
      const n = Math.max(1, members.length)
      // BlueOrbCross3D's materials for a solid override colour and for its
      // chakra colours
      const core = glowingMat(
        solid
          ? { roughness: 0.42, metalness: 0.05, emissiveIntensity: 0.75, toneMapped: false }
          : { roughness: 0.28, metalness: 0.25, emissiveIntensity: 1.15, toneMapped: true }
      )
      const bar = glowingMat(
        solid
          ? { roughness: 0.42, metalness: 0.05, emissiveIntensity: 0.55, toneMapped: false }
          : { roughness: 0.32, metalness: 0.25, emissiveIntensity: 0.6, toneMapped: true }
      )
      const glow = (solid ? 1 : 0.9) * glowK
      const halo = haloMat(glow)
      const barHalo = haloMat(glow * 0.5)
      const g = {
        glow,
        haloMat: halo,
        barHaloMat: barHalo,
        cores: new THREE.InstancedMesh(sphereGeo, core, n * 7),
        bars: new THREE.InstancedMesh(armGeo, bar, n * 3),
        halos: new THREE.InstancedMesh(haloGeo, halo, n * 7),
        barHalos: new THREE.InstancedMesh(armGlowGeo, barHalo, n * 3),
        empty: members.length === 0,
      }
      const c = new THREE.Color()
      members.forEach((o, i) => {
        for (let b = 0; b < 7; b++) {
          g.cores.setColorAt(i * 7 + b, c.set(o.form.cores[b]))
          g.halos.setColorAt(i * 7 + b, c.set(o.form.halos[b]))
        }
        for (let a = 0; a < 3; a++) {
          g.bars.setColorAt(i * 3 + a, c.set(o.form.bar))
          g.barHalos.setColorAt(i * 3 + a, c.set(o.form.barHalo))
        }
      })
      for (const m of [g.cores, g.bars, g.halos, g.barHalos]) {
        m.frustumCulled = false
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        if (!g.empty) scene.add(m)
      }
      return g
    })
    const groupOf = (o) => groups[o.form.solid ? 0 : 1]

    // Scratch objects for placing the parts
    const M = new THREE.Matrix4()
    const P = new THREE.Vector3()
    const Q = new THREE.Quaternion()
    const S = new THREE.Vector3()
    const A = new THREE.Vector3()
    const B = new THREE.Vector3()
    const UP = new THREE.Vector3(0, 1, 0)
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

    /**
     * Where a point of the cross (local units) lands on screen for orb o:
     * turned about y, rolled about the view axis, the splash camera's
     * perspective, then scaled, squashed and placed. Returns its depth factor.
     */
    const place = (o, k, sx, sy, cosT, sinT, cosR, sinR, lx, ly, lz, /** @type {THREE.Vector3} */ out) => {
      const x1 = lx * cosT + lz * sinT
      const z1 = -lx * sinT + lz * cosT
      const x2 = x1 * cosR - ly * sinR
      const y2 = x1 * sinR + ly * cosR
      const f = CAMERA_Z / (CAMERA_Z - z1)
      out.set(o.x + x2 * f * k * sx, -(o.y + o.squash * o.size * 0.08) + y2 * f * k * sy, o.z + z1 * k)
      return f
    }

    /** Write orb o's parts into its group's instances */
    const pose = (o) => {
      const g = groupOf(o)
      const i = o.slot
      if (o.gone) {
        for (let b = 0; b < 7; b++) {
          g.cores.setMatrixAt(i * 7 + b, ZERO)
          g.halos.setMatrixAt(i * 7 + b, ZERO)
        }
        for (let a = 0; a < 3; a++) {
          g.bars.setMatrixAt(i * 3 + a, ZERO)
          g.barHalos.setMatrixAt(i * 3 + a, ZERO)
        }
        return
      }
      const k = o.size / (2 * EXTENT)
      const sx = 1 + o.squash * 0.2
      const sy = 1 - o.squash * 0.2
      const cosT = Math.cos(o.turn)
      const sinT = Math.sin(o.turn)
      const cosR = Math.cos(o.roll)
      const sinR = Math.sin(o.roll)
      // a ball: an ellipsoid while squashed, nearer ones bigger as it turns
      Q.identity()
      for (let b = 0; b < 7; b++) {
        const c = CENTERS[b]
        const f = place(o, k, sx, sy, cosT, sinT, cosR, sinR, c[0], c[1], c[2], P)
        S.set(k * f * sx, k * f * sy, k * f)
        M.compose(P, Q, S)
        g.cores.setMatrixAt(i * 7 + b, M)
        g.halos.setMatrixAt(i * 7 + b, M)
      }
      // an arm: a tube between where its two ends land
      for (let a = 0; a < 3; a++) {
        const ax = AXES[a]
        const h = ARM_LEN / 2
        const fa = place(o, k, sx, sy, cosT, sinT, cosR, sinR, ax[0] * h, ax[1] * h, ax[2] * h, A)
        const fb = place(o, k, sx, sy, cosT, sinT, cosR, sinR, -ax[0] * h, -ax[1] * h, -ax[2] * h, B)
        P.addVectors(A, B).multiplyScalar(0.5)
        B.sub(A)
        const len = B.length() || 1e-6
        Q.setFromUnitVectors(UP, B.multiplyScalar(1 / len))
        const rk = (k * (fa + fb)) / 2
        S.set(rk, len / ARM_LEN, rk)
        M.compose(P, Q, S)
        g.bars.setMatrixAt(i * 3 + a, M)
        g.barHalos.setMatrixAt(i * 3 + a, M)
      }
      Q.identity()
    }

    let raf = 0
    let last = performance.now()
    let t = 0 // animation time (ms)
    let clearAt = 0 // set once covered

    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      t += dt * 1000

      // Covered once (nearly) every orb is down on or bouncing low over its
      // spot, so the swap underneath never shows through
      if (!clearAt && t >= RAIN_COVER_MS) {
        let near = 0
        for (const o of orbs) if (t >= o.start && Math.abs(o.y - o.restY) < o.size * 0.2 && Math.abs(o.x - o.homeX) < o.size * 0.3) near++
        if (near >= orbs.length * 0.98 || t >= RAIN_COVER_MAX_MS) {
          clearAt = t
          coveredRef.current?.()
        }
      }

      let onScreen = 0
      for (const o of orbs) {
        if (o.gone) continue
        if (t < o.start) {
          onScreen++
          pose(o)
          continue
        }
        if (clearAt && !o.drop) o.drop = clearAt + (1 - o.restY / H) * 220 + Math.random() * 260
        const falling = o.drop && t >= o.drop
        // it keeps turning like the splash orb, down or not
        o.turn += o.turnW * dt
        o.squash *= Math.pow(0.0004, dt) // springs back quickly
        if (o.down && !falling) {
          // eases the rest of the way over its spot
          o.x += (o.homeX - o.x) * (1 - Math.pow(0.002, dt))
          onScreen++
          pose(o)
          continue
        }
        if (o.down) {
          // the floor gives way: off its spot with a little hop
          o.down = false
          o.vy = -260 - Math.random() * 240
          o.vx = (Math.random() - 0.5) * 320
          o.rollW = o.vx / 300
        }
        o.vy += (G - DRAG * o.vy) * dt
        o.y += o.vy * dt
        if (!falling) o.vx += ((o.homeX - o.x) * HOME_K - o.vx * HOME_C) * dt
        o.x += o.vx * dt
        o.roll += o.rollW * dt
        // screen edges (those resting off the edge bounce off their spot's side)
        const lo = Math.min(o.homeX, o.size * 0.3)
        const hi = Math.max(o.homeX, W - o.size * 0.3)
        if (o.x < lo && o.vx < 0) {
          o.x = lo
          o.vx = -o.vx * WALL_BOUNCE
          o.rollW = -o.rollW
        } else if (o.x > hi && o.vx > 0) {
          o.x = hi
          o.vx = -o.vx * WALL_BOUNCE
          o.rollW = -o.rollW
        }
        if (!falling && o.y >= o.restY && o.vy > 0) {
          // pinball off its spot: a lively rebound, a sideways kick and a new roll
          o.squash = Math.min(0.5, o.vy / 3200)
          o.y = o.restY
          const v = Math.min(MAX_REBOUND, o.vy * BOUNCE)
          if (v < REST_V) {
            o.vy = 0
            o.vx = 0
            o.rollW = 0
            o.down = true
          } else {
            o.vy = -v
            o.vx += (Math.random() - 0.5) * v * 0.4
            o.rollW = o.vx / 260 + (Math.random() - 0.5) * 1.5
          }
        }
        if (o.y - o.size / 2 > H) {
          o.gone = true
          pose(o)
          continue
        }
        onScreen++
        pose(o)
      }

      // the splash orb's glow pulse
      const pulse = 0.85 + Math.sin((t / 1000) * 3.6) * 0.15
      for (const g of groups) {
        if (g.empty) continue
        g.cores.instanceMatrix.needsUpdate = true
        g.bars.instanceMatrix.needsUpdate = true
        g.halos.instanceMatrix.needsUpdate = true
        g.barHalos.instanceMatrix.needsUpdate = true
        g.haloMat.opacity = g.glow * pulse
        g.barHaloMat.opacity = g.glow * pulse * 0.5
      }
      renderer.render(scene, camera)

      if (clearAt && (onScreen === 0 || t > clearAt + RAIN_CLEAR_MS + 1500)) {
        doneRef.current?.()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      for (const g of groups) {
        for (const m of [g.cores, g.bars, g.halos, g.barHalos]) {
          const mat = /** @type {THREE.Material} */ (m.material)
          mat.dispose()
          m.dispose()
        }
      }
      for (const geo of [sphereGeo, haloGeo, armGeo, armGlowGeo]) geo.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
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
