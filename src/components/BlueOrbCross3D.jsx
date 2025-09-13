'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * World-Govt style orb-cross: 5 spheres joined by equal-width bars.
 * Safe geometry (internal ratios) + optional neon halo.
 */
function OrbCross({
  rpm = 7.2,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05, // center→outer orb distance as multiple of r
  armRatio = 0.33,     // bar radius as fraction of r
  glow = true,
  glowOpacity = 0.6,
  glowScale = 1.35,
}) {
  const group = useRef();

  // spin
  useFrame((_, dt) => {
    if (!group.current) return;
    const speed = (rpm * Math.PI * 2) / 60; // rad/s
    group.current.rotation.y += speed * dt;
  });

  // build geometry + materials once per relevant prop change
  const memo = useMemo(() => {
    const r = 0.144 * geomScale;                   // base orb radius (you liked this scale)
    const armR = Math.max(0.001, r * armRatio);    // bar radius
    const offset = r * offsetFactor;               // distance to outer orbs
    const armLen = 2 * (offset - r * 0.12);        // tuck into spheres slightly

    const sphereGeo   = new THREE.SphereGeometry(r, 48, 32);
    const armGeoX     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

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

    const centers = [
      [0, 0, 0],
      [ offset, 0, 0],
      [-offset, 0, 0],
      [0,  offset, 0],
      [0, -offset, 0],
    ];

    return {
      sphereGeo,
      armGeoX,
      armGeoY,
      armGlowGeoX,
      armGlowGeoY,
      coreMat,
      haloMat,
      centers,
    };
  }, [geomScale, armRatio, offsetFactor, color, glowOpacity, glowScale]);

  const {
    sphereGeo,
    armGeoX, armGeoY,
    armGlowGeoX, armGlowGeoY,
    coreMat, haloMat,
    centers,
  } = memo;

  return (
    <group ref={group}>
      {/* bars */}
      <mesh geometry={armGeoX} material={coreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={coreMat} />

      {/* orbs */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={coreMat} position={p} />
      ))}

      {/* neon halos */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={haloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={haloMat} />
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
        />
      </Canvas>
    </div>
  );
}
