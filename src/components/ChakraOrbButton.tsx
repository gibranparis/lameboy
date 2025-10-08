// src/components/ChakraOrbButton.jsx
'use client';

import React from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 28,                 // <- DOM box is a tight square
  rpm = 44,
  color = '#32ffc7',
  geomScale = 0.60,          // <- visible diameter inside that box
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  onActivate,                // <- parent action (will ONLY fire from meshes)
  className = '',
  style = {},
}) {
  return (
    <div
      data-orb="density"
      className={className}
      style={{
        width: size,
        height: size,
        lineHeight: 0,
        display: 'inline-block',
        // No padding/margins – tight hit area
        padding: 0,
        margin: 0,
        // No background/border so it can't “extend” the clickable feel
        background: 'transparent',
        border: '0 none',
        // Ensure nothing in the wrapper catches clicks accidentally
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Only the canvas handles pointer events; meshes do the clicking */}
      <BlueOrbCross3D
        height={`${size}px`}
        rpm={rpm}
        color={color}
        geomScale={geomScale}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={overrideAllColor}
        // This is the ONLY way to trigger the action:
        onActivate={onActivate}
        // Make sure the canvas itself can receive events
        style={{ pointerEvents: 'auto', display: 'block' }}
      />
    </div>
  );
}
