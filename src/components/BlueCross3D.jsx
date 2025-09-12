'use client';

import * as THREE from 'three';
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

/**
 * Extrudes ONLY non-white shapes from the given SVG (your blue cross),
 * skipping any white / transparent background. Renders a thin 3D object
 * and rotates it.
 *
 * Props you can tweak on the parent:
 *   height     CSS height of the canvas wrapper (default '42vh')
 *   rpm        rotations per minute (default 3)
 *   thickness  extrusion depth in world units (default 0.08)
 *   color      hex override (e.g. "#20a4ff"); if not set, uses SVG fills
 *   url        SVG path (default '/World_Government_flag.svg')
 */

function ExtrudedSVG({ url, rpm, thickness, color }) {
  const svg = useLoader(SVGLoader, url);
  const group = useRef();

  // Build meshes from non-white fills
  const meshes = useMemo(() => {
    const items = [];
    for (const p of svg.paths) {
      const rawFill = (p.userData?.style?.fill || '').trim();
      const fillLower = rawFill.toLowerCase();

      // Skip transparent / none
      const isNone = !rawFill || fillLower === 'none';

      // Skip whites (#fff / #ffffff / white / rgb(255,255,255))
      const isHashWhite = /^#f{3,8}$/i.test(rawFill) || /^#ffffff$/i.test(rawFill);
      const isNamedWhite = fillLower === 'white';
      const isRgbWhite = /^rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)$/i.test(fillLower);
      const isWhite = isHashWhite || isNamedWhite || isRgbWhite;

      if (isNone || isWhite) continue;

      const shapes = p.toShapes(true);
      for (const shape of shapes) {
        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: thickness,
          bevelEnabled: false,
          curveSegments: 16,
        });
        const mat = new THREE.MeshStandardMaterial({
          color: color ? new THREE.Color(color) : new THREE.Color(rawFill),
          metalness: 0.2,
          roughness: 0.45,
        });
        items.push(new THREE.Mesh(geom, mat));
      }
    }
    return items;
  }, [svg, thickness, color]);

  useLayoutEffect(() => {
    if (!group.current) return;

    // Add meshes to the group
    meshes.forEach((m) => group.current.add(m));

    // Flip SVG Y so it stands upright in 3D
    group.current.rotation.x = Math.PI;

    // Center & scale to a tidy size
    const box = new THREE.Box3().setFromObject(group.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    group.current.position.x -= center.x;
    group.current.position.y -= center.y;

    const target = 1.8; // target max dimension in world units
    const s = target / Math.max(size.x || 1, size.y || 1);
    group.current.scale.setScalar(s);

    return () => {
      // cleanup so we don't duplicate on hot reload
      meshes.forEach((m) => group.current.remove(m));
    };
  }, [meshes]);

  // Idle rotation
  useFrame((_, delta) => {
    const speed = (rpm * Math.PI * 2) / 60; // radians per second
    if (group.current) group.current.rotation.y += speed * delta;
  });

  return <group ref={group} />;
}

export default function BlueCross3D({
  height = '42vh',
  rpm = 3,
  thickness = 0.08,
  color = null,
  url = '/World_Government_flag.svg',
}) {
  return (
    <div style={{ height, width: '100%', pointerEvents: 'none' }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2.6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Transparent background so it blends with your page */}
        {/* no <color attach="background" /> on purpose */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 2, 3]} intensity={1.1} />
        <Suspense fallback={null}>
          <ExtrudedSVG url={url} rpm={rpm} thickness={thickness} color={color} />
        </Suspense>
      </Canvas>
    </div>
  );
}
<BlueCross3D height="42vh" rpm={2} thickness={0.06} color="#1ea7ff" />
