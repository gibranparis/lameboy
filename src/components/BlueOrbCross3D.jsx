// src/components/BlueOrbCross3D.jsx
'use client';

import * as THREE from 'three';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * IMPORTANT: We purposely disable raycast on any "halo" mesh so only the
 * visible solid geometry (bars + core spheres) are clickable/focusable.
 */

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
}) {
  const group = useRef();

  // Disable raycast helper for halo meshes only
  const NO_RAYCAST = useCallback(() => null, []);
  const handleActivate = useCallback((e) => {
    e.stopPropagation();
    onActivate && onActivate();
  }, [onActivate]);

  // rotate
  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += ((rpm * Math.PI * 2) / 60) * dt;

    // soft pulsing when override red is active
    const u = group.current.userData;
    if (overrideAllColor && glow && u?.pulse) {
      const t = state.clock.getElapsedTime();
      const pulse = 0.85 + Math.sin(t * 3.6) * 0.15;
      const b = u.base * pulse;
      u.barHalo.opacity = b * 0.55;
      u.sphereHalos.forEach(m => (m.opacity = b));
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

    const armGlowGeoX = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoY = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);
    const armGlowGeoZ = new THREE.CylinderGeometry(armR * glowScale, armR * glowScale, armLen * 1.02, 48, 1, true);

    const centers = [
      [0, 0, 0],
      [ offset, 0, 0],
      [-offset, 0, 0],
      [0,  offset, 0],
      [0, -offset, 0],
    ];
    if (includeZAxis) {
      centers.push([0, 0,  offset], [0, 0, -offset]);
    }

    const CHAKRA = {
      root:     '#ef4444', sacral: '#f97316', solar: '#facc15',
      heart:    '#22c55e', throat:'#3b82f6', thirdEye:'#4f46e5',
      crownV:   '#c084fc', crownW: '#f6f3ff',
    };

    return { sphereGeo, armGeoX, armGeoY, armGeoZ, armGlowGeoX, armGlowGeoY, armGlowGeoZ, centers, CHAKRA };
  }, [geomScale, armRatio, offsetFactor, glowScale, includeZAxis]);

  const { sphereGeo, armGeoX, armGeoY, armGeoZ, armGlowGeoX, armGlowGeoY, armGlowGeoZ, centers, CHAKRA } = memo;

  const useOverride = !!overrideAllColor;
  const barColor = useOverride ? overrideAllColor : color;

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer:coarse)').matches;
  const coarseGlowFactor = coarse ? 0.55 : 1.0;

  const haloBase = (overrideGlowOpacity ?? Math.min(1, glowOpacity * 1.35)) * coarseGlowFactor;
  const coreEmissive = useOverride ? 2.25 : 1.25;
  const barEmissive  = useOverride ? 1.35 : 0.6;

  // SOLID, CLICKABLE materials
  const barCoreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: barColor, roughness:0.32, metalness:0.25,
    emissive:new THREE.Color(barColor), emissiveIntensity:barEmissive, toneMapped:true,
  }), [barColor, barEmissive]);

  const sphereDefs = useOverride
    ? new Array(centers.length).fill({ core: barColor })
    : [
        { core: CHAKRA.crownW },
        { core: CHAKRA.root     },
        { core: CHAKRA.sacral   },
        { core: CHAKRA.solar    },
        { core: CHAKRA.heart    },
        { core: CHAKRA.throat   },
        { core: CHAKRA.thirdEye },
      ];

  const sphereCoreMats = useMemo(
    () => sphereDefs.map(({ core }) => new THREE.MeshStandardMaterial({
      color: core, roughness:0.28, metalness:0.25,
      emissive:new THREE.Color(core), emissiveIntensity: coreEmissive, toneMapped:true,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs), coreEmissive]
  );

  // HALO materials (non-clickable)
  const barHaloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: barColor, transparent:true, opacity: glow ? haloBase * 0.5 : 0,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, glow, haloBase]);

  const sphereHaloMats = useMemo(
    () => (useOverride
      ? new Array(centers.length).fill({ halo: barColor, haloOp: haloBase })
      : [
          { halo: CHAKRA.crownV, haloOp: 0.9 * coarseGlowFactor },
          { halo: CHAKRA.root,     haloOp: glowOpacity * coarseGlowFactor },
          { halo: CHAKRA.sacral,   haloOp: glowOpacity * coarseGlowFactor },
          { halo: CHAKRA.solar,    haloOp: glowOpacity * coarseGlowFactor },
          { halo: CHAKRA.heart,    haloOp: glowOpacity * coarseGlowFactor },
          { halo: CHAKRA.throat,   haloOp: glowOpacity * coarseGlowFactor },
          { halo: CHAKRA.thirdEye, haloOp: glowOpacity * coarseGlowFactor },
        ]
    ).map(({ halo, haloOp }) => new THREE.MeshBasicMaterial({
      color: halo, transparent:true, opacity: glow ? haloOp : 0,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : glowOpacity, glow, coarseGlowFactor, haloBase]
  );

  const halo2Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: barColor, transparent:true, opacity: haloBase * 0.6,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, haloBase]);

  const halo3Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: barColor, transparent:true, opacity: haloBase * 0.32,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, haloBase]);

  useEffect(() => {
    if (!group.current) return;
    group.current.userData = { pulse:true, base:haloBase, barHalo:barHaloMat, sphereHalos:sphereHaloMats, halo2:halo2Mat, halo3:halo3Mat };
  }, [haloBase, barHaloMat, sphereHaloMats, halo2Mat, halo3Mat]);

  // Make core pieces keyboard-accessible without giving a giant group hit area
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate && onActivate();
    }
  };

  return (
    <group ref={group}>
      {/* BAR CORES (clickable) */}
      <mesh
        geometry={armGeoX}
        material={barCoreMat}
        rotation={[0, 0, Math.PI / 2]}
        onPointerDown={handleActivate}
        onKeyDown={onKeyDown}
        tabIndex={0}
      />
      <mesh
        geometry={armGeoY}
        material={barCoreMat}
        onPointerDown={handleActivate}
        onKeyDown={onKeyDown}
        tabIndex={0}
      />
      <mesh
        geometry={armGeoZ}
        material={barCoreMat}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerDown={handleActivate}
        onKeyDown={onKeyDown}
        tabIndex={0}
      />

      {/* SPHERE CORES (clickable) */}
      {centers.map((p, i) => (
        <mesh
          key={`core-${i}`}
          geometry={sphereGeo}
          material={sphereCoreMats[i]}
          position={p}
          onPointerDown={handleActivate}
          onKeyDown={onKeyDown}
          tabIndex={0}
        />
      ))}

      {/* HALOS (non-clickable; raycast disabled) */}
      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={barHaloMat} rotation={[0, 0, Math.PI / 2]} raycast={NO_RAYCAST} />
          <mesh geometry={armGlowGeoY} material={barHaloMat} raycast={NO_RAYCAST} />
          <mesh geometry={armGlowGeoZ} material={barHaloMat} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST} />

          {centers.map((p, i) => (
            <mesh
              key={`halo-${i}`}
              geometry={sphereGeo}
              material={sphereHaloMats[i]}
              position={p}
              scale={glowScale}
              raycast={NO_RAYCAST}
            />
          ))}

          {overrideAllColor && (
            <>
              {centers.map((p, i) => (
                <mesh
                  key={`h2-${i}`}
                  geometry={sphereGeo}
                  material={halo2Mat}
                  position={p}
                  scale={glowScale * 1.6}
                  raycast={NO_RAYCAST}
                />
              ))}
              {centers.map((p, i) => (
                <mesh
                  key={`h3-${i}`}
                  geometry={sphereGeo}
                  material={halo3Mat}
                  position={p}
                  scale={glowScale * 1.95}
                  raycast={NO_RAYCAST}
                />
              ))}
            </>
          )}
        </>
      )}
    </group>
  );
}

export default function BlueOrbCross3D({
  height = '10vh',     // can be px (e.g., "32px") or vh
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
}) {
  const [maxDpr, setMaxDpr] = useState(2);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const pr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    setMaxDpr(Math.max(2, pr));
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
    const onChange = (e) => setReduced(e.matches);
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, []);

  // Tight wrapper: no width:100% so we don’t inherit extra hit area from layout
  return (
    <div
      className={className}
      style={{
        height,
        width: height,           // square and tight
        lineHeight: 0,
        display: 'inline-block',
        contain: 'layout paint style',
        isolation: 'isolate',
        ...style,
      }}
      // NOTE: pointer events are handled by meshes; the canvas itself can be auto
    >
      <Canvas
        dpr={[1, maxDpr]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        style={{ pointerEvents: 'auto' }}
        shadows={false}
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
          onActivate={onActivate}
          overrideAllColor={overrideAllColor}
          overrideGlowOpacity={overrideGlowOpacity}
        />
      </Canvas>
    </div>
  );
}
