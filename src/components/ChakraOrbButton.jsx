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
  // ---- Debounce guard so click + onActivate don't double-fire ----
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
      emitZoom(1, 'in');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      emitZoom(1, 'out');
    }
  };

  // Trackpad/Mouse wheel: vertical/horizontal both supported
  const onWheel = (e) => {
    // Keep the gesture on the control; don't scroll the page
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const THRESH = 16; // ignore micro scroll

    if (absX < THRESH && absY < THRESH) return;

    // Horizontal wins if dominant (left = out, right = in is unintuitive;
    // we'll map: scroll right -> out, left -> in, to mirror Arrow keys)
    if (absX > absY) {
      if (deltaX > 0) emitZoom(1, 'out');
      else emitZoom(1, 'in');
    } else {
      // Vertical: down = in (tighter), up = out (looser)
      if (deltaY > 0) emitZoom(1, 'in');
      else emitZoom(1, 'out');
    }
  };

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
        contain: 'layout paint style',
        ...style,
      }}
    >
      <BlueOrbCross3D
        style={{ display:'block', width:'100%', height:'100%', border:0, outline:0, background:'transparent', pointerEvents:'auto' }}
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
        // If the 3D canvas emits its own "activate", it will still pass through
        // our debounce so we won't double-trigger with the button click.
        onActivate={() => emitZoom(1, 'in')}
      />
    </button>
  );
}
