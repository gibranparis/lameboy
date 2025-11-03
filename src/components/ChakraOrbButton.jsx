// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const GO_GREEN = '#39ff14';  // neon "go"
const STOP_RED = '#ff001a';
const SEAFOAM  = '#32ffc7';

function overlayOpen() {
  try { return document.documentElement.getAttribute('data-overlay-open') === '1'; }
  catch { return false; }
}

export default function ChakraOrbButton({
  size = 64,
  // slow & soothing; keep this even in resting state
  rpm = 16,
  rpmBreath = 0.16,
  breathHz = 0.16,

  color = SEAFOAM,
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,

  // restore stronger base glow like original (but without the cyan DOM ring)
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,

  className = '',
  style = {},
}) {
  const px = typeof size === 'number' ? `${size}px` : size;

  // grid density tracking to choose spin direction
  const [density, setDensity] = useState(5);
  const [mode, setMode] = useState/** @type {'in'|'out'} */('in'); // IN: 5→1, OUT: 1→5

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

  // IN = CCW, OUT = CW  ← (swap per your request)
  const rpmEffective = useMemo(() => (mode === 'in' ? -Math.abs(rpm) : Math.abs(rpm)), [rpm, mode]);

  // halos-only pulse (cores keep chakra colors)
  const [haloPulse, setHaloPulse] = useState/** @type {string|null} */(null);
  const pulseTimer = useRef/** @type {ReturnType<typeof setTimeout>|null} */(null);
  const pulse = useCallback((hex) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setHaloPulse(hex);
    pulseTimer.current = setTimeout(() => setHaloPulse(null), 280);
  }, []);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  // emit zoom
  const FIRE_COOLDOWN_MS = 140;
  const lastFireRef = useRef(0);
  const emitZoom = useCallback((dir /** 'in'|'out' or null */, step = 1) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;
    const detail = dir ? { step, dir } : { step };
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
  }, []);

  const clickIn  = () => { pulse(GO_GREEN); emitZoom('in');  };
  const clickOut = () => { pulse(STOP_RED);  emitZoom('out'); };

  const onClick = () => {
    // If overlay is open, always act as “back to grid” and pulse RED
    if (overlayOpen()) { pulse(STOP_RED); emitZoom(null); return; }
    // Otherwise respect current mode
    (mode === 'in' ? clickIn : clickOut)();
  };

  const onContextMenu = (e) => { e.preventDefault(); overlayOpen() ? (pulse(STOP_RED), emitZoom(null)) : clickOut(); };
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
        [data-orb="density"] { outline: none; -webkit-tap-highlight-color: transparent; }
        [data-orb="density"]:focus, [data-orb="density"]:focus-visible { outline: none; box-shadow: none; }
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
        title={overlayOpen()
          ? 'Close product • Back to grid'
          : mode === 'in' ? 'Zoom IN (5→1) – CCW' : 'Zoom OUT (1→5) – CW'}
      >
        {/* No DOM fallback ring (keeps the look clean) */}
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
          glowOpacity={glowOpacity}        // restored like original
          includeZAxis={includeZAxis}
          // Resting: no override; Pulse: halos-only (cores remain chakra)
          overrideHaloColor={haloPulse ?? undefined}
          overrideGlowOpacity={haloPulse ? 0.95 : undefined}
          interactive
          respectReducedMotion={false}
          onActivate={onClick}
        />
      </button>
    </>
  );
}
