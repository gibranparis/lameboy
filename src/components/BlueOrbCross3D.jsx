'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * 3D "orb cross" composed of 5 spheres + 2 cylinders.
 * Transparent background; won't block clicks (wrapper uses pointer-events: none).
 *
 * Props:
 *   height  - CSS height of the canvas wrapper (default '42vh')
 *   rpm     - rotations per minute (default 2.2)
 *   color   - orb/arm color hex (default '#162bda')
 *   r       - sphere radius in world units (default 0.38)
 *   armR    - cylinder (arm) radius (default 0.12)
 */
function OrbCross({ r = 0.38, armR = 0.12, color = '#162bda', rpm = 2.2 }) {
  const g = useRef();

  useFrame((_, dt) => {
    if (!g.current) return;
    const speed = (rpm * Math.PI * 2) / 60; // rad/s
    g.current.rotation.y += speed * dt;
  });

  const { sphereGeo, armGeoX, armGeoY, material, offset } = useMemo(() => {
    const sphereGeo = new THREE.SphereGeometry(r, 48, 32);

    // distance from center to orb centers
    const offset = r * 2.1;

    // arms slightly embedded into spheres for seamless joints
    const len = 2 * (offset - r * 0.12);
    const armGeoX = new THREE.CylinderGeometry(armR, armR, len, 48, 1, true);
    const armGeoY = new THREE.CylinderGeometry(armR, armR, len, 48, 1, true);

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.25,
    });

    return { sphereGeo, armGeoX, armGeoY, material, offset };
  }, [r, armR, color]);

  return (
    <group ref={g}>
      {/* Arms */}
      <mesh geometry={armGeoX} material={material} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={material} />
      {/* Center + 4 orbs */}
      <mesh geometry={sphereGeo} material={material} position={[0, 0, 0]} />
      <mesh geometry={sphereGeo} material={material} position={[ offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={material} position={[-offset, 0, 0]} />
      <mesh geometry={sphereGeo} material={material} position={[0,  offset, 0]} />
      <mesh geometry={sphereGeo} material={material} position={[0, -offset, 0]} />
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '42vh',
  rpm = 2.2,
  color = '#162bda',
  r = 0.38,
  armR = 0.12,
}) {
  return (
    <div style={{ height, width: '100%', pointerEvents: 'none' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        {/* transparent bg so it floats over the page */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 2, 4]} intensity={1.1} />
        <OrbCross r={r} armR={armR} color={color} rpm={rpm} />
      </Canvas>
    </div>
  );
}
