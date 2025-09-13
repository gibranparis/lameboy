'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

/**
 * World-Govt style 3D “orb cross”: 5 spheres joined by same-width bars.
 * Adjustable ratios so you can match the flat logo precisely.
 *
 * Props you’ll likely tweak:
 *  - color         : '#32ffc7' (neon seafoam) or '#0d0a58' (navy like the logo)
 *  - rpm           : 7.2 (20% faster than 6)
 *  - geomScale     : 1 (overall size of geometry; independent from CSS height)
 *  - offsetFactor  : 2.05 (center→outer orb distance as a multiple of r)
 *  - armRatio      : 0.33 (bar radius as a fraction of orb radius)
 *  - glow          : true/false (outer additive halos)
 */
function OrbCross({
  rpm = 7.2,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.6,
  glowScale = 1.35,
}) {
  const g = useRef();

  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt;
  });

  const {
    sphereGeo,
    armGeoX, armGeoY,
    armGlowGeoX, armGlowGeoY,
    coreMat, haloMat,
    centers,
  } = useMemo(() => {
    // Base orb radius (you liked this size); scaleable via geomScale
    const r = 0.144 * geomScale;
    const armR = Math.max(0.001, r * armRatio);
    const offset = r * offsetFactor;
    const armLen = 2 * (offset - r * 0.12); // tuck slightly into spheres for seamless joints

    const sphereGeo  = new THREE.SphereGeometry(r, 48, 32);
    const armGeoX    = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY    = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGlowGeoX= new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY= new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    const coreMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,     // a touch glossier to read like a glossy emblem
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

    return { sphereGeo, armGeoX, armGeoY, armGlowGeoX, armGlowGeoY, coreMat, haloMat, centers };
  }, [geomScale, a]()
