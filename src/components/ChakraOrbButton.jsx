// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useRef } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,             // visual diameter in px
  rpm = 44,
  color = '#32ffc7',
  geomScale = 1.25,      // bolder fill
  offsetFactor = 2.25,   // push arms outward a touch
  armRatio = 0.35,       // slightly thicker arms
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  className = '',
  style = {},
}) {
  // Debounce so click + onActivate don’t double-fire
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 200;

  const emitZoom = useCallback((step = 1, dir = 'in') => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    try { document.dispatchEvent(new CustomEvent('lb:zoom',      { detail: { step, dir } })); } catch {}
    try { document.dispatchEvent(new CustomEvent('grid-density', { detail: { step, dir } })); } catch {}
  }, []);

  const onClick = () => emitZoom(1, 'in');
  const onContextMenu = (e) => { e.preventDefault(); emitZoom(1, 'out'); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitZoom(1, 'in'); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); emitZoom(1, 'in');  }
    else if (e.key === 'ArrowRight') { e.preventDefault(); emitZoom(1, 'out'); }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? emitZoom(1, 'out') : emitZoom(1, 'in'); }
    else         { deltaY > 0 ? emitZoom(1, 'in')  : emitZoom(1, 'out'); }
  };

  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title="Zoom products (Click/Enter = In, Right-click = Out, Wheel = In/Out)"
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
        overflow: 'hidden',
        clipPath: 'circle(50% at 50% 50%)',
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: '0 none',
        cursor: 'pointer',
        // sit above overlay/images/header content
        position: 'relative',
        zIndex: 600,
        contain: 'layout paint style',
        ...style,
      }}
    >
      {/* visible halo even if WebGL fails, so you always “see” the control */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'radial-gradient(closest-side, rgba(50,255,199,.22), rgba(50,255,199,.06) 60%, transparent 72%)',
          boxShadow: '0 0 18px rgba(50,255,199,.28), inset 0 0 0 1px rgba(255,255,255,.22)',
          pointerEvents: 'none',
          filter: 'saturate(1.08)',
          zIndex: 0,
        }}
      />

      <BlueOrbCross3D
        height={px}                  // component derives width from height
        rpm={rpm}
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={overrideAllColor}
        interactive
        onActivate={() => emitZoom(1, 'in')}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          outline: 0,
          background: 'transparent',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </button>
  );
}
