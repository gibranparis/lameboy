'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * 3D "orb cross" (5 spheres + 2 cylinders) with emissive + additive halo glow.
 * Transparent background; wrapper uses pointer-events: none.
 *
 * Tuned smaller + faster + neon seafoam by default.
 */
function OrbCross({
  r = 0.065,            // sphere radius (¼ of the previous 0.26)
  armR = 0.021,         // arm radius   (¼ of the previous 0.085)
  color = '#32ffc7',    // neon seafoam
  rpm = 6,              // faster spin
  glow = true,
  glowOpacity = 0.6,
  glowScale = 1.35,
}) {
  const g = useRef();

  useFrame((_, dt) => {
    const speed = (rpm * Math.PI * 2) / 60; // rad/s
    if (g.current) g.current.rotation.y += speed * dt;
  });

  const {
    sphereGeo,
    armGeoX, armGeoY,
    armGlowGeoX, armGlowGeoY,
    coreMat, haloMat,
    offset,
  } = useMemo(() => {
    const sphereGeo = new THREE.SphereGeometry(r, 48, 32);

    // distance from center to orb centers
    const offset = r * 2.1;

    // arm length (slightly embedded into spheres for seamless joints)
    const armLen = 2 * (offset - r * 0.12);

    const armGeoX = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

    // glow arms (slightly thicker + longer)
    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    // core material with emissive inner glow
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.22,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.15, // neon vibe
    });

    // additive halo material (outer glow)
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: glowOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, offset };
  }, [r, armR, color, glowScale, glowOpacity]);

  return (
    <group ref={g}>
      {/* Arms */}
      <mesh geometry={armGeoX} material={coreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={coreMat} />

      {/* Center + 4 orbs */}
      <mesh geometry={sphereGeo} material={coreMat} position={[0, 0, 0]} />
      <mesh geometry={sphereGeo} material={coreMat} position={[ offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={coreMat} position={[-offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={coreMat} position={[0,  offset, 0]} />
      <mesh geometry={sphereGeo} material={coreMat} position={[0, -offset, 0]} />

      {/* Outer halos (cheap, no postprocessing) */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={haloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={haloMat} />
          {[ [0,0,0], [ offset,0,0], [-offset,0,0], [0, offset,0], [0,-offset,0] ].map((p, i) => (
            <mesh key={`halo-${i}`} geometry={sphereGeo} material={haloMat} position={p} scale={glowScale} />
          ))}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '7.5vh',   // ~¼ of the previous 30vh visual footprint
  rpm = 6,
  color = '#32ffc7',
  r = 0.065,
  armR = 0.021,
  glow = true,
}) {
  return (
    <div style={{ height, width: '100%', pointerEvents: 'none' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        {/* Transparent background so page shows through */}
        <ambientLight intensity={0.95} />
        <directionalLight position={[3, 2, 4]} intensity={1.35} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross r={r} armR={armR} color={color} rpm={rpm} glow={glow} />
      </Canvas>
    </div>
  );
}
