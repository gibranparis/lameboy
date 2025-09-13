'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * 3D "orb cross" (5 spheres + 2 cylinders) with emissive + additive halo glow.
 * This version keeps geometry ratios internally so external props can't break it.
 *
 * Props:
 *   height     — CSS height of the canvas wrapper (default '10vh')
 *   rpm        — rotations per minute (default 7.2)
 *   color      — hex color (default neon seafoam '#32ffc7')
 *   geomScale  — uniform scale multiplier for geometry (default 1)
 *   style      — wrapper style (e.g., marginBottom to nudge spacing)
 */
function OrbCross({ rpm = 7.2, color = '#32ffc7', geomScale = 1 }) {
  const g = useRef();

  useFrame((_, dt) => {
    const speed = (rpm * Math.PI * 2) / 60; // rad/s
    if (g.current) g.current.rotation.y += speed * dt;
  });

  const { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, centers } =
    useMemo(() => {
      // BASE dimensions (the 2× size you liked)
      const r = 0.144 * geomScale;        // sphere radius
      const armR = 0.048 * geomScale;     // arm radius (safe ratio to r)
      const offset = r * 2.1;             // center → orb centers
      const armLen = 2 * (offset - r * 0.12);

      const sphereGeo = new THREE.SphereGeometry(r, 48, 32);
      const armGeoX = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
      const armGeoY = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

      // Glow shells (slightly thicker & longer)
      const glowScale = 1.35;
      const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
      const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

      const coreMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.42,
        metalness: 0.22,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.15,
      });

      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const centers = [
        [0, 0, 0],
        [ offset, 0, 0],
        [-offset, 0, 0],
        [0,  offset, 0],
        [0, -offset, 0],
      ];

      return { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, centers };
    }, [geomScale, color]);

  return (
    <group ref={g}>
      {/* arms */}
      <mesh geometry={armGeoX} material={coreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={coreMat} />

      {/* orbs */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={coreMat} position={p} />
      ))}

      {/* halos (cheap bloom) */}
      <>
        <mesh geometry={armGlowGeoX} material={haloMat} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={armGlowGeoY} material={haloMat} />
        {centers.map((p, i) => (
          <mesh key={`halo-${i}`} geometry={sphereGeo} material={haloMat} position={p} scale={1.35} />
        ))}
      </>
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '10vh',
  rpm = 7.2,
  color = '#32ffc7',
  geomScale = 1,
  style = {},
  className = '',
}) {
  return (
    <div className={className} style={{ height, width: '100%', pointerEvents: 'none', ...style }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.95} />
        <directionalLight position={[3, 2, 4]} intensity={1.35} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross rpm={rpm} color={color} geomScale={geomScale} />
      </Canvas>
    </div>
  );
}
