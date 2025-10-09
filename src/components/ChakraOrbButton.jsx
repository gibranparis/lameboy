// src/components/ChakraOrbButton.jsx
'use client';

import React from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 44,              // TRUE DOM box; nothing larger than this can affect layout
  rpm = 44,
  color = '#32ffc7',
  geomScale = 0.60,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,
  onActivate,
  className = '',
  style = {},
}) {
  const s = Math.max(24, Math.round(size));
  return (
    <div
      data-orb="density"
      className={className}
      style={{
        contain: 'layout size paint',
        width: s,
        height: s,
        display: 'inline-block',
        padding: 0,
        margin: 0,
        lineHeight: 0,
        background: 'transparent',
        border: 0,
        pointerEvents: 'none',   // wrapper never inflates hit area
        ...style,
      }}
    >
      <BlueOrbCross3D
        height={`${s}px`}
        rpm={rpm}
        color={color}
        geomScale={geomScale}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={overrideAllColor}
        onActivate={onActivate}
        style={{ pointerEvents: 'auto', display: 'block' }}
      />
    </div>
  );
}
