'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/** 3D orb-cross with safe internal ratios, neon halo, and optional Z-axis (6 outer orbs). */
function OrbCross({
  rpm = 7.2,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,   // center→outer orb distance as multiple of r
  armRatio = 0.33,       // bar radius as fraction of r
  glow = true,
  glowOpacity = 0.6,
  glowScale = 1.35,
  includeZAxis = true,   // NEW: add ±Z arm + two orbs (6 outer total)
}) {
  const group = useRef();

  // spin
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt;
  });

  const memo = useMemo(() => {
    const r = 0.144 * geomScale;                   // base orb radius (your liked scale)
    const armR = Math.max(0.001, r * armRatio);    // bar radius
    const offset = r * offsetFactor;               // distance to outer orbs
    const armLen = 2 * (offset - r * 0.12);        // tuck into spheres slightly

    // Geometries
    const sphereGeo   = new THREE.SphereGeometry(r, 48, 32);

    // Bars are Y-oriented cylinders; rotate to align with axes
    const armGeoX     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoZ     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoZ = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    // Materials
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.22,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.15,
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: glowOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Sphere centers
    const centers = [
      [0, 0, 0],           // center
      [ offset, 0, 0],     // +X
      [-offset, 0, 0],     // -X
      [0,  offset, 0],     // +Y
      [0, -offset, 0],     // -Y
    ];

    if (includeZAxis) {
      centers.push([0, 0,  offset]);  // +Z (toward camera)
      centers.push([0, 0, -offset]);  // -Z (away)
    }

    return {
      sphereGeo,
      armGeoX, armGeoY, armGeoZ,
      armGlowGeoX, armGlowGeoY, armGlowGeoZ,
      coreMat, haloMat,
      centers,
    };
  }, [geomScale, armRatio, offsetFactor, color, glowOpacity, glowScale, includeZAxis]);

  const {
    sphereGeo,
    armGeoX, armGeoY, armGeoZ,
    armGlowGeoX, armGlowGeoY, armGlowGeoZ,
    coreMat, haloMat,
    centers,
  } = memo;

  return (
    <group ref={group}>
      {/* Bars */}
      <mesh geometry={armGeoX} material={coreMat} rotation={[0, 0, Math.PI / 2]} /> {/* X axis */}
      <mesh geometry={armGeoY} material={coreMat} />                                {/* Y axis */}
      {includeZAxis && (
        <mesh geometry={armGeoZ} material={coreMat} rotation={[Math.PI / 2, 0, 0]} /> /* Z axis */
      )}

      {/* Orbs */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={coreMat} position={p} />
      ))}

      {/* Neon halos */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={haloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={haloMat} />
          {includeZAxis && (
            <mesh geometry={armGlowGeoZ} material={haloMat} rotation={[Math.PI / 2, 0, 0]} />
          )}
          {centers.map((p, i) => (
            <mesh key={`halo-${i}`} geometry={sphereGeo} material={haloMat} position={p} scale={1.35} />
          ))}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '10vh',
  rpm = 7.2,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.6,
  glowScale = 1.35,
  includeZAxis = true,   // default to 6 outer orbs
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
