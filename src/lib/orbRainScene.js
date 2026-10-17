// src/lib/orbRainScene.js
// @ts-check

import * as THREE from 'three'

// The orb rain itself (see components/OrbRain): clones of the splash orb
// (BlueOrbCross3D's cross, materials, lights and glow) pour down over the
// page, pinball off their spots until the screen is covered (the shop swaps
// in underneath) and pour on out the bottom in one motion. Runs on a
// worker's OffscreenCanvas where it can, so a busy page never stalls it, or
// on the page's own canvas otherwise.

export const RAIN_COVER_MS = 1900 // from the first drop to a covered screen (at the earliest)
const RAIN_COVER_MAX_MS = 3200 // covered by now even if some are still bouncing high
const RAIN_CLEAR_MS = 1400 // the pour-out, at the latest

// The splash orb's shape (BlueOrbCross3D as OrbShell draws it on the gate)
const R = 0.144 * 1.2 // ball radius
const GLOW_SCALE = 1.25
const CAMERA_Z = 3 // its camera distance, for the same depth as it turns
// Drawn at the splash orb's own size: its 110px box shows this many world
// units (fov 45° at CAMERA_Z), so px per unit is the same for every clone
const SPLASH_BOX_PX = 110
const K = SPLASH_BOX_PX / (2 * CAMERA_Z * Math.tan(Math.PI / 8))
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

// Ball directions in the order BlueOrbCross3D lays them out: centre, ±x, ±y,
// ±z; ball b sits on arm AXIS_OF[b] (the centre on none)
const DIRS = [
  [0, 0, 0],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const AXIS_OF = [-1, 0, 0, 1, 1, 2, 2]
const AXES = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

/**
 * The orb's colour forms: the rainbow cross it rests in (chakra balls, white
 * crown core, seafoam arms), the rainbow frenzy it hands over to the shop in,
 * each solid chakra colour it steps through, and the shop orb's seafoam,
 * night white and black glow.
 * @typedef {{ solid: boolean, frenzy?: boolean, cores: string[], halos: string[], bar: string, barHalo: string }} Form
 */
/** @type {Form} */
const RAINBOW = {
  solid: false,
  cores: [CHAKRA.crownW, CHAKRA.root, CHAKRA.sacral, CHAKRA.solar, CHAKRA.heart, CHAKRA.throat, CHAKRA.thirdEye],
  halos: [CHAKRA.crownV, CHAKRA.root, CHAKRA.sacral, CHAKRA.solar, CHAKRA.heart, CHAKRA.throat, CHAKRA.thirdEye],
  bar: SEAFOAM,
  barHalo: SEAFOAM,
}
/** @returns {Form} */
const solidForm = (c, halo = c) => ({ solid: true, cores: Array(7).fill(c), halos: Array(7).fill(halo), bar: c, barHalo: halo })
/** @type {[Form, number][]} form, weight */
const FORMS = [
  [RAINBOW, 3],
  [{ ...RAINBOW, frenzy: true }, 2],
  [solidForm(CHAKRA.root, '#880011'), 1], // its halo goes blood-crimson on the splash
  [solidForm(CHAKRA.sacral), 1],
  [solidForm(CHAKRA.solar), 1],
  [solidForm(CHAKRA.heart), 1],
  [solidForm(CHAKRA.throat), 1],
  [solidForm(CHAKRA.thirdEye), 1],
  [solidForm(CHAKRA.crownV), 1],
  [solidForm(SEAFOAM), 1],
  [solidForm('#ffffff'), 0.3], // the night orb
  [solidForm('#111111', '#444444'), 0.4], // the black glow
]

/**
 * The cross's builds: the gate's, the shop's (wider spaced, thicker arms), a
 * flat plus with no depth arm, and one with no vertical arm that spins open
 * like a wheel
 * @typedef {{ off: number, arm: number, axes: [boolean, boolean, boolean] }} Shape
 * @type {[Shape, number][]}
 */
const SHAPES = [
  [{ off: 2.05, arm: 0.33, axes: [true, true, true] }, 4],
  [{ off: 2.25, arm: 0.35, axes: [true, true, true] }, 2],
  [{ off: 2.05, arm: 0.33, axes: [true, true, false] }, 1.2],
  [{ off: 2.25, arm: 0.35, axes: [true, false, true] }, 0.8],
]

/** @template T @param {[T, number][]} list @returns {T} */
function pick(list) {
  let r = Math.random() * list.reduce((s, [, w]) => s + w, 0)
  for (const [v, w] of list) if ((r -= w) <= 0) return v
  return list[0][0]
}

// Pinball, like a flicked control on the shop page (lib/dragSnap): a firm
// fall, lively bounces off each orb's resting spot and the screen edges, a
// kick and a change of roll on every hit
const G = 4200 // px/s²
const DRAG = 0.3 // per second
const BOUNCE = 0.7 // speed kept off the floor
const WALL_BOUNCE = 0.86 // and off a screen edge (as FLING_BOUNCE)
const MAX_REBOUND = 1100 // px/s, so a long fall still bounces near its spot
const REST_V = 170 // px/s: slower than this off the floor and it stays down
const HOME_K = 14 // per s²: a light pull back over its own spot
const HOME_C = 5 // per s: so it settles there rather than swinging about it

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
 * Play the rain once on `canvas` (an HTMLCanvasElement or OffscreenCanvas
 * already sized by CSS to W×H). onCovered fires when the orbs cover the
 * page, onDone when the last has left it. The clock runs on animation time,
 * so a slow device just plays it slower, never uncovered.
 * @param {{ canvas: HTMLCanvasElement | OffscreenCanvas, W: number, H: number, dpr: number, coarse: boolean,
 *   onCovered: () => void, onDone: () => void }} opts
 * @returns {() => void} stops it and frees the GPU
 */
export function runOrbRain({ canvas, W, H, dpr, coarse, onCovered, onDone }) {
  const g0 = /** @type {any} */ (globalThis)
  const raf = g0.requestAnimationFrame ? (cb) => g0.requestAnimationFrame(cb) : (cb) => setTimeout(() => cb(performance.now()), 16)
  const caf = g0.cancelAnimationFrame ? (id) => g0.cancelAnimationFrame(id) : (id) => clearTimeout(id)

  /** @type {THREE.WebGLRenderer} */
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch {
    onCovered()
    onDone()
    return () => {}
  }
  renderer.setPixelRatio(Math.min(1.5, dpr || 1))
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
  const glowK = coarse ? 0.55 : 1

  // Landing spots tile the page (jittered) closely enough for orbs the
  // splash orb's size to cover it completely
  const base = 2 * (R * 2.05 + R * GLOW_SCALE) * K // the gate cross, glow to glow (px)
  const step = base * 0.42
  const orbs = []
  for (let y = -step / 2; y < H + step; y += step) {
    for (let x = -step / 2; x < W + step; x += step) {
      const shape = pick(SHAPES)
      const off = R * shape.off
      const size = 2 * (off + R * GLOW_SCALE) * K
      const homeX = x + (Math.random() - 0.5) * step
      const restY = y + (Math.random() - 0.5) * step
      const y0 = -size - Math.random() * H * 0.25
      const vy = 400 + Math.random() * 450
      // Each lands at its own moment in one sweep down the page (the top a
      // touch first, as it pours in), so the pile fills evenly, with no
      // early drops sitting about waiting for the last
      const fall = (Math.sqrt(vy * vy + 2 * G * (restY - y0)) - vy) / G
      const land = 380 + Math.max(0, Math.min(1, y / H)) * 260 + Math.random() * 420
      orbs.push({
        homeX,
        x: homeX + (Math.random() - 0.5) * step * 1.4,
        restY,
        y: y0,
        vx: (Math.random() - 0.5) * 300,
        vy,
        size,
        form: pick(FORMS),
        shape,
        off,
        k: K, // px per world unit
        start: Math.max(0, land - fall * 1000),
        // turning like the splash orb, each at its own pace, either way, some
        // with the axis tipped so they tumble
        turn: Math.random() * Math.PI * 2,
        turnW: ((SPLASH_RPM * Math.PI * 2) / 60) * (0.6 + Math.random() * 1) * (Math.random() < 0.25 ? -1 : 1),
        tilt: Math.random() < 0.35 ? (Math.random() - 0.5) * 1.6 : 0,
        roll: (Math.random() - 0.5) * 0.6,
        rollW: (Math.random() - 0.5) * 2.5,
        hue: Math.random(), // a frenzy orb's place in the colour cycle
        squash: 0,
        drop: 0, // the moment its floor gives way (ms)
        down: false, // at rest on its spot
        gone: false, // poured out the bottom
        slot: 0, // its index within its group's instances
        z: 0,
      })
    }
  }
  // Later drops land on top of earlier ones
  orbs.sort((a, b) => a.start - b.start)
  const zStep = base * 1.2
  orbs.forEach((o, i) => (o.z = i * zStep))

  // One set of instanced meshes for the solid forms and one for the rainbow
  // ones (they light differently), each mesh holding that part of every orb
  // in the group
  const sphereGeo = new THREE.SphereGeometry(R, 18, 12)
  const haloGeo = new THREE.SphereGeometry(R * GLOW_SCALE, 14, 10)
  // unit-length arms, stretched to each orb's spacing
  const armGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true)
  const armGlowGeo = new THREE.CylinderGeometry(1.28, 1.28, 1.02, 10, 1, true)
  const haloMat = (/** @type {number} */ op) =>
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: op,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  const c = new THREE.Color()
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
      frenzy: members.filter((o) => o.form.frenzy),
      empty: members.length === 0,
    }
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
  const T = { cosT: 1, sinT: 0, cosX: 1, sinX: 0, cosR: 1, sinR: 0, sx: 1, sy: 1 }

  /**
   * Where a point of the cross (local units) lands on screen for orb o:
   * turned about its axis, the axis tipped, rolled about the view axis, the
   * splash camera's perspective, then scaled, squashed and placed. Returns
   * its depth factor.
   */
  const place = (o, lx, ly, lz, /** @type {THREE.Vector3} */ out) => {
    const x1 = lx * T.cosT + lz * T.sinT
    const z1 = -lx * T.sinT + lz * T.cosT
    const y2 = ly * T.cosX - z1 * T.sinX
    const z2 = ly * T.sinX + z1 * T.cosX
    const x3 = x1 * T.cosR - y2 * T.sinR
    const y3 = x1 * T.sinR + y2 * T.cosR
    const f = CAMERA_Z / (CAMERA_Z - z2)
    const k = o.k
    out.set(o.x + x3 * f * k * T.sx, -(o.y + o.squash * o.size * 0.08) + y3 * f * k * T.sy, o.z + z2 * k)
    return f
  }

  /** Write orb o's parts into its group's instances */
  const pose = (o) => {
    const g = groupOf(o)
    const i = o.slot
    const axes = o.shape.axes
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
    const k = o.k
    T.sx = 1 + o.squash * 0.2
    T.sy = 1 - o.squash * 0.2
    T.cosT = Math.cos(o.turn)
    T.sinT = Math.sin(o.turn)
    T.cosX = Math.cos(o.tilt)
    T.sinX = Math.sin(o.tilt)
    T.cosR = Math.cos(o.roll)
    T.sinR = Math.sin(o.roll)
    // a ball: an ellipsoid while squashed, nearer ones bigger as it turns
    Q.identity()
    for (let b = 0; b < 7; b++) {
      const ax = AXIS_OF[b]
      if (ax >= 0 && !axes[ax]) {
        g.cores.setMatrixAt(i * 7 + b, ZERO)
        g.halos.setMatrixAt(i * 7 + b, ZERO)
        continue
      }
      const d = DIRS[b]
      const f = place(o, d[0] * o.off, d[1] * o.off, d[2] * o.off, P)
      S.set(k * f * T.sx, k * f * T.sy, k * f)
      M.compose(P, Q, S)
      g.cores.setMatrixAt(i * 7 + b, M)
      g.halos.setMatrixAt(i * 7 + b, M)
    }
    // an arm: a tube between where its two ends land
    const h = o.off - R * 0.12
    const armR = R * o.shape.arm
    for (let a = 0; a < 3; a++) {
      if (!axes[a]) {
        g.bars.setMatrixAt(i * 3 + a, ZERO)
        g.barHalos.setMatrixAt(i * 3 + a, ZERO)
        continue
      }
      const ax = AXES[a]
      const fa = place(o, ax[0] * h, ax[1] * h, ax[2] * h, A)
      const fb = place(o, -ax[0] * h, -ax[1] * h, -ax[2] * h, B)
      P.addVectors(A, B).multiplyScalar(0.5)
      B.sub(A)
      const len = B.length() || 1e-6
      Q.setFromUnitVectors(UP, B.multiplyScalar(1 / len))
      const rk = (armR * k * (fa + fb)) / 2
      S.set(rk, len, rk)
      M.compose(P, Q, S)
      g.bars.setMatrixAt(i * 3 + a, M)
      g.barHalos.setMatrixAt(i * 3 + a, M)
    }
    Q.identity()
  }

  let id = 0
  let stopped = false
  let last = performance.now()
  let t = 0 // animation time (ms)
  let clearAt = 0 // set once covered

  const frame = (now) => {
    if (stopped) return
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
        onCovered()
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
      // The pile pours out from the bottom up, like sand from a glass
      if (clearAt && !o.drop) o.drop = clearAt + (1 - Math.max(0, Math.min(1, o.restY / H))) * 380 + Math.random() * 120
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
        // the floor gives way: it slips off its spot and on down, no stop
        o.down = false
        o.vx = (Math.random() - 0.5) * 220
        o.rollW = o.vx / 220
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

    // the splash orb's glow pulse, and the frenzy orbs' cycling colours
    const secs = t / 1000
    const pulse = 0.85 + Math.sin(secs * 3.6) * 0.15
    for (const g of groups) {
      if (g.empty) continue
      g.cores.instanceMatrix.needsUpdate = true
      g.bars.instanceMatrix.needsUpdate = true
      g.halos.instanceMatrix.needsUpdate = true
      g.barHalos.instanceMatrix.needsUpdate = true
      g.haloMat.opacity = g.glow * pulse
      g.barHaloMat.opacity = g.glow * pulse * 0.5
      if (g.frenzy.length) {
        for (const o of g.frenzy) {
          if (o.gone) continue
          for (let b = 0; b < 7; b++) {
            c.setHSL((secs * 0.9 + o.hue + b / 7) % 1, 1, 0.5)
            g.cores.setColorAt(o.slot * 7 + b, c)
            g.halos.setColorAt(o.slot * 7 + b, c)
          }
          for (let a = 0; a < 3; a++) {
            c.setHSL((secs * 0.9 + o.hue + (a * 2 + 1) / 7) % 1, 1, 0.5)
            g.bars.setColorAt(o.slot * 3 + a, c)
            g.barHalos.setColorAt(o.slot * 3 + a, c)
          }
        }
        for (const m of [g.cores, g.halos, g.bars, g.barHalos]) if (m.instanceColor) m.instanceColor.needsUpdate = true
      }
    }
    renderer.render(scene, camera)

    if (clearAt && (onScreen === 0 || t > clearAt + RAIN_CLEAR_MS + 1200)) {
      stop()
      onDone()
      return
    }
    id = raf(frame)
  }
  id = raf(frame)

  function stop() {
    if (stopped) return
    stopped = true
    caf(id)
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
  return stop
}
