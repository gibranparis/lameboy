'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Knot() {
  const ref = useRef();
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.6;
    ref.current.rotation.x += d * 0.15;
  });
  return (
    <group ref={ref}>
      <mesh>
        <torusKnotGeometry args={[0.72, 0.22, 220, 20]} />
        <meshPhysicalMaterial
          color="#4b9cd3"          /* Carolina blue */
          metalness={0.15}
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive="#4b9cd3"
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* faint wireframe aura */}
      <mesh scale={1.15}>
        <torusKnotGeometry args={[0.72, 0.002, 120, 16]} />
        <meshBasicMaterial wireframe opacity={0.25} transparent color="#4b9cd3" />
      </mesh>
    </group>
  );
}

export default function SpinningLogo() {
  return (
    <Canvas
      className="logo-3d"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 45, position: [0, 0, 4] }}
    >
      {/* transparent scene over your black page */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 5]} intensity={1.1} />
      <Knot />
    </Canvas>
  );
}
