// src/components/BlueOrbCross3D.jsx
'use client'

import * as THREE from 'three'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function isNearBlack(hex) {
  if (!hex || typeof hex !== 'string') return false
  const h = hex.trim().toLowerCase()
  if (h === '#000' || h === '#000000' || h === 'black') return true
  if (!h.startsWith('#') || (h.length !== 7 && h.length !== 4)) return false
  const full = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h

  const r = parseInt(full.slice(1, 3), 16)
  const g = parseInt(full.slice(3, 5), 16)
  const b = parseInt(full.slice(5, 7), 16)
  return r + g + b <= 18
}

function OrbCross({
  rpm = 14.4,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.25,
  includeYAxis = true,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,
  overrideGlowOpacity,
  interactive = false,
  haloTint = null,
  solidOverride = false,
  flashDecayMs = 140,
}) {
  const group = useRef()

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches

  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt

    const u = group.current.userData
    if (!u) return

    // Smooth lerp toward target base to prevent visual pop on color transitions
    if (u.targetBase !== undefined && Math.abs(u.base - u.targetBase) > 0.001) {
      u.base += (u.targetBase - u.base) * 0.09
    } else if (u.targetBase !== undefined) {
      u.base = u.targetBase
    }

    const now = performance.now()
    const flashing = u.flashUntil && now < u.flashUntil

    if (glow && u?.pulse) {
      let pulseSpeed = 3.6
      if (flashing) pulseSpeed = 7.2

      const t = state.clock.getElapsedTime()
      const pulse = 0.85 + Math.sin(t * pulseSpeed) * 0.15

      let b = u.base * pulse
      if (flashing) {
        const remain = Math.max(0, u.flashUntil - now)
        const k = Math.min(1, remain / flashDecayMs)
        b = Math.min(1, b * (0.85 + 0.3 * k))
      }

      // single halo system only (prevents “double orb” look)
      u.barHalo.opacity = b * 0.5
      u.sphereHalos.forEach((m) => (m.opacity = b))
    }
  })

  const memo = useMemo(() => {
    const r = 0.144 * geomScale
    const armR = Math.max(0.001, r * armRatio)
    const offset = r * offsetFactor
    const armLen = 2 * (offset - r * 0.12)

    const sphereGeo = new THREE.SphereGeometry(r, 48, 32)
    const armGeoX = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true)
    const armGeoY = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true)
    const armGeoZ = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true)

    const armGlowGeoX = new THREE.CylinderGeometry(
      armR * 1.28,
      armR * 1.28,
      armLen * 1.02,
      48,
      1,
      true
    )
    const armGlowGeoY = new THREE.CylinderGeometry(
      armR * 1.28,
      armR * 1.28,
      armLen * 1.02,
      48,
      1,
      true
    )
    const armGlowGeoZ = new THREE.CylinderGeometry(
      armR * 1.28,
      armR * 1.28,
      armLen * 1.02,
      48,
      1,
      true
    )

    const centers = [
      [0, 0, 0],
      [offset, 0, 0],
      [-offset, 0, 0],
    ]
    if (includeYAxis) centers.push([0, offset, 0], [0, -offset, 0])
    if (includeZAxis) centers.push([0, 0, offset], [0, 0, -offset])

    const CHAKRA = {
      root: '#cc0014',
      sacral: '#e05500',
      solar: '#ffd400',
      heart: '#00a832',
      throat: '#0066ff',
      thirdEye: '#3a00b5',
      crownV: '#9333ea',
      crownW: '#d8d0f0',
    }

    return {
      sphereGeo,
      armGeoX,
      armGeoY,
      armGeoZ,
      armGlowGeoX,
      armGlowGeoY,
      armGlowGeoZ,
      centers,
      CHAKRA,
    }
  }, [geomScale, armRatio, offsetFactor, includeYAxis, includeZAxis])

  const {
    sphereGeo,
    armGeoX,
    armGeoY,
    armGeoZ,
    armGlowGeoX,
    armGlowGeoY,
    armGlowGeoZ,
    centers,
    CHAKRA,
  } = memo

  const useOverride = !!overrideAllColor
  const barColor = useOverride ? overrideAllColor : color

  // “solidOverride” only matters if we are overriding a single color
  const solid = solidOverride && useOverride

  const haloColor = useMemo(() => {
    if (haloTint) return haloTint
    if (isNearBlack(barColor)) return '#111111' // near-black so halo is visible on white
    return barColor
  }, [barColor, haloTint])

  const haloBase = (overrideGlowOpacity ?? Math.min(1, glowOpacity)) * (coarse ? 0.55 : 1.0)

  const coreEmissive = solid ? 0.75 : useOverride ? 1.6 : 1.15
  const barEmissive = solid ? 0.55 : useOverride ? 1.1 : 0.6

  const stdMatProps = useMemo(() => {
    if (!solid) {
      return { roughness: 0.32, metalness: 0.25, toneMapped: true }
    }
    return { roughness: 0.42, metalness: 0.05, toneMapped: false }
  }, [solid])

  const barCoreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: barColor,
        roughness: stdMatProps.roughness,
        metalness: stdMatProps.metalness,
        emissive: new THREE.Color(barColor),
        emissiveIntensity: barEmissive,
        toneMapped: stdMatProps.toneMapped,
      }),
    [barColor, barEmissive, stdMatProps]
  )

  const barHaloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: glow ? haloBase * 0.45 : 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [haloColor, glow, haloBase]
  )

  const sphereDefs = useOverride
    ? new Array(centers.length).fill({
        core: barColor,
        halo: haloColor,
        haloOp: haloBase,
      })
    : [
        {
          core: CHAKRA.crownW,
          halo: CHAKRA.crownV,
          haloOp: 0.85 * (coarse ? 0.55 : 1.0),
        },
        { core: CHAKRA.root, halo: CHAKRA.root, haloOp: haloBase },
        { core: CHAKRA.sacral, halo: CHAKRA.sacral, haloOp: haloBase },
        { core: CHAKRA.solar, halo: CHAKRA.solar, haloOp: haloBase },
        { core: CHAKRA.heart, halo: CHAKRA.heart, haloOp: haloBase },
        { core: CHAKRA.throat, halo: CHAKRA.throat, haloOp: haloBase },
        { core: CHAKRA.thirdEye, halo: CHAKRA.thirdEye, haloOp: haloBase },
      ]

  const sphereCoreMats = useMemo(() => {
    return sphereDefs.map(
      ({ core }) =>
        new THREE.MeshStandardMaterial({
          color: core,
          roughness: solid ? 0.42 : 0.28,
          metalness: solid ? 0.05 : 0.25,
          emissive: new THREE.Color(core),
          emissiveIntensity: coreEmissive,
          toneMapped: solid ? false : true,
        })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOverride ? barColor : JSON.stringify(sphereDefs.map((s) => s.core)), coreEmissive, solid])

  const sphereHaloMats = useMemo(() => {
    return sphereDefs.map(
      ({ halo, haloOp }) =>
        new THREE.MeshBasicMaterial({
          color: halo,
          transparent: true,
          opacity: glow ? haloOp : 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    useOverride ? haloColor : JSON.stringify(sphereDefs.map((s) => s.halo)),
    glow,
    haloColor,
    haloBase,
  ])

  useEffect(() => {
    if (!group.current) return
    const prev = group.current.userData
    group.current.userData = {
      pulse: true,
      base: prev?.base ?? haloBase, // preserve current lerped value
      targetBase: haloBase,         // lerp toward this
      barHalo: barHaloMat,
      sphereHalos: sphereHaloMats,
      flashUntil: prev?.flashUntil ?? 0,
      flashDecayMs,
    }
  }, [haloBase, barHaloMat, sphereHaloMats, flashDecayMs])

  const triggerFlash = () => {
    if (!group.current?.userData) return
    const u = group.current.userData
    u.flashUntil = performance.now() + (u.flashDecayMs || flashDecayMs)
  }

  const handlePointerDown = interactive
    ? (e) => {
        e.stopPropagation()
        triggerFlash()
        onActivate && onActivate()
      }
    : undefined

  const handleKeyDown = interactive
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          triggerFlash()
          onActivate && onActivate()
        }
      }
    : undefined

  return (
    <group
      ref={group}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : -1}
    >
      {/* Bars */}
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      {includeYAxis && <mesh geometry={armGeoY} material={barCoreMat} />}
      {includeZAxis && (
        <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />
      )}

      {/* Spheres */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={sphereCoreMats[i]} position={p} />
      ))}

      {/* Single-pass glow (no extra halo2/halo3 = no “double orb”) */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={barHaloMat} rotation={[0, 0, Math.PI / 2]} />
          {includeYAxis && <mesh geometry={armGlowGeoY} material={barHaloMat} />}
          {includeZAxis && (
            <mesh geometry={armGlowGeoZ} material={barHaloMat} rotation={[Math.PI / 2, 0, 0]} />
          )}

          {centers.map((p, i) => (
            <mesh
              key={`halo-${i}`}
              geometry={sphereGeo}
              material={sphereHaloMats[i]}
              position={p}
              scale={glowScale}
            />
          ))}
        </>
      )}
    </group>
  )
}

export default function BlueOrbCross3D({
  height = '28px',
  rpm = 14.4,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.25,
  includeYAxis = true,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,
  overrideGlowOpacity,
  style = {},
  className = '',
  interactive = false,
  respectReducedMotion = false,
  haloTint = null,
  flashDecayMs = 140,
  solidOverride = false,
}) {
  const [maxDpr, setMaxDpr] = useState(2)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const pr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
    setMaxDpr(Math.min(2, Math.max(1, pr)))

    if (respectReducedMotion) {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      setReduced(!!mq?.matches)
      const onChange = (e) => setReduced(e.matches)
      mq?.addEventListener?.('change', onChange)
      return () => mq?.removeEventListener?.('change', onChange)
    } else {
      setReduced(false)
    }
  }, [respectReducedMotion])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        height,
        width: height,
        display: 'inline-block',
        contain: 'layout paint style',
        isolation: 'isolate',
        pointerEvents: interactive ? 'auto' : 'none',
        ...style,
      }}
    >
      <Canvas
        dpr={[1, maxDpr]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: interactive ? 'auto' : 'none',
          outline: 'none',
          zIndex: 2,
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross
          rpm={reduced ? 0 : rpm}
          color={color}
          geomScale={geomScale}
          offsetFactor={offsetFactor}
          armRatio={armRatio}
          glow={glow}
          glowOpacity={glowOpacity}
          glowScale={glowScale}
          includeYAxis={includeYAxis}
          includeZAxis={includeZAxis}
          onActivate={interactive ? onActivate : null}
          overrideAllColor={overrideAllColor}
          overrideGlowOpacity={overrideGlowOpacity}
          interactive={interactive}
          haloTint={haloTint}
          flashDecayMs={flashDecayMs}
          solidOverride={solidOverride}
        />
      </Canvas>
    </div>
  )
}
