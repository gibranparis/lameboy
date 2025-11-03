// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,                 // base magnitude; direction auto-flips at min density
  color = '#32ffc7',
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  className = '',
  style = {},
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 200;

  // Track current grid density (default 5). App should broadcast updates.
  const [gridDensity, setGridDensity] = useState(5);

  // Accept density updates from several event names/shapes for compatibility.
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail;
      const val =
        (typeof d === 'number' && d) ??
        (typeof d?.density === 'number' && d.density) ??
        (typeof d?.value === 'number' && d.value) ??
        null;
      if (val != null) setGridDensity(Math.max(1, val | 0));
    };
    window.addEventListener('lb:grid-density', handler);
    window.addEventListener('lb:zoom/grid-density', handler);
    window.addEventListener('lb:gridDensity', handler);
    return () => {
      window.removeEventListener('lb:grid-density', handler);
      window.removeEventListener('lb:zoom/grid-density', handler);
      window.removeEventListener('lb:gridDensity', handler);
    };
  }, []);

  const isMinDensity = gridDensity <= 1;

  // Effective RPM: reverse when at min density
  const rpmEffective = useMemo(() => {
    const m = Math.abs(rpm);
    return isMinDensity ? -m : m;
  }, [rpm, isMinDensity]);

  const emitZoom = useCallback((step = 1, dir = 'in') => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step, dir } })); } catch {}
  }, []);

  // Primary click: zoom IN normally; at min density, flip to zoom OUT.
  const onClick = () => emitZoom(1, isMinDensity ? 'out' : 'in');

  // Context menu: opposite
  const onContextMenu = (e) => { e.preventDefault(); emitZoom(1, isMinDensity ? 'in' : 'out'); };

  // Keyboard
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emitZoom(1, isMinDensity ? 'out' : 'in');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); emitZoom(1, 'in');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); emitZoom(1, 'out');
    }
  };

  // Wheel mapping
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? emitZoom(1, 'out') : emitZoom(1, 'in'); }
    else         { deltaY > 0 ? emitZoom(1, 'in')  : emitZoom(1, 'out'); }
  };

  const px = typeof size === 'number' ? `${size}px` : size;
  const title = isMinDensity
    ? 'Zoom products (Click/Enter = Out, Right-click = In, Wheel = In/Out)'
    : 'Zoom products (Click/Enter = In, Right-click = Out, Wheel = In/Out)';

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title={title}
      data-orb="density"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      className={className}
      style={{
        width: px,
        height: px,
        display: 'inline-grid',
        placeItems: 'center',
        lineHeight: 0,
        borderRadius: '9999px',
        overflow: 'visible',
        clipPath: 'circle(50% at 50% 50%)',
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: '0 none',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 900,
        contain: 'layout paint style',
        ...style,
      }}
    >
      {/* visible even if WebGL fails */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'radial-gradient(closest-side, rgba(50,255,199,.22), rgba(50,255,199,.06) 60%, transparent 72%)',
          boxShadow: '0 0 18px rgba(50,255,199,.28), inset 0 0 0 1px rgba(255,255,255,.22)',
          pointerEvents: 'none',
          filter: 'saturate(1.1)',
          zIndex: 1,
        }}
      />
      <BlueOrbCross3D
        height={px}
        rpm={rpmEffective}            // ← reverse at min density
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={overrideAllColor}
        interactive
        respectReducedMotion={false}
        onActivate={() => onClick()}
        // wrapper div in BlueOrbCross3D is relative; Canvas is absolute inset:0 with z-index:2
      />
    </button>
  );
}
