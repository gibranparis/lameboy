// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const GO_GREEN = '#00ff5a';  // neon "go" green
const STOP_RED = '#ff001a';
const SEAFOAM  = '#32ffc7';  // normal orb color between pulses

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,                // magnitude; sign chosen by mode below
  color = SEAFOAM,         // steady color (pulse overrides briefly)
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  className = '',
  style = {},
}) {
  const px = typeof size === 'number' ? `${size}px` : size;

  // --- density + mode (IN = 5→1, OUT = 1→5)
  const [density, setDensity] = useState(5);
  const [mode, setMode] = useState/** @type {'in'|'out'} */('in');

  useEffect(() => {
    const onDensity = (e) => {
      const d = e?.detail;
      const v = (typeof d === 'number' ? d :
                typeof d?.density === 'number' ? d.density :
                typeof d?.value === 'number' ? d.value : null);
      if (v == null) return;
      const val = Math.max(1, v|0);
      setDensity(val);
      if (val === 5) setMode('in');
      if (val === 1) setMode('out');
    };
    document.addEventListener('lb:grid-density', onDensity);
    return () => document.removeEventListener('lb:grid-density', onDensity);
  }, []);

  // --- spin direction (FLIPPED per your request)
  // Previously: IN = CCW (negative). Now invert:
  // IN  => CW  => +|rpm|
  // OUT => CCW => -|rpm|
  const rpmEffective = useMemo(
    () => (mode === 'in' ?  Math.abs(rpm) : -Math.abs(rpm)),
    [rpm, mode]
  );

  // --- neon pulse on click (GO green for IN, STOP red for OUT)
  const [pulseColor, setPulseColor] = useState/** @type {string|null} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout>|null} */(null);
  const pulse = useCallback((hex) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulseColor(hex);
    pulseTimer.current = setTimeout(() => setPulseColor(null), 260);
  }, []);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  // --- emit zoom (document-only)
  const FIRE_COOLDOWN_MS = 160;
  const lastFireRef = useRef(0);
  const emitZoom = useCallback((dir /** 'in'|'out' */, step = 1) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step, dir } })); } catch {}
  }, []);

  const clickIn  = () => { pulse(GO_GREEN); emitZoom('in');  };
  const clickOut = () => { pulse(STOP_RED);  emitZoom('out'); };

  const onClick = () => (mode === 'in' ? clickIn() : clickOut());
  const onContextMenu = (e) => { e.preventDefault(); (mode === 'in' ? clickOut() : clickIn()); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    else if (e.key === 'ArrowLeft')  { clickIn(); }
    else if (e.key === 'ArrowRight') { clickOut(); }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
    if (ax > ay) { e.deltaX > 0 ? clickOut() : clickIn(); }
    else         { e.deltaY > 0 ? clickIn()  : clickOut(); }
  };

  const title =
    mode === 'in'
      ? 'Zoom (IN: 5→1). Click=In, Right-click=Out'
      : 'Zoom (OUT: 1→5). Click=Out, Right-click=In';

  return (
    <>
      <style jsx>{`
        /* kill the default blue focus ring and any external ring classes */
        [data-orb="density"] { outline: none; }
        [data-orb="density"]:focus { outline: none; }
        [data-orb="density"]:focus-visible { outline: none; box-shadow: none; }
        [data-orb="density"] { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <button
        type="button"
        data-orb="density"
        aria-label="Zoom products"
        title={title}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        className={className}
        style={{
          width: px, height: px, display:'inline-grid', placeItems:'center',
          lineHeight:0, borderRadius:'9999px', background:'transparent', border:0,
          cursor:'pointer', position:'relative', zIndex:900, contain:'layout paint style',
          outline:'none', boxShadow:'none',  // <-- extra safety against blue ring
          ...style,
        }}
      >
        {/* soft halo fallback (not blue) */}
        <span
          aria-hidden
          style={{
            position:'absolute', inset:0, borderRadius:'9999px',
            background:'radial-gradient(closest-side, rgba(50,255,199,.22), rgba(50,255,199,.06) 60%, transparent 72%)',
            boxShadow:'0 0 18px rgba(50,255,199,.28), inset 0 0 0 1px rgba(255,255,255,.22)',
            pointerEvents:'none', filter:'saturate(1.1)', zIndex:1,
          }}
        />
        <BlueOrbCross3D
          height={px}
          rpm={rpmEffective}                 // IN=CW, OUT=CCW (flipped)
          color={color}                      // steady seafoam
          geomScale={geomScale}
          offsetFactor={offsetFactor}
          armRatio={armRatio}
          glow={glow}
          glowOpacity={glowOpacity}
          includeZAxis={includeZAxis}
          // neon pulse overrides on click: GO green (+) / STOP red (−)
          overrideAllColor={pulseColor ?? undefined}
          overrideGlowOpacity={pulseColor ? 1.0 : undefined}
          interactive
          respectReducedMotion={false}
          onActivate={onClick}
        />
      </button>
    </>
  );
}
