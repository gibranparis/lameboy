// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 24,                 // slower, more hypnotic
  color = '#32ffc7',
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  className = '',
  style = {},
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 180;

  // pulse: 'none' | 'in' | 'out'
  const [pulse, setPulse] = useState('none');
  const pulseTimer = useRef(null);

  // show quick green/red aura without touching inner chakra colors
  const triggerPulse = useCallback((kind /* 'in'|'out' */) => {
    setPulse(kind);
    clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse('none'), 260);
  }, []);

  const emitZoom = useCallback((step = 1, dir = 'in') => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    // your requested mapping (SWAPPED): IN → GREEN, OUT → RED
    triggerPulse(dir === 'in' ? 'in' : 'out');

    const detail = { step, dir };
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); } catch {}
  }, [triggerPulse]);

  // keyboard / wheel
  const onClick = () => emitZoom(1, 'in');
  const onContextMenu = (e) => { e.preventDefault(); emitZoom(1, 'out'); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitZoom(1, 'in'); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); emitZoom(1, 'in'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); emitZoom(1, 'out'); }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? emitZoom(1, 'out') : emitZoom(1, 'in'); }
    else         { deltaY > 0 ? emitZoom(1, 'in')  : emitZoom(1, 'out'); }
  };

  // also react (visually) when something else zooms the grid
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {};
      if (d.dir === 'in' || d.dir === 'out') triggerPulse(d.dir);
    };
    window.addEventListener('lb:zoom', onExternal);
    document.addEventListener('lb:zoom', onExternal);
    return () => {
      window.removeEventListener('lb:zoom', onExternal);
      document.removeEventListener('lb:zoom', onExternal);
    };
  }, [triggerPulse]);

  const px = typeof size === 'number' ? `${size}px` : size;

  // Aura colors (do NOT change inner orb colors)
  const GREEN = 'rgba(0, 255, 120, .65)';
  const RED   = 'rgba(255, 40, 40, .72)';

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
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {/* soft base ring (always on) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'radial-gradient(closest-side, rgba(50,255,199,.18), rgba(50,255,199,.06) 62%, transparent 74%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* transient outer aura for IN (green) / OUT (red) */}
      {pulse !== 'none' && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '9999px',
            boxShadow:
              pulse === 'in'
                ? `0 0 28px 10px ${GREEN}, 0 0 60px 24px ${GREEN}`
                : `0 0 28px 10px ${RED}, 0 0 60px 24px ${RED}`,
            filter: 'saturate(1.1)',
            transition: 'opacity .26s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* The orb itself — chakra colors untouched */}
      <BlueOrbCross3D
        height={px}
        rpm={rpm}                 // slow, soothing
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        // NO overrideAllColor — keep chakra colors intact
        respectReducedMotion={false}
        onActivate={() => onClick()}
      />
    </button>
  );
}
