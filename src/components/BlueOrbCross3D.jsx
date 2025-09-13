'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/** Safe-geometry 3D orb cross with emissive + additive glow. */
function OrbCross({ rpm = 7.2, color = '#32ffc7', geomScale = 1 }) {
  const g = useRef();
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt; });

  const { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, centers } =
    useMemo(() => {
      const r = 0.144 * geomScale;
      const armR = 0.048 * geomScale;
      const offset = r * 2.1;
      const armLen = 2 * (offset - r * 0.12);

      const sphereGeo = new THREE.SphereGeometry(r, 48, 32);
      const armGeoX = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
      const armGeoY = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

      const glowScale = 1.35;
      const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
      const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

      const coreMat = new THREE.MeshStandardMaterial({
        color, roughness: 0.42, metalness: 0.22,
        emissive: new THREE.Color(color), emissiveIntensity: 1.15,
      });
      const haloMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });

      const centers = [[0,0,0],[ offset,0,0],[-offset,0,0],[0, offset,0],[0,-offset,0]];
      return { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, centers };
    }, [geomScale, color, rpm]);

  return (
    <group ref={g}>
      <mesh geometry={armGeoX} material={coreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={coreMat} />
      {centers.map((p, i) => <mesh key={`core-${i}`} geometry={sphereGeo} material={coreMat} position={p} />)}
      <mesh geometry={armGlowGeoX} material={haloMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGlowGeoY} material={haloMat} />
      {centers.map((p, i) => <mesh key={`halo-${i}`} geometry={sphereGeo} material={haloMat} position={p} scale={1.35} />)}
    </group>
  );
}

export default function BlueOrbCross3D({ rpm = 7.2, color = '#32ffc7', geomScale = 1, style = {}, className = '' }) {
  return (
    <div className={className} style={{ height: '10vh', width: '100%', pointerEvents: 'none', ...style }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.95} />
        <directionalLight position={[3, 2, 4]} intensity={1.35} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross rpm={rpm} color={color} geomScale={geomScale} />
      </Canvas>
    </div>
  );
}
