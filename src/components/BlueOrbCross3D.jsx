'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * 3D "orb cross" (5 spheres + 2 cylinders) with optional additive "glow"
 * Transparent background; wrapper uses pointer-events: none.
 *
 * Props:
 *   height   CSS height of canvas wrapper (default '30vh')
 *   rpm      rotations per minute (default 2)
 *   color    hex color (default '#162bda')
 *   r        sphere radius in world units (default 0.26)  ← smaller
 *   armR     cylinder (arm) radius (default 0.085)        ← smaller
 *   glow     enable outer halo meshes (default true)
 *   glowOpacity  halo opacity (default 0.35)
 *   glowScale    halo scale multiplier (default 1.18)
 */
function OrbCross({
  r = 0.26,
  armR = 0.085,
  color = '#162bda',
  rpm = 2,
  glow = true,
  glowOpacity = 0.35,
  glowScale = 1.18,
}) {
  const g = useRef();

  useFrame((_, dt) => {
    if (!g.current) return;
    const speed = (rpm * Math.PI * 2) / 60; // rad/s
    g.current.rotation.y += speed * dt;
  });

  const {
    sphereGeo, armGeoLen, armGeoX, armGeoY,
    mat, emissiveMat, glowSphereMat, glowArmMat, offset
  } = useMemo(() => {
    const sphereGeo = new THREE.SphereGeometry(r, 48, 32);

    // distance from center to orb centers
    const offset = r * 2.1;

    // arm length (slightly embedded into spheres for seamless joints)
    const armGeoLen = 2 * (offset - r * 0.12);
    const armGeoX = new THREE.CylinderGeometry(armR, armR, armGeoLen, 48, 1, true);
    const armGeoY = new THREE.CylinderGeometry(armR, armR, armGeoLen, 48, 1, true);

    // core material with emissive "inner glow"
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.25,
    });
    mat.emissive = new THREE.Color(color);
    mat.emissiveIntensity = 0.45; // soft inner glow

    // optional additive halo materials (outer glow)
    const glowSphereMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: glowOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowArmMat = glowSphereMat.clone();

    // emissive for the center sphere looks nice a touch stronger
    const emissiveMat = mat;

    return { sphereGeo, armGeoLen, armGeoX, armGeoY, mat, emissiveMat, glowSphereMat, glowArmMat, offset };
  }, [r, armR, color, glowOpacity]);

  return (
    <group ref={g}>
      {/* Arms */}
      <mesh geometry={armGeoX} material={mat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={mat} />

      {/* Center + 4 orbs */}
      <mesh geometry={sphereGeo} material={emissiveMat} position={[0, 0, 0]} />
      <mesh geometry={sphereGeo} material={mat} position={[ offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={mat} position={[-offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={mat} position={[0,  offset, 0]} />
      <mesh geometry={sphereGeo} material={mat} position={[0, -offset, 0]} />

      {/* Additive “halo” shells for glow (cheap, no postprocessing) */}
      {glow && (
        <>
          {/* halo arms: slightly thicker, slightly longer */}
          <mesh
            geometry={new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armGeoLen * 1.02, 48, 1, true)}
            material={glowArmMat}
            rotation={[0, 0, Math.PI / 2]}
          />
          <mesh
            geometry={new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armGeoLen * 1.02, 48, 1, true)}
            material={glowArmMat}
          />
          {/* halo spheres */}
          {[ [0,0,0], [ offset,0,0], [-offset,0,0], [0, offset,0], [0,-offset,0] ].map((p, i) => (
            <mesh key={`halo-${i}`} geometry={sphereGeo} material={glowSphereMat} position={p}>
              <primitive object={new THREE.Object3D()} />
              {/* scale via object3D wrapper to avoid altering main geometry */}
              <group scale={[glowScale, glowScale, glowScale]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '30vh',
  rpm = 2,
  color = '#162bda',
  r = 0.26,
  armR = 0.085,
  glow = true,
}) {
  return (
    <div style={{ height, width: '100%', pointerEvents: 'none' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        {/* keep background transparent so the page shows through */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 2, 4]} intensity={1.2} />
        {/* slight rim light for definition */}
        <directionalLight position={[-3, -2, -4]} intensity={0.3} />
        <OrbCross r={r} armR={armR} color={color} rpm={rpm} glow={glow} />
      </Canvas>
    </div>
  );
}
