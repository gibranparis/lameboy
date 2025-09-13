// src/components/BlueOrbCross3D.jsx
'use client';

import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * 3-axis orb-cross (±X, ±Y, ±Z) with per-orb chakra glows.
 * Normal mode = chakra spheres + seafoam bars (sharp on mobile).
 * If `overrideAllColor` is provided, EVERYTHING (spheres + bars + halos) uses that color,
 * with multi-layer halo and a subtle pulse to feel “scarier”.
 *
 * Props
 * - height: CSS height for canvas (e.g., "10vh")
 * - rpm: rotations per minute (Y axis only; stable)
 * - color: bar color in normal mode (default seafoam)
 * - geomScale, offsetFactor, armRatio: geometry sizing
 * - glow, glowOpacity, glowScale: neon halo controls
 * - includeZAxis: add ±Z spheres so "+" silhouette holds while spinning
 * - onActivate: fired only when sphere/arm geometry is actually clicked
 * - overrideAllColor: when set (e.g., "#ff002a"), force ALL parts to that color (scary red)
 * - overrideGlowOpacity: optional halo strength used when overrideAllColor is active
 */

function OrbCross({
  rpm = 14.4,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.35,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,
  overrideGlowOpacity,
}) {
  const group = useRef();

  // Mobile/coarse pointer → reduce glow (looks sharper) and we’ll let the canvas use DPR up to 3
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;
  const coarseGlowFactor = coarse ? 0.6 : 1.0; // tame halos on mobile

  useFrame((state, dt) => {
    if (!group.current) return;
    const rps = (rpm * Math.PI * 2) / 60;
    group.current.rotation.y += rps * dt;

    // "Scarier" pulse only when override red is on
    if (overrideAllColor && group.current.userData?.pulseMats) {
      const t = state.clock.getElapsedTime();
      const pulse = 0.85 + Math.sin(t * 3.6) * 0.15; // 0.7..1.0-ish after factors
      const { barHaloMat, sphereHaloMats, extraHaloMats } = group.current.userData.pulseMats;
      const base = (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) * coarseGlowFactor;

      // bar halo
      if (barHaloMat) barHaloMat.opacity = base * 0.55 * pulse;

      // sphere halos (base layer)
      sphereHaloMats?.forEach((m) => (m.opacity = base * pulse));

      // extra halo layers (thicker outer glow when red)
      if (extraHaloMats) {
        // near layer (1.6x)
        extraHaloMats[0].opacity = base * 0.65 * pulse;
        // mid layer (1.95x)
        extraHaloMats[1].opacity = base * 0.35 * pulse;
      }
    }
  });

  const memo = useMemo(() => {
    const r = 0.144 * geomScale;
    const armR = Math.max(0.001, r * armRatio);
    const offset = r * offsetFactor;
    const armLen = 2 * (offset - r * 0.12);

    // Geometries
    const sphereGeo   = new THREE.SphereGeometry(r, 48, 32);
    const armGeoX     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoZ     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoZ = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    // Chakra palette (root→crown)
    const CHAKRA = {
      root:     '#ef4444',
      sacral:   '#f97316',
      solar:    '#facc15',
      heart:    '#22c55e',
      throat:   '#3b82f6',
      thirdEye: '#4f46e5',
      crownV:   '#c084fc',
      crownW:   '#f6f3ff',
    };

    // Positions (center, ±X, ±Y, ±Z)
    const centers = [
      [0, 0, 0],
      [ offset, 0, 0],
      [-offset, 0, 0],
      [0,  offset, 0],
      [0, -offset, 0],
    ];
    if (includeZAxis) {
      centers.push([0, 0,  offset]);
      centers.push([0, 0, -offset]);
    }

    return {
      r,
      sphereGeo, armGeoX, armGeoY, armGeoZ,
      armGlowGeoX, armGlowGeoY, armGlowGeoZ,
      centers,
      CHAKRA,
    };
  }, [geomScale, armRatio, offsetFactor, glowScale, includeZAxis]);

  const {
    sphereGeo, armGeoX, armGeoY, armGeoZ,
    armGlowGeoX, armGlowGeoY, armGlowGeoZ,
    centers, CHAKRA,
  } = memo;

  // Materials depend on override vs chakra mode
  const useOverride = !!overrideAllColor;
  const barColor = useOverride ? overrideAllColor : color;

  const haloBase = (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) * (coarse ? 0.6 : 1.0);
  const coreEmissive = useOverride ? 2.25 : 1.25;  // brighter when red
  const barEmissive  = useOverride ? 1.35 : 0.6;

  // Bars
  const barCoreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: barColor,
    roughness: 0.32,
    metalness: 0.25,
    emissive: new THREE.Color(barColor),
    emissiveIntensity: barEmissive,
    toneMapped: true,
  }), [barColor, barEmissive]);

  const barHaloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: barColor,
    transparent: true,
    opacity: glow ? haloBase * 0.5 : 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [barColor, glow, haloBase]);

  // Spheres (either all override or chakra set)
  const sphereDefs = useOverride
    ? new Array(centers.length).fill({ core: barColor, halo: barColor, haloOp: haloBase })
    : [
        { core: CHAKRA.crownW, halo: CHAKRA.crownV, haloOp: 0.9 * (coarse ? 0.7 : 1) }, // center
        { core: CHAKRA.root,     halo: CHAKRA.root,     haloOp: glowOpacity * (coarse ? 0.7 : 1) },
        { core: CHAKRA.sacral,   halo: CHAKRA.sacral,   haloOp: glowOpacity * (coarse ? 0.7 : 1) },
        { core: CHAKRA.solar,    halo: CHAKRA.solar,    haloOp: glowOpacity * (coarse ? 0.7 : 1) },
        { core: CHAKRA.heart,    halo: CHAKRA.heart,    haloOp: glowOpacity * (coarse ? 0.7 : 1) },
        ...(includeZAxis
          ? [
              { core: CHAKRA.throat,   halo: CHAKRA.throat,   haloOp: glowOpacity * (coarse ? 0.7 : 1) },
              { core: CHAKRA.thirdEye, halo: CHAKRA.thirdEye, haloOp: glowOpacity * (coarse ? 0.7 : 1) },
            ]
          : []),
      ];

  const sphereCoreMats = useMemo(
    () => sphereDefs.map(({ core }) => new THREE.MeshStandardMaterial({
      color: core,
      roughness: 0.28,
      metalness: 0.25,
      emissive: new THREE.Color(core),
      emissiveIntensity: coreEmissive,
      toneMapped: true,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs), coreEmissive]
  );

  const sphereHaloMats = useMemo(
    () => sphereDefs.map(({ halo, haloOp }) => new THREE.MeshBasicMaterial({
      color: halo,
      transparent: true,
      opacity: glow ? haloOp : 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs), glow]
  );

  // Only fires when real geometry is hit (r3f raycast)
  const handlePointerDown = (e) => {
    e.stopPropagation();
    onActivate && onActivate();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate && onActivate();
    }
  };

  return (
    <group
      ref={(node) => {
        if (node) {
          // expose mats for pulse in useFrame
          node.userData.pulseMats = {
            barHaloMat,
            sphereHaloMats,
            extraHaloMats: [], // will fill if override (see below)
          };
        }
        group.current = node;
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Bars */}
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={barCoreMat} />
      {includeZAxis && (
        <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />
      )}

      {/* Orbs (cores) */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={sphereCoreMats[i]} position={p} />
      ))}

      {/* Neon halos (base) */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={barHaloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={barHaloMat} />
          {includeZAxis && (
            <mesh geometry={armGlowGeoZ} material={barHaloMat} rotation={[Math.PI / 2, 0, 0]} />
          )}
          {centers.map((p, i) => (
            <mesh key={`halo-${i}`} geometry={sphereGeo} material={sphereHaloMats[i]} position={p} scale={glowScale} />
          ))}

          {/* Extra halo layers ONLY when scary override is active — gives thicker, scarier red */}
          {useOverride && (
            <>
              {centers.map((p, i) => (
                <mesh
                  key={`halo2-${i}`}
                  geometry={sphereGeo}
                  position={p}
                  scale={glowScale * 1.6}
                  ref={(m) => {
                    if (group.current && m) {
                      const mat = new THREE.MeshBasicMaterial({
                        color: barColor,
                        transparent: true,
                        opacity: haloBase * 0.6,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        toneMapped: false,
                      });
                      m.material = mat;
                      group.current.userData.pulseMats.extraHaloMats[0] = mat;
                    }
                  }}
                />
              ))}
              {centers.map((p, i) => (
                <mesh
                  key={`halo3-${i}`}
                  geometry={sphereGeo}
                  position={p}
                  scale={glowScale * 1.95}
                  ref={(m) => {
                    if (group.current && m) {
                      const mat = new THREE.MeshBasicMaterial({
                        color: barColor,
                        transparent: true,
                        opacity: haloBase * 0.32,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        toneMapped: false,
                      });
                      m.material = mat;
                      group.current.userData.pulseMats.extraHaloMats[1] = mat;
                    }
                  }}
                />
              ))}
            </>
          )}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '10vh',
  rpm = 14.4,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.35,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,
  overrideGlowOpacity,
  style = {},
  className = '',
}) {
  return (
    <div className={className} style={{ height, width: '100%', ...style }}>
      <Canvas
        dpr={[1, 3]}                           // allow DPR up to 3 → sharper on iPhone
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'auto' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />

        <OrbCross
          rpm={rpm}
          color={color}
          geomScale={geomScale}
          offsetFactor={offsetFactor}
          armRatio={armRatio}
          glow={glow}
          glowOpacity={glowOpacity}
          glowScale={glowScale}
          includeZAxis={includeZAxis}
          onActivate={onActivate}
          overrideAllColor={overrideAllColor}
          overrideGlowOpacity={overrideGlowOpacity}
        />
      </Canvas>
    </div>
  );
}
