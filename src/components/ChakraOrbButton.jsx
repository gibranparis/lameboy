// src/components/ChakraOrbButton.jsx
'use client';

import React from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 44,            // visual & DOM diameter in px (true circle)
  rpm = 44,
  color = '#32ffc7',
  geomScale = 0.60,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  onActivate,           // fired by meshes inside the canvas
  className = '',
  style = {},
}) {
  return (
    <div
      data-orb="density"
      aria-hidden="true"
      className={className}
      style={{
        // Tight, circular, clipped box — DOM = what you see
        width: size,
        height: size,
        lineHeight: 0,
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: '9999px',
        overflow: 'hidden',
        // Also clip pointer hit-testing to a circle
        clipPath: 'circle(50% at 50% 50%)',
        // No layout inflation
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: '0 none',
        // Wrapper ignores events; only the canvas handles them
        pointerEvents: 'none',
        // Avoid accidental effects
        contain: 'layout paint style',
        ...style,
      }}
    >
      {/* Only the canvas is interactive (meshes call onActivate) */}
      <BlueOrbCross3D
        // ensure CSS/DOM sizing is exact and matches device pixels
        style={{ pointerEvents: 'auto', display: 'block', width: '100%', height: '100%', border: 0, outline: 0 }}
        // keep your existing props
        height={`${size}px`}          // if BlueOrbCross3D reads this
        rpm={rpm}
        color={color}
        geomScale={geomScale}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={overrideAllColor}
        onActivate={onActivate}
      />
    </div>
  );
}
