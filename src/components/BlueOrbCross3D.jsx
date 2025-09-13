// src/components/BlueOrbCross3D.jsx
'use client';

import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * 3-axis orb-cross (±X, ±Y, ±Z) with per-orb chakra glows.
 * Normal mode = chakra spheres + seafoam bars.
 * If `overrideAllColor` is provided, EVERYTHING (spheres + bars + halos) uses that color.
 *
 * Props
 * - height: CSS height for canvas (e.g., "10vh")
 * - rpm: rotations per minute (Y axis)
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

  useFrame((_, dt) => {
    if (!group.current) return;
    const rps = ((rpm * Math.PI * 2) / 60);
    group.current.rotation.y += rps * dt;
    group.current.rotation.x += (rps * 0.12) * dt; // tiny tilt for depth
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

    // If override is active → all one color; else chakra mapping
    const useOverride = !!overrideAllColor;
    const _barColor   = useOverride ? overrideAllColor : color;
    const _haloOpBase = useOverride ? (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) : glowOpacity;
    const coreEmissive = useOverride ? 2.0 : 1.25;
    const barEmissive  = useOverride ? 1.2 : 0.6;

    const sphereColors = useOverride
      ? new Array(centers.length).fill({ core: _barColor, halo: _barColor, haloOp: _haloOpBase })
      : [
          { core: CHAKRA.crownW, halo: CHAKRA.crownV, haloOp: 0.9 }, // center
          { core: CHAKRA.root,     halo: CHAKRA.root,     haloOp: glowOpacity },
          { core: CHAKRA.sacral,   halo: CHAKRA.sacral,   haloOp: glowOpacity },
          { core: CHAKRA.solar,    halo: CHAKRA.solar,    haloOp: glowOpacity },
          { core: CHAKRA.heart,    halo: CHAKRA.heart,    haloOp: glowOpacity },
          ...(includeZAxis
            ? [
                { core: CHAKRA.throat,   halo: CHAKRA.throat,   haloOp: glowOpacity },
                { core: CHAKRA.thirdEye, halo: CHAKRA.thirdEye, haloOp: glowOpacity },
              ]
            : []),
        ];

    // BAR materials
    const barCoreMat = new THREE.MeshStandardMaterial({
      color: _barColor,
      roughness: 0.38,
      metalness: 0.22,
      emissive: new THREE.Color(_barColor),
      emissiveIntensity: barEmissive,
      toneMapped: true,
    });
    const barHaloMat = new THREE.MeshBasicMaterial({
      color: _barColor,
      transparent: true,
      opacity: glow ? _haloOpBase * 0.45 : 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // SPHERE materials (per orb)
    const sphereCoreMats = sphereColors.map(({ core }) =>
      new THREE.MeshStandardMaterial({
        color: core,
        roughness: 0.34,
        metalness: 0.22,
        emissive: new THREE.Color(core),
        emissiveIntensity: coreEmissive,
        toneMapped: true,
      })
    );
    const sphereHaloMats = sphereColors.map(({ halo, haloOp }) =>
      new THREE.MeshBasicMaterial({
        color: halo,
        transparent: true,
        opacity: glow ? haloOp : 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    return {
      sphereGeo,
      armGeoX, armGeoY, armGeoZ,
      armGlowGeoX, armGlowGeoY, armGlowGeoZ,
      barCoreMat, barHaloMat,
      centers,
      sphereCoreMats,
      sphereHaloMats,
    };
  }, [
    geomScale, armRatio, offsetFactor,
    color, glow, glowOpacity, glowScale,
    includeZAxis, overrideAllColor, overrideGlowOpacity
  ]);

  const {
    sphereGeo,
    armGeoX, armGeoY, armGeoZ,
    armGlowGeoX, armGlowGeoY, armGlowGeoZ,
    barCoreMat, barHaloMat,
    centers,
    sphereCoreMats,
    sphereHaloMats,
  } = memo;

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
      ref={group}
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

      {/* Orbs */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={sphereCoreMats[i]} position={p} />
      ))}

      {/* Neon halos */}
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
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
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
