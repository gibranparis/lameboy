// src/components/ChakraOrbButton.jsx
'use client';

import React from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 48,                 // DOM box is a tight square (px)
  rpm = 44,
  color = '#32ffc7',
  geomScale = 0.60,          // visible diameter inside the box
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  onActivate,                // will ONLY fire from meshes inside the canvas
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
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: 0,
        pointerEvents: 'none', // wrapper never eats clicks
        ...style,
      }}
    >
      <BlueOrbCross3D
        // Make the canvas true-square and the only click target
        style={{ pointerEvents: 'auto', display: 'block', width: `${size}px`, height: `${size}px` }}
        height={`${size}px`}
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
