// src/components/BlueOrbCross3D.jsx
'use client';

import * as THREE from 'three';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function OrbCross({
  rpm = 14.4,
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
  overrideGlowOpacity,
  interactive = false,
  haloTint = null,
  /** NEW: how long the click flash should persist (ms) */
  flashDecayMs = 210,
}) {
  const group = useRef();

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt;

    const u = group.current.userData;
    if (!u) return;

    const now = performance.now();
    const flashing = u.flashUntil && now < u.flashUntil;

    if (glow && u?.pulse) {
      // Normal idle pulse speed
      let pulseSpeed = 3.6;
      // During flash window, make it feel snappy (double speed)
      if (flashing) pulseSpeed = 7.2;

      const t = state.clock.getElapsedTime();
      const pulse = 0.85 + Math.sin(t * pulseSpeed) * 0.15;

      // Base halo level
      let b = u.base * pulse;

      // During flash: emphasize the first ~half of the window, then
      // quickly settle so it never "lingers" looking laggy
      if (flashing) {
        const remain = Math.max(0, u.flashUntil - now);
        const k = Math.min(1, remain / flashDecayMs); // 1→0 over the window
        // Quick rise, quick fall: slightly clamp + ease
        b = Math.min(1, b * (0.85 + 0.3 * k));
      }

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

  const useOverride = !!overrideAllColor;
  const barColor = useOverride ? overrideAllColor : color;

  const haloBase = (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) * (coarse ? 0.55 : 1.0);
  const coreEmissive = useOverride ? 2.25 : 1.25;
  const barEmissive  = useOverride ? 1.35 : 0.6;

  const barCoreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: barColor, roughness:0.32, metalness:0.25,
    emissive:new THREE.Color(barColor), emissiveIntensity:barEmissive, toneMapped:true,
  }), [barColor, barEmissive]);

  const barHaloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: haloTint || barColor,
    transparent:true, opacity: glow ? haloBase * 0.5 : 0,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, glow, haloBase, haloTint]);

  const sphereDefs = useOverride
    ? new Array(centers.length).fill({ core: barColor, halo: haloTint || barColor, haloOp: haloBase })
    : [
        { core: CHAKRA.crownW,  halo: haloTint || CHAKRA.crownV,  haloOp: 0.9 * (coarse ? 0.55 : 1.0) },
        { core: CHAKRA.root,    halo: haloTint || CHAKRA.root,    haloOp: haloBase },
        { core: CHAKRA.sacral,  halo: haloTint || CHAKRA.sacral,  haloOp: haloBase },
        { core: CHAKRA.solar,   halo: haloTint || CHAKRA.solar,   haloOp: haloBase },
        { core: CHAKRA.heart,   halo: haloTint || CHAKRA.heart,   haloOp: haloBase },
        { core: CHAKRA.throat,  halo: haloTint || CHAKRA.throat,  haloOp: haloBase },
        { core: CHAKRA.thirdEye,halo: haloTint || CHAKRA.thirdEye,haloOp: haloBase },
      ];

  const sphereCoreMats = useMemo(
    () => sphereDefs.map(({ core }) => new THREE.MeshStandardMaterial({
      color: core, roughness:0.28, metalness:0.25,
      emissive:new THREE.Color(core), emissiveIntensity: coreEmissive, toneMapped:true,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs.map(s=>s.core)), coreEmissive]
  );

  const sphereHaloMats = useMemo(
    () => sphereDefs.map(({ halo, haloOp }) => new THREE.MeshBasicMaterial({
      color: halo, transparent:true, opacity: glow ? haloOp : 0,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? (haloTint || barColor) : JSON.stringify(sphereDefs.map(s=>s.halo)), glow, haloTint, barColor]
  );

  const halo2Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: haloTint || barColor, transparent:true, opacity: haloBase * 0.6,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, haloBase, haloTint]);

  const halo3Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: haloTint || barColor, transparent:true, opacity: haloBase * 0.32,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, haloBase, haloTint]);

  useEffect(() => {
    if (!group.current) return;
    group.current.userData = {
      pulse:true, base:haloBase,
      barHalo:barHaloMat, sphereHalos:sphereHaloMats,
      halo2:halo2Mat, halo3:halo3Mat,
      flashUntil: 0,
      flashDecayMs,
    };
  }, [haloBase, barHaloMat, sphereHaloMats, halo2Mat, halo3Mat, flashDecayMs]);

  const triggerFlash = () => {
    if (!group.current?.userData) return;
    const u = group.current.userData;
    u.flashUntil = performance.now() + (u.flashDecayMs || flashDecayMs);
  };

  const handlePointerDown = interactive ? (e) => {
    e.stopPropagation();
    triggerFlash();
    onActivate && onActivate();
  } : undefined;

  const handleKeyDown = interactive ? (e) => {
    if (e.key==='Enter'||e.key===' ') {
      e.preventDefault();
      triggerFlash();
      onActivate && onActivate();
    }
  } : undefined;

  return (
    <group
      ref={group}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : -1}
    >
      {/* Bars */}
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={barCoreMat} />
      {includeZAxis && <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />}

      {/* Spheres */}
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

          {(overrideAllColor || haloTint) && (
            <>
              {centers.map((p, i) => (
                <mesh key={`h2-${i}`} geometry={sphereGeo} material={halo2Mat} position={p} scale={glowScale * 1.6} />
              ))}
              {centers.map((p, i) => (
                <mesh key={`h3-${i}`} geometry={sphereGeo} material={halo3Mat} position={p} scale={glowScale * 1.95} />
              ))}
            </>
          )}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '28px',
  rpm = 14.4,
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
  overrideGlowOpacity,
  style = {},
  className = '',
  interactive = false,
  respectReducedMotion = false,
  haloTint = null,
  /** NEW: forward flash duration control */
  flashDecayMs = 210,
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
        style={{ position: 'absolute', inset: 0, pointerEvents: interactive ? 'auto' : 'none', outline: 'none', zIndex: 2 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <OrbCross
          rpm={reduced ? 0 : rpm}
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
          overrideGlowOpacity={overrideGlowOpacity}
          interactive={interactive}
          haloTint={haloTint}
          flashDecayMs={flashDecayMs}
        />
      </Canvas>
    </div>
  );
}
