// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const SEAFOAM = '#32ffc7';
const RED     = '#ff001a';

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,                 // base magnitude; sign set by current zoom mode
  color = SEAFOAM,
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  overrideAllColor = null,   // not used by default; we pulse our own color
  className = '',
  style = {},
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 200;

  // === Grid density + current zoom "mode" ===
  // mode: 'in'  -> going 5→1 (CCW)
  //       'out' -> going 1→5 (CW)
  const [gridDensity, setGridDensity] = useState(5);
  const [mode, setMode] = useState/** @type {'in'|'out'} */('in');

  // Accept density broadcasts from ShopGrid (both window + document)
  useEffect(() => {
    const onDensity = (e) => {
      const d = e?.detail;
      const v =
        (typeof d === 'number' && d) ??
        (typeof d?.density === 'number' && d.density) ??
        (typeof d?.value === 'number' && d.value) ??
        null;
      if (v == null) return;
      const val = Math.max(1, v | 0);
      setGridDensity(val);

      // Flip mode at the bounds; otherwise keep current mode
      if (val === 1) setMode('out'); // at min, next logical action is zoom OUT
      if (val === 5) setMode('in');  // at max, next logical action is zoom IN
    };

    const names = ['lb:grid-density', 'lb:zoom/grid-density'];
    names.forEach((n) => {
      window.addEventListener(n, onDensity);
      document.addEventListener(n, onDensity);
    });
    return () => {
      names.forEach((n) => {
        window.removeEventListener(n, onDensity);
        document.removeEventListener(n, onDensity);
      });
    };
  }, []);

  // Directional spin: CCW when mode === 'in', CW when 'out'
  // If your visual looks flipped, just swap the signs here.
  const rpmEffective = useMemo(
    () => (mode === 'in' ? -Math.abs(rpm) : Math.abs(rpm)),
    [rpm, mode]
  );

  // === Click pulse color (green for + / red for -) ===
  const [pulseColor, setPulseColor] = useState/** @type {string|null} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout>|null} */(null);
  const triggerPulse = useCallback((hex) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulseColor(hex);
    pulseTimer.current = setTimeout(() => setPulseColor(null), 320);
  }, []);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  // Emit lb:zoom to BOTH window and document (unified)
  const emitZoom = useCallback((step = 1, dir = /** @type {'in'|'out'} */('in')) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;
    const detail = { step, dir };
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { window.dispatchEvent(   new CustomEvent('lb:zoom', { detail })); } catch {}
  }, []);

  // Primary click executes current "mode"
  const onPrimary = useCallback(() => {
    if (mode === 'in') { triggerPulse(SEAFOAM); emitZoom(1, 'in'); }
    else               { triggerPulse(RED);     emitZoom(1, 'out'); }
  }, [mode, emitZoom, triggerPulse]);

  const onClick = onPrimary;
  const onContextMenu = (e) => { e.preventDefault(); // secondary = opposite mode
    if (mode === 'in') { triggerPulse(RED);     emitZoom(1, 'out'); }
    else               { triggerPulse(SEAFOAM); emitZoom(1, 'in');  }
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPrimary(); }
    else if (e.key === 'ArrowLeft')  { triggerPulse(SEAFOAM); emitZoom(1, 'in'); }
    else if (e.key === 'ArrowRight') { triggerPulse(RED);     emitZoom(1, 'out'); }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
    if (ax > ay) { e.deltaX > 0 ? (triggerPulse(RED),     emitZoom(1,'out'))
                                : (triggerPulse(SEAFOAM), emitZoom(1,'in')); }
    else         { e.deltaY > 0 ? (triggerPulse(SEAFOAM), emitZoom(1,'in'))
                                : (triggerPulse(RED),     emitZoom(1,'out')); }
  };

  const px = typeof size === 'number' ? `${size}px` : size;
  const title =
    mode === 'in'
      ? 'Zoom products (Mode: IN — 5→1). Click/Enter = +, Right-click = −'
      : 'Zoom products (Mode: OUT — 1→5). Click/Enter = −, Right-click = +';

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title={title}
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
        ...style,
      }}
    >
      {/* soft halo so it's not visually empty if WebGL fails */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'radial-gradient(closest-side, rgba(50,255,199,.22), rgba(50,255,199,.06) 60%, transparent 72%)',
          boxShadow: '0 0 18px rgba(50,255,199,.28), inset 0 0 0 1px rgba(255,255,255,.22)',
          pointerEvents: 'none',
          filter: 'saturate(1.1)',
          zIndex: 1,
        }}
      />
      <BlueOrbCross3D
        height={px}
        rpm={rpmEffective}                 // CCW for 'in', CW for 'out'
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        // click pulse: temporarily override orb color (green for +, red for −)
        overrideAllColor={pulseColor ?? undefined}
        overrideGlowOpacity={pulseColor ? 1.0 : undefined}
        interactive
        respectReducedMotion={false}
        onActivate={onPrimary}
      />
    </button>
  );
}
