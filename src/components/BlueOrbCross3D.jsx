'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * 3-axis orb-cross (±X, ±Y, ±Z) with per-orb chakra glows.
 * Bars use the `color` prop (default seafoam). Each sphere gets its own core/halo color.
 */
function OrbCross({
  rpm = 7.2,
  color = '#32ffc7',     // bar color (seafoam)
  geomScale = 1,
  offsetFactor = 2.05,   // center→outer orb distance as multiple of r
  armRatio = 0.33,       // bar radius as fraction of r
  glow = true,
  glowOpacity = 0.7,     // base halo opacity (outer orbs)
  glowScale = 1.35,
  includeZAxis = true,   // keep 6 outer orbs
}) {
  const group = useRef();

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt;
  });

  const memo = useMemo(() => {
    const r = 0.144 * geomScale;
    const armR = Math.max(0.001, r * armRatio);
    const offset = r * offsetFactor;
    const armLen = 2 * (offset - r * 0.12);

    // Geometries (bars are Y-oriented; rotate for X/Z)
    const sphereGeo   = new THREE.SphereGeometry(r, 48, 32);
    const armGeoX     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoZ     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoZ = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    // BAR materials (single color)
    const barCoreMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.22,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.6,
    });
    const barHaloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: glow ? glowOpacity * 0.45 : 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Chakra palette (root→crown)
    const CHAKRA = {
      root:     '#ef4444', // red
      sacral:   '#f97316', // orange
      solar:    '#facc15', // yellow
      heart:    '#22c55e', // green
      throat:   '#3b82f6', // blue
      thirdEye: '#4f46e5', // indigo
      crownV:   '#c084fc', // violet
      crownW:   '#f6f3ff', // near-white violet-tinted
    };

    // Sphere positions in fixed order so we can map colors consistently
    const centers = [
      [0, 0, 0],           // center  (crown: white/violet)
      [ offset, 0, 0],     // +X  -> root (red)
      [-offset, 0, 0],     // -X  -> sacral (orange)
      [0,  offset, 0],     // +Y  -> solar (yellow)
      [0, -offset, 0],     // -Y  -> heart (green)
    ];
    if (includeZAxis) {
      centers.push([0, 0,  offset]);  // +Z -> throat (blue)
      centers.push([0, 0, -offset]);  // -Z -> third eye (indigo)
    }

    // Per-sphere colors (core + halo). Center gets white/violet combo.
    const sphereColors = [
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

    // Build per-sphere materials
    const sphereCoreMats = sphereColors.map(({ core }) =>
      new THREE.MeshStandardMaterial({
        color: core,
        roughness: 0.34,
        metalness: 0.22,
        emissive: new THREE.Color(core),
        emissiveIntensity: 1.25,
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
  }, [geomScale, armRatio, offsetFactor, color, glow, glowOpacity, glowScale, includeZAxis]);

  const {
    sphereGeo,
    armGeoX, armGeoY, armGeoZ,
    armGlowGeoX, armGlowGeoY, armGlowGeoZ,
    barCoreMat, barHaloMat,
    centers,
    sphereCoreMats,
    sphereHaloMats,
  } = memo;

  return (
    <group ref={group}>
      {/* Bars */}
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={barCoreMat} />
      {includeZAxis && (
        <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />
      )}

      {/* Orbs (per-sphere materials) */}
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
  rpm = 7.2,
  color = '#32ffc7',     // bar color
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.35,
  includeZAxis = true,
  style = {},
  className = '',
}) {
  return (
    <div className={className} style={{ height, width: '100%', pointerEvents: 'none', ...style }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
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
        />
      </Canvas>
    </div>
  );
}
