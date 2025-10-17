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
    if (includeZAxis) centers.push([0,0, offset],[0,0,-offset]);

    const CHAKRA = {
      root:'#ef4444', sacral:'#f97316', solar:'#facc15',
      heart:'#22c55e', throat:'#3b82f6', thirdEye:'#4f46e5',
      crownV:'#c084fc', crownW:'#f6f3ff',
    };

    return { sphereGeo, armGeoX, armGeoY, armGeoZ, armGlowGeoX, armGlowGeoY, armGlowGeoZ, centers, CHAKRA };
  }, [geomScale, armRatio, offsetFactor, glowScale, includeZAxis]);

  const { sphereGeo, armGeoX, armGeoY, armGeoZ, armGlowGeoX, armGlowGeoY, armGlowGeoZ, centers, CHAKRA } = memo;

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
    color: barColor, transparent:true, opacity: glow ? haloBase * 0.5 : 0,
    blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
  }), [barColor, glow, haloBase]);

  const sphereDefs = useOverride
    ? new Array(centers.length).fill({ core: barColor, halo: barColor, haloOp: haloBase })
    : [
        { core: CHAKRA.crownW,  halo: CHAKRA.crownV, haloOp: 0.9 * (coarse ? 0.55 : 1.0) },
        { core: CHAKRA.root,    halo: CHAKRA.root,   haloOp: haloBase },
        { core: CHAKRA.sacral,  halo: CHAKRA.sacral, haloOp: haloBase },
        { core: CHAKRA.solar,   halo: CHAKRA.solar,  haloOp: haloBase },
        { core: CHAKRA.heart,   halo: CHAKRA.heart,  haloOp: haloBase },
        { core: CHAKRA.throat,  halo: CHAKRA.throat, haloOp: haloBase },
        { core: CHAKRA.thirdEye,halo: CHAKRA.thirdEye, haloOp: haloBase },
      ];

  const sphereCoreMats = useMemo(
    () => sphereDefs.map(({ core }) => new THREE.MeshStandardMaterial({
      color: core, roughness:0.28, metalness:0.25,
      emissive:new THREE.Color(core), emissiveIntensity: coreEmissive, toneMapped:true,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs), coreEmissive]
  );

  const sphereHaloMats = useMemo(
    () => sphereDefs.map(({ halo, haloOp }) => new THREE.MeshBasicMaterial({
      color: halo, transparent:true, opacity: glow ? haloOp : 0,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useOverride ? barColor : JSON.stringify(sphereDefs), glow]
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

  // mesh handlers (no stopPropagation; let everything bubble)
  const handlePointerDown = () => { onActivate && onActivate(); };
  const handleKeyDown = (e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); onActivate && onActivate(); } };

  return (
    <group ref={group} onPointerDown={handlePointerDown} onKeyDown={handleKeyDown} tabIndex={0}>
      <mesh geometry={armGeoX} material={barCoreMat} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={armGeoY} material={barCoreMat} />
      <mesh geometry={armGeoZ} material={barCoreMat} rotation={[Math.PI / 2, 0, 0]} />

      {centers.map((p, i) => <mesh key={`core-${i}`} geometry={sphereGeo} material={sphereCoreMats[i]} position={p} />)}

      {glow && (
        <>
          <mesh geometry={armGlowGeoX} material={barHaloMat} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={armGlowGeoY} material={barHaloMat} />
          <mesh geometry={armGlowGeoZ} material={barHaloMat} rotation={[Math.PI / 2, 0, 0]} />
          {centers.map((p, i) => <mesh key={`halo-${i}`} geometry={sphereGeo} material={sphereHaloMats[i]} position={p} scale={glowScale} />)}
          {overrideAllColor && (
            <>
              {centers.map((p, i) => <mesh key={`h2-${i}`} geometry={sphereGeo} material={halo2Mat} position={p} scale={glowScale * 1.6} />)}
              {centers.map((p, i) => <mesh key={`h3-${i}`} geometry={sphereGeo} material={halo3Mat} position={p} scale={glowScale * 1.95} />)}
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
  interactive = true,
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

  // fallback: if no onActivate provided, dispatch zoom events here
  const fire = () => {
    if (onActivate) { onActivate(); return; }
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step: 1 } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step: 1 } })); } catch {}
  };

  const handleCanvasPointerDown = () => { if (interactive) fire(); };
  const handleCanvasKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
  };

  return (
    <div
      className={className}
      style={{
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
        style={{ pointerEvents: interactive ? 'auto' : 'none', outline: 'none' }}
        onPointerDown={handleCanvasPointerDown}
        tabIndex={interactive ? 0 : -1}
        onKeyDown={handleCanvasKeyDown}
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
          onActivate={interactive ? fire : null}
          overrideAllColor={overrideAllColor}
          overrideGlowOpacity={overrideGlowOpacity}
        />
      </Canvas>
    </div>
  );
}
