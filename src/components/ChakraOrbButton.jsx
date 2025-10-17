// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback } from 'react';
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
  const fireZoom = useCallback((step = 1) => {
    try { window.dispatchEvent(new CustomEvent('lb:zoom',      { detail: { step } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); } catch {}
  }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fireZoom(1);
    }
  };

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title="Zoom products"
      data-orb="density"
      onClick={() => fireZoom(1)}
      onKeyDown={handleKey}
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
        interactive={true}
        onActivate={() => fireZoom(1)}
      />
    </button>
  );
}
