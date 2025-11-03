// src/components/BlueOrbCross3D.jsx
'use client';

import * as THREE from 'three';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function OrbCross({
  rpm = 14.4,                 // base RPM (sign controls CW/CCW)
  rpmBreath = 0.12,           // 0..≈0.3 gentle modulation depth
  breathHz = 0.18,            // cycles per second for the “wind”
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.35,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,     // legacy (kept for compat)
  overrideHaloColor = null,    // NEW: only halos/glow take this color
  overrideGlowOpacity,
  __interactive = false,
}) {
  const group = useRef();

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;

  useFrame((state, dt) => {
    if (!group.current) return;

    // Hypnotic “wind” – small RPM breathing
    const t = state.clock.getElapsedTime();
    const breath = 1 + (Math.sin(t * Math.PI * 2 * breathHz) * rpmBreath);
    const rpmNow = rpm * breath;
    group.current.rotation.y += ((rpmNow * Math.PI * 2) / 60) * dt;

    // pulse animation for halos if needed
    const u = group.current.userData;
    if ((overrideAllColor || overrideHaloColor) && glow && u?.pulse) {
      const p = 0.85 + Math.sin(t * 3.6) * 0.15;
      const b = u.base * p;
      u.barHalo.opacity = b * 0.55;
      u.sphereHalos.forEach((m) => (m.opacity = b));
      u.halo2.opacity = b * 0.65;
      u.halo3.opacity = b * 0.35;
    }
  });

  const memo = useMemo(() => {
    const r = 0.144 * geomScale;
    const armR = Math.max(0.001, r * armRatio);
    const offset = r * offsetFactor;
    const armLen = 2 * (offset - r * 0.12);

    const sphereGeo   = new THREE.SphereGeometry(r, 48, 32);
    const armGeoX     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoY     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);
    const armGeoZ     = new THREE.CylinderGeometry(armR, armR, armLen, 48, 1, true);

    const armGlowGeoX = new THREE.CylinderGeometry(armR * 1.35, armR * 1.35, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * 1.35, armR * 1.35, armLen * 1.02, 48, 1, true);
    const armGlowGeoZ = new THREE.CylinderGeometry(armR * 1.35, armR * 1.35, armLen * 1.02, 48, 1, true);

    const centers = [
      [0, 0, 0],
      [ offset, 0, 0],
      [-offset, 0, 0],
      [0,  offset, 0],
      [0, -offset, 0],
    ];
    if (includeZAxis) centers.push([0,0, offset],[0,0,-offset]);

    const CHAKRA = {
      root:'#ef4444', sacral:'#f97316', solar:'#facc15',
      heart:'#22c55e', throat:'#3b82f6', thirdEye:'#4f46e5',
      crownV:'#c084fc', crownW:'#f6f3ff',
    };

    return { sphereGeo, armGeoX, armGeoY, armGeoZ, armGlowGeoX, armGlowGeoY, armGlowGeoZ, centers, CHAKRA };
  }, [geomScale, armRatio, offsetFactor, includeZAxis]);

  const {
    sphereGeo, armGeoX, armGeoY, armGeoZ,
    armGlowGeoX, armGlowGeoY, armGlowGeoZ,
    centers, CHAKRA
  } = memo;

  const useOverrideAll   = !!overrideAllColor;
  const useHaloOverride  = !!overrideHaloColor;

  const barColor = useOverrideAll ? overrideAllColor : color;

  const haloBase = (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) * (coarse ? 0.55 : 1.0);
  const coreEmissive = useOverrideAll ? 2.25 : 1.25;
  const barEmissive  = useOverrideAll ? 1.35 : 0.6;

  const barCoreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: barColor, roughness:0.32, metalness:0.25,
    emissive:new THREE.Color(barColor), emissiveIntensity:barEmissive, toneMapped:true,
  }), [barColor, barEmissive]);

  // If halo override is set, use that color for the bar glow; otherwise use barColor
  const barHaloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: useHaloOverride ? overrideHaloColor : barColor,
    transparent:true, opacity: glow ? haloBase * 0.5 : 0,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [useHaloOverride, overrideHaloColor, barColor, glow, haloBase]);

  // Sphere definitions for CORE colors (always chakra unless overrideAllColor)
  const sphereDefs = useOverrideAll
    ? new Array(centers.length).fill({ core: barColor })
    : [
        { core: CHAKRA.crownW },
        { core: CHAKRA.root   },
        { core: CHAKRA.sacral },
        { core: CHAKRA.solar  },
        { core: CHAKRA.heart  },
        { core: CHAKRA.throat },
        { core: CHAKRA.thirdEye },
      ];

  // Core materials stay chakra-colored unless overrideAllColor
  const sphereCoreMats = useMemo(
    () => sphereDefs.map(({ core }) => new THREE.MeshStandardMaterial({
      color: core, roughness:0.28, metalness:0.25,
      emissive:new THREE.Color(core), emissiveIntensity: coreEmissive, toneMapped:true,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverrideAll ? barColor : JSON.stringify(sphereDefs), coreEmissive]
  );

  // Halo materials: either chakra hues OR the override halo color (keeping cores intact)
  const sphereHaloMats = useMemo(() => {
    if (!glow) return sphereDefs.map(() => new THREE.MeshBasicMaterial({ transparent:true, opacity:0 }));
    if (useHaloOverride) {
      return sphereDefs.map(() => new THREE.MeshBasicMaterial({
        color: overrideHaloColor, transparent:true, opacity: haloBase,
        blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
      }));
    }
    // default: chakra halo colors mirroring cores
    const HALOS = [
      '#c084fc',  // crownV
      '#ef4444',  // root
      '#f97316',  // sacral
      '#facc15',  // solar
      '#22c55e',  // heart
      '#3b82f6',  // throat
      '#4f46e5',  // thirdEye
    ];
    return HALOS.map((h) => new THREE.MeshBasicMaterial({
      color: h, transparent:true, opacity: haloBase,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
    }));
  }, [glow, useHaloOverride, overrideHaloColor, haloBase, sphereDefs.length]);

  const halo2Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: useHaloOverride ? overrideHaloColor : barColor,
    transparent:true, opacity: haloBase * 0.6,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [useHaloOverride, overrideHaloColor, barColor, haloBase]);

  const halo3Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: useHaloOverride ? overrideHaloColor : barColor,
    transparent:true, opacity: haloBase * 0.32,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [useHaloOverride, overrideHaloColor, barColor, haloBase]);

  useEffect(() => {
    if (!group.current) return;
    group.current.userData = {
      pulse:true, base:haloBase,
      barHalo:barHaloMat, sphereHalos:sphereHaloMats,
      halo2:halo2Mat, halo3:halo3Mat
    };
  }, [haloBase, barHaloMat, sphereHaloMats, halo2Mat, halo3Mat]);

  const handlePointerDown = __interactive ? (e) => { e.stopPropagation(); onActivate && onActivate(); } : undefined;
  const handleKeyDown     = __interactive ? (e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); onActivate && onActivate(); } } : undefined;

  return (
    <group ref={group} onPointerDown={handlePointerDown} onKeyDown={handleKeyDown} tabIndex={__interactive ? 0 : -1}>
      {/* Bars */}
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={barCoreMat} />
      {includeZAxis && <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />}

      {/* Spheres (cores keep their colors) */}
      {centers.map((p, i) => (
        <mesh key={`core-${i}`} geometry={sphereGeo} material={sphereCoreMats[i]} position={p} />
      ))}

      {/* Halos */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={barHaloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={barHaloMat} />
          {includeZAxis && <mesh geometry={armGlowGeoZ} material={barHaloMat} rotation={[Math.PI / 2, 0, 0]} />}

          {centers.map((p, i) => (
            <mesh key={`halo-${i}`} geometry={sphereGeo} material={sphereHaloMats[i]} position={p} scale={glowScale} />
          ))}

          {/* Outer breathing halos (use halo override color if present) */}
          <>
            {centers.map((p, i) => (
              <mesh key={`h2-${i}`} geometry={sphereGeo} material={halo2Mat} position={p} scale={glowScale * 1.6} />
            ))}
            {centers.map((p, i) => (
              <mesh key={`h3-${i}`} geometry={sphereGeo} material={halo3Mat} position={p} scale={glowScale * 1.95} />
            ))}
          </>
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '28px',
  rpm = 14.4,
  rpmBreath = 0.12,
  breathHz = 0.18,
  color = '#32ffc7',
  geomScale = 1,
  offsetFactor = 2.05,
  armRatio = 0.33,
  glow = true,
  glowOpacity = 0.7,
  glowScale = 1.35,
  includeZAxis = true,
  onActivate = null,
  overrideAllColor = null,
  overrideHaloColor = null,   // NEW
  overrideGlowOpacity,
  style = {},
  className = '',
  interactive = false,
  respectReducedMotion = false,
}) {
  const [maxDpr, setMaxDpr] = useState(2);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const pr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    setMaxDpr(Math.min(2, Math.max(1, pr)));
    if (respectReducedMotion) {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      setReduced(!!mq?.matches);
      const onChange = (e) => setReduced(e.matches);
      mq?.addEventListener?.('change', onChange);
      return () => mq?.removeEventListener?.('change', onChange);
    } else {
      setReduced(false);
    }
  }, [respectReducedMotion]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        height,
        width: height,
        display: 'inline-block',
        contain: 'layout paint style',
        isolation: 'isolate',
        pointerEvents: interactive ? 'auto' : 'none',
        ...style,
      }}
    >
      <Canvas
        dpr={[1, maxDpr]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position:'absolute', inset:0, pointerEvents: interactive ? 'auto' : 'none', outline:'none', zIndex:2 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross
          rpm={reduced ? 0 : rpm}
          rpmBreath={rpmBreath}
          breathHz={breathHz}
          color={color}
          geomScale={geomScale}
          offsetFactor={offsetFactor}
          armRatio={armRatio}
          glow={glow}
          glowOpacity={glowOpacity}
          glowScale={glowScale}
          includeZAxis={includeZAxis}
          onActivate={interactive ? onActivate : null}
          overrideAllColor={overrideAllColor}
          overrideHaloColor={overrideHaloColor}     // ⟵ only halos change on pulse
          overrideGlowOpacity={overrideGlowOpacity}
          __interactive={interactive}
        />
      </Canvas>
    </div>
  );
}
