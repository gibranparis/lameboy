// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 24,                 // slow, soothing
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

  // visual pulse: 'none' | 'in' | 'out'
  const [pulse, setPulse] = useState('none');
  const pulseTimer = useRef(null);

  // decide direction based on current grid density: 5 => next is IN, 1 => next is OUT
  const [nextDir, setNextDir] = useState('in'); // default when grid starts at 5

  // keep in sync with grid
  useEffect(() => {
    const onDensity = (e) => {
      const d = Number(e?.detail?.density ?? e?.detail?.value);
      if (!Number.isFinite(d)) return;
      if (d <= 1) setNextDir('out');
      else if (d >= 5) setNextDir('in');
      // between 1..5 keep whatever we were heading toward
    };
    window.addEventListener('lb:grid-density', onDensity);
    document.addEventListener('lb:grid-density', onDensity);
    return () => {
      window.removeEventListener('lb:grid-density', onDensity);
      document.removeEventListener('lb:grid-density', onDensity);
    };
  }, []);

  const triggerPulse = useCallback((kind) => {
    setPulse(kind);
    clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse('none'), 260);
  }, []);

  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    triggerPulse(dir === 'in' ? 'in' : 'out');
    const detail = { step: 1, dir };
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('grid-density', { detail: { step: 1 } })); } catch {}
  }, [triggerPulse]);

  // interactions
  const onClick       = () => fireZoom(nextDir);        // left click: follow nextDir
  const onContextMenu = (e) => { e.preventDefault(); fireZoom('out'); }; // right click = OUT
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fireZoom(nextDir); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); fireZoom('in');  }
    else if (e.key === 'ArrowRight') { e.preventDefault(); fireZoom('out'); }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? fireZoom('out') : fireZoom('in'); }
    else         { deltaY > 0 ? fireZoom('in')  : fireZoom('out'); }
  };

  // reflect external zoom pulses (if any) with color only
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

  // Outer aura colors (do NOT change the inner chakra colors)
  const GREEN = 'rgba(0, 255, 120, .65)';
  const RED   = 'rgba(255, 40, 40, .72)';

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title="Zoom products (Click = Smart IN/OUT • Right-click = OUT)"
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
      {/* subtle base ring */}
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

      {/* click aura */}
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
            transition: 'opacity .26s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Chakra orb — inner colors untouched */}
      <BlueOrbCross3D
        height={px}
        rpm={rpm}
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        respectReducedMotion={false}
        onActivate={onClick}
      />
    </button>
  );
}
