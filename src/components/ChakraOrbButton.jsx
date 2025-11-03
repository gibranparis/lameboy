// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const GO_GREEN = '#00ff5a';  // neon go
const STOP_RED = '#ff001a';
const SEAFOAM  = '#32ffc7';

export default function ChakraOrbButton({
  size = 64,
  rpm = 16,                 // slower base RPM
  rpmBreath = 0.16,         // gentle wind modulation
  breathHz = 0.16,
  color = SEAFOAM,
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.95,
  includeZAxis = true,
  className = '',
  style = {},
}) {
  const px = typeof size === 'number' ? `${size}px` : size;

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

  // IN = CW (positive), OUT = CCW (negative)
  const rpmEffective = useMemo(() => (mode === 'in' ?  Math.abs(rpm) : -Math.abs(rpm)), [rpm, mode]);

  // halo-only pulse color
  const [pulseHalo, setPulseHalo] = useState/** @type {string|null} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout>|null} */(null);
  const pulse = useCallback((hex) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulseHalo(hex);
    pulseTimer.current = setTimeout(() => setPulseHalo(null), 280);
  }, []);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

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

  return (
    <>
      <style jsx>{`
        [data-orb="density"] { outline: none; }
        [data-orb="density"]:focus,
        [data-orb="density"]:focus-visible { outline: none; box-shadow: none; }
        [data-orb="density"] { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <button
        type="button"
        data-orb="density"
        aria-label="Zoom products"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        className={className}
        style={{
          width: px, height: px, display:'inline-grid', placeItems:'center',
          lineHeight:0, borderRadius:'9999px', background:'transparent', border:0,
          cursor:'pointer', position:'relative', zIndex:900, contain:'layout paint style',
          outline:'none', boxShadow:'none',
          ...style,
        }}
        title={mode === 'in' ? 'Zoom (IN: 5→1) – CW' : 'Zoom (OUT: 1→5) – CCW'}
      >
        {/* soft halo fallback */}
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
          rpm={rpmEffective}
          rpmBreath={rpmBreath}
          breathHz={breathHz}
          color={color}
          geomScale={geomScale}
          offsetFactor={offsetFactor}
          armRatio={armRatio}
          glow={glow}
          glowOpacity={glowOpacity}
          includeZAxis={includeZAxis}
          // ⟵ only halos change on pulse; cores stay chakra-colored
          overrideHaloColor={pulseHalo ?? undefined}
          overrideGlowOpacity={pulseHalo ? 1.0 : undefined}
          interactive
          respectReducedMotion={false}
          onActivate={onClick}
        />
      </button>
    </>
  );
}
