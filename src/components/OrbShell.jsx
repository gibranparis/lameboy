// src/components/OrbShell.jsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BlueOrbCross3D from '@/components/BlueOrbCross3D'
import { DRAG_RESET, FLICK_SPEED, flightStep, launch, pinball } from '@/lib/dragSnap'

// Spin momentum (see "Spin momentum" below). The cross has 2-fold symmetry
// about its spin axis, so it's kept well under half a turn per 60 fps frame,
// past which it looks like it's turning backwards
const BOOST_PER_PX = 0.09 // extra rpm per px/s of drag
const MAX_BOOST = 180 // rpm while held
const MAX_FLING_BOOST = 230 // rpm right after a fling
const ORBIT_PER_PX = 0.014 // rad/s of the balls' turn round the finger per px/s of drag
const MAX_ORBIT = 12 // rad/s
const IDLE_ORBIT = 2.2 // rad/s, their lazy turn while held still

export default function OrbShell({
  mode, // 'gate' | 'shop'
  loaderShow, // boolean
  gateStep, // 0..7
  isProceeding, // boolean
  onAdvanceGate, // fn — starts the chakra sequence (no-op once running)
  onHoldChange, // fn(bool) — true while the orb is dragged or snapping back
  ctrlPx, // number
}) {
  const inGateLike = mode === 'gate' || loaderShow
  const inShop = mode === 'shop' && !loaderShow

  /* ===================== Shared sizing/position ===================== */

  // Gate: match your current 110px
  // Shop: match prior HeaderBar sizing (headerPx * 1.12)
  const height = useMemo(() => {
    if (inGateLike) return '110px'
    const n = Number(ctrlPx)
    const px = Number.isFinite(n) && n > 0 ? n : 64
    return `${Math.round(px * 1.12)}px`
  }, [ctrlPx, inGateLike])

  // Position the orb without moving it in the tree (no remount)
  /** @type {React.CSSProperties} */
  const shellStyle = useMemo(() => {
    if (inGateLike) {
      return /** @type {React.CSSProperties} */ ({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10050,
        pointerEvents: 'auto',
        transition: 'top 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), z-index 0s 0.6s',
      })
    }

    // Shop: center column of bottom header
    // Use top + calc to keep the same property for smooth CSS transition from gate center
    return /** @type {React.CSSProperties} */ ({
      position: 'fixed',
      left: '50%',
      top: 'calc(100% - var(--safe-bottom, 0px) - (var(--header-ctrl, 64px) / 2))',
      transform: 'translate(-50%, -50%)',
      zIndex: 650,
      pointerEvents: 'auto',
      transition: 'top 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1), z-index 0s 0.6s',
    })
  }, [inGateLike])

  /* ===================== Gate colors ===================== */

  const SEAFOAM = '#32ffc7'
  const WHITE = '#ffffff'
  const RED    = '#cc0014'  // root chakra
  const ORANGE = '#e05500'  // sacral chakra
  const YELLOW = '#ffd400'  // solar chakra
  const GREEN  = '#00a832'  // heart chakra
  const BLUE   = '#0066ff'  // throat chakra
  const PURPLE = '#6d5cff'  // third-eye chakra (bright indigo)
  const PINK   = '#c86bff'  // crown chakra (luminous violet)
  // The hand-off into the shop: the crown violet goes into the full rainbow
  // frenzy, glowing (it was a dark orb, which read dull against the video)
  const CROWN_LIGHT = PINK

  const [isNight, setIsNight] = useState(false)
  useEffect(() => {
    const onTheme = (e) => setIsNight(e?.detail?.theme === 'night')
    window.addEventListener('theme-change', onTheme)
    document.addEventListener('theme-change', onTheme)
    // sync with current html data-theme on mount
    setIsNight(document.documentElement.dataset.theme === 'night')
    return () => {
      window.removeEventListener('theme-change', onTheme)
      document.removeEventListener('theme-change', onTheme)
    }
  }, [])

  // Touching the orb on the gate turns it the colour of the ball under the
  // finger; it hands back to the sequence on a tap's release, or once a
  // dragged orb is home
  const [grabColor, setGrabColor] = useState(/** @type {string|null} */ (null))
  const pickRef = useRef(/** @type {null | ((x: number, y: number) => string|null)} */ (null))

  const gateOverride = useMemo(() => {
    if (loaderShow || isProceeding) return CROWN_LIGHT
    if (grabColor) return grabColor
    if (gateStep === 1) return RED
    if (gateStep === 2) return ORANGE
    if (gateStep === 3) return YELLOW
    if (gateStep === 4) return GREEN
    if (gateStep === 5) return BLUE
    if (gateStep === 6) return PURPLE
    if (gateStep === 7) return PINK
    return null
  }, [gateStep, grabColor, isProceeding, loaderShow])

  const gateSolid = gateStep >= 1 || isProceeding || loaderShow

  /* ===================== Gate motion ===================== */
  // One spring system drives the orb on the gate: it squeezes when pressed,
  // lifts while dragged, springs back to center on release, and pulses on
  // every chakra step. It runs in JS because gate mode disables CSS
  // transitions (globals.css), and writes the transform straight to the
  // shell so the 3D orb doesn't re-render per frame.

  const DRAG_THRESHOLD_PX = 8
  const POS_K = 260 // position stiffness
  const POS_C = 18 // position damping (≈0.56: one small overshoot)
  const SCALE_K = 420 // scale stiffness
  const SCALE_C = 20 // scale damping (≈0.5: a crisp bounce)
  const PRESS_SCALE = 0.9
  const ARRIVE_PX = 6 // released orb counts as home within this distance
  const LIFT_SCALE = 1.06
  // True for ~800ms after the gate hands over, while the orb flies to the
  // bottom bar and blooms back into its colours
  const [landing, setLanding] = useState(false)
  const wasGateLike = useRef(inGateLike)
  useEffect(() => {
    if (wasGateLike.current && !inGateLike) {
      setLanding(true)
      const t = setTimeout(() => setLanding(false), 800)
      wasGateLike.current = inGateLike
      return () => clearTimeout(t)
    }
    wasGateLike.current = inGateLike
  }, [inGateLike])
  // Draggable on the gate until the sequence ends, and in the shop once the
  // orb has landed in the bottom bar
  const canDrag = inShop ? !landing : mode === 'gate' && !loaderShow && !isProceeding
  // Colour of the ball pressed in the shop; the next zoom flashes it
  const shopPick = useRef(/** @type {string|null} */ (null))

  const shellRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  const [dragging, setDragging] = useState(false)
  // While dragged, the balls break from the cross and orbit the grab point
  // (px from the orb's centre); null snaps them back into the cross
  const [scatter, setScatter] = useState(/** @type {{x:number,y:number}|null} */ (null))
  const grabOffset = useRef({ x: 0, y: 0 })
  const dragStart = useRef(/** @type {{id:number,x:number,y:number,active:boolean}|null} */ (null))
  // Set when a drag ends so the click the browser fires after it is ignored
  const suppressClick = useRef(false)
  // parked: left where it was dropped (shop); flying / walls: a flick's
  // pinball flight home (see dragSnap's flightStep)
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, held: false, parked: false, flying: 0, walls: /** @type {Element[] | null} */ (null) })
  const motionRaf = useRef(0)
  const onSettle = useRef(/** @type {null | (() => void)} */ (null))
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(motionRaf.current)
  }, [])

  const writeShell = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    const m = motion.current
    el.style.transform = `translate(calc(-50% + ${m.x}px), calc(-50% + ${m.y}px)) scale(${m.s})`
  }, [])

  const runMotion = useCallback(() => {
    if (motionRaf.current) return
    const el = shellRef.current
    // Keep any CSS transition on the shell from smoothing the per-frame writes
    if (el) el.style.transition = 'none'
    let last = performance.now()
    const tick = (now) => {
      const m = motion.current
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (!m.held && m.flying && el) {
        // Flicked: pinballs round the screen, then the spring takes it home
        flightStep(m, dt, now, el.getBoundingClientRect(), pinball.onBounce)
      } else if (!m.held && !m.parked) {
        m.vx += (-POS_K * m.x - POS_C * m.vx) * dt
        m.vy += (-POS_K * m.y - POS_C * m.vy) * dt
        m.x += m.vx * dt
        m.y += m.vy * dt
      }
      m.vs += (-SCALE_K * (m.s - m.ts) - SCALE_C * m.vs) * dt
      m.s += m.vs * dt
      if (m.parked && !m.held && Math.abs(m.s - m.ts) < 0.002 && Math.abs(m.vs) < 0.02) {
        // Left where it was dropped: rest there (still above everything)
        m.s = m.ts
        m.vs = 0
        writeShell()
        motionRaf.current = 0
        return
      }
      // Start whatever waits on the release as the orb snaps into place,
      // rather than after its bounce has fully died out
      if (onSettle.current && !m.held && !m.flying && !m.parked && Math.hypot(m.x, m.y) < ARRIVE_PX) {
        const done = onSettle.current
        onSettle.current = null
        done()
      }
      const settled =
        !m.held && !m.flying && !m.parked &&
        Math.hypot(m.x, m.y) < 0.5 && Math.hypot(m.vx, m.vy) < 10 &&
        Math.abs(m.s - m.ts) < 0.002 && Math.abs(m.vs) < 0.02
      if (settled) {
        m.x = m.y = m.vx = m.vy = m.vs = 0
        m.s = m.ts
        if (el) {
          el.style.transform = m.s === 1 ? 'translate(-50%, -50%)' : `translate(-50%, -50%) scale(${m.s})`
          el.style.transition = shellStyle.transition || ''
          el.style.zIndex = String(shellStyle.zIndex ?? '') // back down once home
        }
        motionRaf.current = 0
        const done = onSettle.current
        onSettle.current = null
        if (done) done()
        return
      }
      writeShell()
      motionRaf.current = requestAnimationFrame(tick)
    }
    motionRaf.current = requestAnimationFrame(tick)
  }, [shellStyle.transition, shellStyle.zIndex, writeShell])

  // Push the scale spring: a positive kick makes the orb swell, then settle
  const kickScale = useCallback((v) => {
    if (reducedMotion.current) return
    motion.current.vs += v
    runMotion()
  }, [runMotion])

  const setScaleTarget = useCallback((ts) => {
    motion.current.ts = reducedMotion.current ? 1 : ts
    runMotion()
  }, [runMotion])

  // Everything dropped around the shop goes home together (a tap on open
  // space, the grid folding): the orb too, from wherever it was left
  useEffect(() => {
    const home = () => {
      const m = motion.current
      if (!m.parked && !m.flying) return
      m.parked = false
      m.flying = 0
      m.walls = null
      runMotion()
    }
    window.addEventListener(DRAG_RESET, home)
    return () => window.removeEventListener(DRAG_RESET, home)
  }, [runMotion])
  // Leaving the shop: no parked orb carried along
  useEffect(() => {
    if (inShop) return
    const m = motion.current
    m.parked = false
    m.flying = 0
  }, [inShop])

  const buzz = useCallback((ms) => {
    try { navigator.vibrate?.(ms) } catch {}
  }, [])

  // A crisp pulse and haptic tick on every chakra beat, a fuller one on black
  const prevStep = useRef(gateStep)
  useEffect(() => {
    if (!inGateLike) return
    if (gateStep !== prevStep.current && gateStep >= 2) {
      kickScale(0.8)
      buzz(5)
    }
    prevStep.current = gateStep
  }, [buzz, gateStep, inGateLike, kickScale])

  useEffect(() => {
    if (!isProceeding) return
    kickScale(2.2)
    buzz(14)
  }, [isProceeding, kickScale, buzz])

  /* ===================== Gate interactions ===================== */
  // Every gesture starts the same sequence: all seven chakras, then black,
  // then the shop. Touching the orb starts it at once, and while the balls
  // still show their own colours the orb takes the colour of the one touched
  // until it's let go (a drag pauses the sequence until the orb is home).
  // Once it's running, more taps never skip a colour.
  //
  // In the shop the same drag works on the bottom-bar orb: it lifts, follows
  // the finger, springs home, then does what a tap does (the next zoom step).
  //
  // In both, a dragged orb breaks apart: its balls orbit the finger and the
  // arms shrink away, then everything snaps back into the cross on release.

  const onGateClick = useCallback(() => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (!inGateLike || isProceeding) return
    if (gateStep === 0) buzz(8)
    onAdvanceGate && onAdvanceGate()
  }, [buzz, gateStep, inGateLike, isProceeding, onAdvanceGate])

  const onOrbPointerDown = useCallback((e) => {
    suppressClick.current = false
    if (!canDrag) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // A drag carries on from wherever it is (parked, or caught mid-flight)
    const mo = motion.current
    if (mo.flying) {
      mo.flying = 0
      mo.walls = null
      mo.vx = mo.vy = 0
    }
    dragStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false, bx: mo.x, by: mo.y }
    const box = shellRef.current?.getBoundingClientRect()
    grabOffset.current = box
      ? { x: e.clientX - (box.left + box.width / 2), y: e.clientY - (box.top + box.height / 2) }
      : { x: 0, y: 0 }
    setScaleTarget(PRESS_SCALE)
    // Read the ball while they still show their own colours; set in the same
    // event as the sequence start, so the touched colour shows instead of red
    // In the shop every press reads the ball, and the zoom it fires flashes
    // that colour
    const picked = inShop || gateStep === 0 ? pickRef.current?.(e.clientX, e.clientY) ?? null : null
    if (picked) setGrabColor(picked)
    if (inShop) shopPick.current = picked
    if (!inShop && gateStep === 0) {
      buzz(8)
      onAdvanceGate && onAdvanceGate()
    }
  }, [buzz, canDrag, gateStep, inShop, onAdvanceGate, setScaleTarget])

  /* ===================== Spin momentum ===================== */
  // On the splash and in the shop, dragging the orb fast winds its spin up:
  // the faster the drag, the more rpm and the wilder (rainbow) its colours,
  // spinning the way it's dragged (right or left). Letting go flings that
  // momentum on, a little extra even, and it winds back down over a couple of
  // seconds. While it's held its balls orbit the finger, rolling with the drag
  // like a wheel (right: clockwise, left: counter-clockwise) and coasting on
  // when it slows. Spin is capped below where the eye starts reading it as
  // turning backwards (wagon-wheel effect). Fed to BlueOrbCross3D through a
  // ref, frame by frame.
  const spinRef = useRef({ boost: 0, vivid: 0, floor: 0, orbit: 0 })
  // The splash's hand-off into the shop: the orb blazes in the rainbow
  // frenzy, easing in and back out as the shop takes over
  const handOff = inGateLike && (loaderShow || isProceeding)
  useEffect(() => {
    if (reducedMotion.current) return
    const sp = spinRef.current
    let raf = 0
    let last = performance.now()
    const tick = (/** @type {number} */ now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      sp.floor += ((handOff ? 1 : 0) - sp.floor) * Math.min(1, dt * (handOff ? 5 : 2.5))
      if (!handOff && sp.floor < 0.003) {
        sp.floor = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [handOff])
  // dir: which way it spins (+1 dragged right, -1 dragged left); vx: signed
  // smoothed horizontal drag speed, px/s
  const fling = useRef({ speed: 0, vx: 0, vy: 0, dir: 1, lastX: 0, lastY: 0, lastT: 0, held: false, raf: 0 })
  const runSpin = useCallback(() => {
    const f = fling.current
    if (f.raf) return
    let last = performance.now()
    const tick = (/** @type {number} */ now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const sp = spinRef.current
      if (f.held) {
        // Held still, the wind-up fades; moving keeps it fed (onOrbPointerMove)
        if (now - f.lastT > 120) f.speed *= Math.exp(-dt * 5)
        if (now - f.lastT > 80) f.vx *= Math.exp(-dt * 10)
        // Turning the drag around swings the spin through zero and back up the other way
        sp.boost += (f.dir * Math.min(MAX_BOOST, f.speed * BOOST_PER_PX) - sp.boost) * Math.min(1, dt * 8)
        // The balls round the finger roll with the drag (+ is counter-clockwise,
        // so dragged right they go clockwise); slower than they're going, they coast
        const drive = Math.max(-MAX_ORBIT, Math.min(MAX_ORBIT, -f.vx * ORBIT_PER_PX))
        if (Math.abs(f.vx) > 30 && (Math.sign(drive) !== Math.sign(sp.orbit) || Math.abs(drive) > Math.abs(sp.orbit))) {
          sp.orbit += (drive - sp.orbit) * Math.min(1, dt * 10)
        } else {
          const idle = (sp.orbit >= 0 ? 1 : -1) * IDLE_ORBIT
          sp.orbit = idle + (sp.orbit - idle) * Math.exp(-dt / 1.5)
        }
        sp.vivid += (Math.min(1, Math.max(0, (f.speed - 250) / 1400)) - sp.vivid) * Math.min(1, dt * 6)
      } else {
        // Let go: the momentum winds down
        sp.boost *= Math.exp(-dt / 1.3)
        sp.vivid *= Math.exp(-dt / 1.7)
      }
      if (!f.held && Math.abs(sp.boost) < 0.5 && sp.vivid < 0.003) {
        sp.boost = 0
        sp.vivid = 0
        f.raf = 0
        return
      }
      f.raf = requestAnimationFrame(tick)
    }
    f.raf = requestAnimationFrame(tick)
  }, [])
  useEffect(() => () => cancelAnimationFrame(fling.current.raf), [])

  const onOrbPointerMove = useCallback((e) => {
    const s = dragStart.current
    if (!s || s.id !== e.pointerId || !canDrag) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    const m = motion.current
    if (!s.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      s.active = true
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
      m.held = true
      setDragging(true)
      if (!reducedMotion.current) setScatter(grabOffset.current)
      setScaleTarget(LIFT_SCALE)
      // While dragged (and flying home) it sits above everything: header,
      // top row, video, pop-ups
      if (shellRef.current) shellRef.current.style.zIndex = '2147483003'
      if (!inShop && onHoldChange) onHoldChange(true)
    }
    m.x = (s.bx || 0) + dx
    m.y = (s.by || 0) + dy
    m.vx = m.vy = 0
    writeShell()
    if (!reducedMotion.current) {
      // How fast it's being dragged (px/s, smoothed): winds up the spin
      const f = fling.current
      const now = performance.now()
      if (!f.held) {
        f.held = true
        f.vx = 0
        f.vy = 0
        spinRef.current.orbit = 0
        f.lastX = e.clientX
        f.lastY = e.clientY
        f.lastT = now
        runSpin()
      } else {
        const dtm = Math.max(4, now - f.lastT)
        const dx = e.clientX - f.lastX
        const v = (Math.hypot(dx, e.clientY - f.lastY) / dtm) * 1000
        // Spins the way it's dragged (a straight up/down drag keeps the last way)
        if (Math.abs(dx) > 1.5) f.dir = Math.sign(dx)
        f.vx = f.vx * 0.35 + (dx / dtm) * 1000 * 0.65
        f.vy = f.vy * 0.35 + ((e.clientY - f.lastY) / dtm) * 1000 * 0.65
        // Quick to wind up, slower to let go
        f.speed = v > f.speed ? f.speed * 0.3 + v * 0.7 : f.speed * 0.75 + v * 0.25
        f.lastX = e.clientX
        f.lastY = e.clientY
        f.lastT = now
      }
    }
  }, [canDrag, inShop, onHoldChange, setScaleTarget, writeShell, runSpin])

  // The shop's zoom step (set below, once the shop actions exist): a flick of
  // the orb counts as a tap and takes it too
  const shopStep = useRef(/** @type {null | (() => void)} */ (null))

  const onOrbPointerEnd = useCallback((e) => {
    const s = dragStart.current
    if (!s || s.id !== e.pointerId) return
    dragStart.current = null
    setScaleTarget(1)
    // A tap: on the gate the sequence already started on press; in the shop
    // the click / touchend handlers fire the zoom step
    if (!s.active) {
      setGrabColor(null)
      return
    }

    // Drag released: spring home, then resume the sequence (gate) or take
    // the next zoom step (shop). The click or touchend that follows is ignored.
    suppressClick.current = true
    // How it was let go: a flick (fast, not held still first) or a drop
    const rel = fling.current
    const flick =
      inShop && !reducedMotion.current && rel.held && e.type === 'pointerup' &&
      performance.now() - rel.lastT < 80 && Math.hypot(rel.vx, rel.vy) > FLICK_SPEED
    const relV = { x: rel.vx, y: rel.vy }
    if (fling.current.held) {
      // The fling: a fast release keeps (and adds to) the momentum
      const f = fling.current
      const sp = spinRef.current
      f.held = false
      sp.boost = f.dir * Math.min(MAX_FLING_BOOST, Math.max(f.dir * sp.boost, f.speed * BOOST_PER_PX) * 1.3)
      sp.vivid = Math.min(1, Math.max(sp.vivid, f.speed / 1100))
      f.speed = 0
      runSpin()
    }
    setDragging(false)
    // Flicked in the shop, the balls stay scattered, rolling, while it
    // pinballs, and form the cross again once it's home; otherwise the cross
    // re-forms as it lets go
    if (!flick) setScatter(null)
    const m = motion.current
    m.held = false
    if (inShop) {
      // In the shop it doesn't spring back: dropped, it stays put; flicked, it
      // pinballs round the screen and finds its way home, and the flick zooms
      // the grid like a tap does
      setGrabColor(null)
      const el = shellRef.current
      if (flick && el) {
        m.parked = false
        launch(m, relV.x, relV.y, el.getBoundingClientRect(), pinball.obstacles(el))
        onSettle.current = () => setScatter(null)
        shopStep.current?.()
      } else {
        m.parked = true
        m.vx = m.vy = 0
      }
      runMotion()
      return
    }
    const start = () => {
      setGrabColor(null)
      onHoldChange && onHoldChange(false)
      onAdvanceGate && onAdvanceGate() // no-op unless the press didn't start it
    }
    if (reducedMotion.current) {
      m.x = m.y = 0
      writeShell()
      start()
      return
    }
    onSettle.current = start
    runMotion()
  }, [inShop, onAdvanceGate, onHoldChange, runMotion, setScaleTarget, writeShell])

  /* ===================== Shop density logic (ported from ChakraOrbButton) ===================== */

  const lastFireRef = useRef(0)
  // True while our own lb:zoom dispatches, so the external mirror doesn't
  // repaint the picked flash black
  const selfFire = useRef(false)
  const FIRE_COOLDOWN_MS = 150

  const [pressColor, setPressColor] = useState(null) // '#00a832' | null
  const [overlayOpen, setOverlayOpen] = useState(false)
  // Which way the next tap zooms. It follows the grid's real state (ShopGrid
  // broadcasts lb:grid-density on every change) instead of counting taps, so
  // the orb never falls out of step when the grid folds or changes some other
  // way (a tap on open space, closing a product page, a re-rack): from stacks
  // it zooms in, and it turns around at the closest zoom (3 columns), so a
  // tap always does something. stacks → 5 → 4 → 3 → 4 → 5 → stacks.
  const [orbState, setOrbState] = useState({ next: /** @type {'in' | 'out'} */ ('in'), stacked: true })
  const orbNextRef = useRef(/** @type {'in' | 'out'} */ ('in'))
  const gridStacked = useRef(true)
  useEffect(() => {
    const MIN_COLS = 3 // ShopGrid's closest zoom
    const onGrid = (/** @type {any} */ e) => {
      const d = e?.detail || {}
      if (d.viewMode) gridStacked.current = d.viewMode === 'stacks'
      const density = Number(d.density)
      let next = orbNextRef.current
      if (gridStacked.current) next = 'in'
      else if (Number.isFinite(density) && density <= MIN_COLS) next = 'out'
      orbNextRef.current = next
      setOrbState({ next, stacked: gridStacked.current })
    }
    document.addEventListener('lb:grid-density', onGrid)
    return () => document.removeEventListener('lb:grid-density', onGrid)
  }, [])

  const GREEN_ZOOM = '#00a832'
  const BLACK_GLOW = '#000000'

  // watch overlay-open attribute
  useEffect(() => {
    const read = () =>
      setOverlayOpen(document.documentElement.getAttribute('data-overlay-open') === '1')
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-overlay-open'],
    })
    return () => mo.disconnect()
  }, [])

  const pulse = useCallback((c) => {
    setPressColor(c)
    const t = setTimeout(() => setPressColor(null), 210)
    return () => clearTimeout(t)
  }, [])

  const fireZoom = useCallback(
    (dir = null) => {
      const now = performance.now()
      if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return
      lastFireRef.current = now

      pulse(shopPick.current || BLACK_GLOW)
      shopPick.current = null

      const detail = { step: 1, ...(dir ? { dir } : {}) }
      selfFire.current = true
      try {
        document.dispatchEvent(new CustomEvent('lb:zoom', { detail }))
      } finally {
        selfFire.current = false
      }
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }))
      document.dispatchEvent(new CustomEvent('grid-density', { detail })) // legacy
    },
    [pulse]
  )


  // mirror external zoom pulses visually
  useEffect(() => {
    const onExternal = (ev) => {
      if (ev?.detail?.dir && !selfFire.current) pulse(BLACK_GLOW)
    }
    document.addEventListener('lb:zoom', onExternal)
    return () => document.removeEventListener('lb:zoom', onExternal)
  }, [pulse])

  const runShopStep = () => fireZoom(gridStacked.current ? 'in' : orbNextRef.current)
  shopStep.current = runShopStep

  const onShopClick = useCallback(() => {
    if (suppressClick.current) { suppressClick.current = false; return } // end of a drag
    runShopStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireZoom])

  const onShopTouchEnd = useCallback(
    (e) => {
      try { e.preventDefault() } catch {} // prevent subsequent onClick from double-firing
      if (suppressClick.current) { suppressClick.current = false; return } // end of a drag
      runShopStep()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fireZoom]
  )
  const onShopContextMenu = useCallback((e) => { e.preventDefault() }, [])

  const onShopKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        runShopStep()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fireZoom]
  )

  const onShopWheel = useCallback(
    (e) => {
      try { e.preventDefault() } catch {}
      runShopStep()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fireZoom]
  )

  const rpmValue = useMemo(() => {
    if (inGateLike) return 44
    return orbState.next === 'out' || orbState.stacked ? 44 : -44
  }, [inGateLike, orbState])

  /* ===================== Unified render ===================== */

  // Which click behavior is active depends on mode.
  const buttonHandlers = inGateLike
    ? {
        onClick: onGateClick,
        onPointerDown: onOrbPointerDown,
        onPointerMove: onOrbPointerMove,
        onPointerUp: onOrbPointerEnd,
        onPointerCancel: onOrbPointerEnd,
      }
    : {
        onClick: onShopClick,
        onTouchEnd: onShopTouchEnd,
        onPointerDown: onOrbPointerDown,
        onPointerMove: onOrbPointerMove,
        onPointerUp: onOrbPointerEnd,
        onPointerCancel: onOrbPointerEnd,
        onContextMenu: onShopContextMenu,
        onKeyDown: onShopKeyDown,
        onWheel: onShopWheel,
      }

  const orbOverrideAllColor = inGateLike
    ? gateOverride
    : pressColor || grabColor || (isNight ? WHITE : null)
  const orbHaloTint = inGateLike
    ? gateOverride === RED
      ? '#880011'        // deep blood-crimson — evil moon glow
      : null
    : pressColor === BLACK_GLOW
      ? '#444444'
      : pressColor || grabColor || (isNight ? WHITE : null)

  // Always keep glow meshes mounted so the visual footprint stays consistent
  // across color transitions. Opacity (orbGlowOpacity) already goes to 0
  // during black/proceeding/loader states, making halos invisible without
  // unmounting them (which caused a perceived vertical shift).
  const orbGlow = true
  const orbGlowOpacity = inGateLike
    ? loaderShow || isProceeding
      ? 1.0    // the crown light glows full into the shop
      : gateSolid
        ? 1.0
        : gateStep >= 1
          ? 1.0
          : 0.9
    : pressColor || grabColor
      ? 1.0
      : 0.9

  const orbColor = inGateLike
    ? gateSolid
      ? loaderShow || isProceeding
        ? CROWN_LIGHT
        : gateStep === 1 ? RED
        : gateStep === 2 ? ORANGE
        : gateStep === 3 ? YELLOW
        : gateStep === 4 ? GREEN
        : gateStep === 5 ? BLUE
        : gateStep === 6 ? PURPLE
        : gateStep === 7 ? PINK
        : SEAFOAM
      : SEAFOAM
    : isNight
      ? WHITE
      : SEAFOAM
  const orbSolidOverride = inGateLike ? gateSolid : false

  // Chakra steps blend into each other; on arrival in the shop the black orb
  // blooms back into its colours instead of cutting
  const GATE_FADE_MS = 60
  const LANDING_FADE_MS = 500

  return (
    <div ref={shellRef} style={shellStyle} data-orb-shell="">
      <button
        type="button"
        aria-label={inGateLike ? 'Orb' : overlayOpen ? 'Back' : 'Zoom products'}
        title={
          inGateLike
            ? 'Enter (tap or drag)'
            : overlayOpen
              ? 'Back to grid'
              : 'Zoom products (Click = Smart IN/OUT • Right-click = OUT • Wheel = IN/OUT)'
        }
        data-orb={inGateLike ? 'gate' : 'density'}
        style={{
          padding: 0,
          margin: 0,
          border: 0,
          background: 'transparent',
          lineHeight: 0,
          cursor: dragging ? 'grabbing' : inGateLike && isProceeding ? 'default' : 'pointer',
          WebkitTapHighlightColor: 'transparent',
          // 'none' while draggable so touch moves reach the drag instead of panning
          touchAction: canDrag ? 'none' : 'manipulation',
          position: 'relative',
        }}
        {...buttonHandlers}
      >
        <BlueOrbCross3D
          height={height}
          rpm={rpmValue}
          spinRef={spinRef}
          color={orbColor}
          geomScale={inGateLike ? 1.2 : 1.12}
          offsetFactor={inGateLike ? 2.05 : 2.25}
          armRatio={inGateLike ? 0.33 : 0.35}
          glow={orbGlow}
          glowOpacity={orbGlowOpacity}
          includeYAxis={inGateLike ? true : orbState.next === 'out' || orbState.stacked}
          includeZAxis={true}
          respectReducedMotion={false}
          interactive={!inGateLike || (!isProceeding && !loaderShow)}
          onActivate={null}
          overrideAllColor={orbOverrideAllColor}
          haloTint={orbHaloTint}
          flashDecayMs={inGateLike ? 0 : 140}
          solidOverride={orbSolidOverride}
          colorFadeMs={inGateLike ? GATE_FADE_MS : landing ? LANDING_FADE_MS : 0}
          pickRef={pickRef}
          scatter={scatter}
          overscan={3}
        />
      </button>
    </div>
  )
}
