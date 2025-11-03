// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const GREEN = '#32ffc7';
const RED   = '#ff001a';

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,                 // magnitude; sign chosen by mode below
  color = GREEN,
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

  // Grid state & mode (IN = 5→1, OUT = 1→5)
  const [density, setDensity] = useState(5);
  const [mode, setMode] = useState/** @type {'in'|'out'} */('in');

  // Listen ONLY on document for density broadcasts
  useEffect(() => {
    const onDensity = (e) => {
      const d = e?.detail;
      const v = (typeof d === 'number' ? d :
                typeof d?.density === 'number' ? d.density :
                typeof d?.value === 'number' ? d.value : null);
      if (v == null) return;
      const val = Math.max(1, v|0);
      setDensity(val);
      if (val === 5) setMode('in');     // at max we’re in zoom-in mode (next click goes 5→4)
      if (val === 1) setMode('out');    // at min we’re in zoom-out mode (next click goes 1→2)
    };
    document.addEventListener('lb:grid-density', onDensity);
    return () => document.removeEventListener('lb:grid-density', onDensity);
  }, []);

  // Spin direction: CCW for IN, CW for OUT
  const rpmEffective = useMemo(() => (mode === 'in' ? -Math.abs(rpm) : Math.abs(rpm)), [rpm, mode]);

  // Green/Red pulse on click
  const [pulseColor, setPulseColor] = useState/** @type {string|null} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout>|null} */(null);
  const pulse = useCallback((hex) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulseColor(hex);
    pulseTimer.current = setTimeout(() => setPulseColor(null), 260);
  }, []);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  // Emit to document ONLY (simple and reliable)
  const FIRE_COOLDOWN_MS = 160;
  const lastFireRef = useRef(0);
  const emitZoom = useCallback((dir /** 'in'|'out' */, step = 1) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step, dir } })); } catch {}
  }, []);

  // Primary click follows current mode; context-click does the opposite
  const clickIn  = () => { pulse(GREEN); emitZoom('in');  };
  const clickOut = () => { pulse(RED);   emitZoom('out'); };

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
      ? 'Zoom (IN: 5→1)  Click=In  Right-click=Out'
      : 'Zoom (OUT: 1→5) Click=Out Right-click=In';

  return (
    <button
      type="button"
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
        ...style,
      }}
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
        rpm={rpmEffective}                    // CCW for IN, CW for OUT
        color={color}
        geomScale={1.25}
        offsetFactor={2.25}
        armRatio={0.35}
        glow
        glowOpacity={glowOpacity}
        includeZAxis
        overrideAllColor={pulseColor ?? undefined} // green/red click pulse
        overrideGlowOpacity={pulseColor ? 1.0 : undefined}
        interactive
        respectReducedMotion={false}
        onActivate={onClick}
      />
    </button>
  );
}
