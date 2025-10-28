// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useRef } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 56,             // DOM & visual diameter in px
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

    try { window.dispatchEvent(new CustomEvent('lb:zoom',      { detail: { step, dir } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step, dir } })); } catch {}
  }, []);

  const onClick = () => emitZoom(1, 'in');

  const onContextMenu = (e) => {
    e.preventDefault();
    emitZoom(1, 'out');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emitZoom(1, 'in');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      emitZoom(1, 'in');  // tighter grid
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      emitZoom(1, 'out'); // looser grid
    }
  };

  // Trackpad/Mouse wheel (React's wheel is non-passive → preventDefault works)
  const onWheel = (e) => {
    // Keep the gesture on the control; don't scroll the page behind
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const THRESH = 16; // ignore micro scroll noise

    if (absX < THRESH && absY < THRESH) return;

    // Horizontal dominant → left=in, right=out (mirrors Arrow keys)
    if (absX > absY) {
      if (deltaX > 0) emitZoom(1, 'out');
      else emitZoom(1, 'in');
    } else {
      // Vertical → down=in (denser), up=out (sparser)
      if (deltaY > 0) emitZoom(1, 'in');
      else emitZoom(1, 'out');
    }
  };

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title="Zoom products (Click/Enter = In, Right-click = Out, Wheel/Trackpad = In/Out)"
      data-orb="density"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      className={className}
      style={{
        width: size,
        height: size,
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
        // contain to keep GPU happy and avoid layout thrash
        contain: 'layout paint style',
        ...style,
      }}
    >
      <BlueOrbCross3D
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          outline: 0,
          background: 'transparent',
          // NOTE: site CSS sets `[data-orb="density"] canvas { pointer-events:none }`
          // so the wrapper button handles interaction. Keep this 'auto' harmless.
          pointerEvents: 'auto',
        }}
        width={`${size}px`}
        height={`${size}px`}
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
        // Canvas “activate” will pass through debounce to avoid double triggers
        onActivate={() => emitZoom(1, 'in')}
      />
    </button>
  );
}
