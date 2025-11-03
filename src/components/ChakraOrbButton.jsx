'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

/**
 * Orb that:
 * - Stays rainbow at rest (no global color override)
 * - Spins slowly; spin direction reflects next action:
 *    * 'out' (shrink toward 1)  => spin negative & red flash
 *    * 'in'  (expand toward 5)  => spin positive & green flash
 * - Shows quick green/red halo on click
 */
export default function ChakraOrbButton({
  size = 64,
  baseRpm = 10,        // slower, hypnotic
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
  const FIRE_COOLDOWN_MS = 160;

  // from grid
  const [density, setDensity] = useState(5);
  const [down, setDown]       = useState(true);   // from ShopGrid broadcast
  // visual pulse on click
  const [flash, setFlash]     = useState/** @type {'green'|'red'|null} */(null);

  // infer the dir the NEXT click will take (to make the loop 5→1→5…)
  const willDir = down ? 'out' : 'in'; // down=true means we’re headed toward 1 next

  // Spin direction: positive for 'in' (expand), negative for 'out' (shrink)
  const spinSign = willDir === 'out' ? -1 : 1;
  const rpm = baseRpm * spinSign;

  useEffect(() => {
    const onD = (e) => {
      const d = e?.detail || {};
      if (typeof d.value === 'number')   setDensity(d.value);
      if (typeof d.density === 'number') setDensity(d.density);
      if (typeof d.down === 'boolean')   setDown(!!d.down);
    };
    document.addEventListener('lb:grid-density', onD);
    document.addEventListener('lb:zoom/grid-density', onD);
    return () => {
      document.removeEventListener('lb:grid-density', onD);
      document.removeEventListener('lb:zoom/grid-density', onD);
    };
  }, []);

  const emitZoom = useCallback((dir /** 'in'|'out' */) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step: 1, dir } })); } catch {}
  }, []);

  const doClick = () => {
    const dir = willDir;                          // decide using broadcast
    setFlash(dir === 'in' ? 'green' : 'red');     // show the right color
    emitZoom(dir);
    setTimeout(() => setFlash(null), 220);
  };

  const onContextMenu = (e) => { e.preventDefault(); setFlash('red'); emitZoom('out'); setTimeout(()=>setFlash(null), 220); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doClick(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); setFlash('green'); emitZoom('in');  setTimeout(()=>setFlash(null), 220); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setFlash('red');   emitZoom('out'); setTimeout(()=>setFlash(null), 220); }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? emitZoom('out') : emitZoom('in'); }
    else         { deltaY > 0 ? emitZoom('in')  : emitZoom('out'); }
  };

  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title={`Zoom products (${willDir === 'in' ? 'expand' : 'shrink'})`}
      data-orb="density"
      onClick={doClick}
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
      {/* subtle resting ring; flash color on click */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background:
            flash === 'green'
              ? 'radial-gradient(closest-side, rgba(34,197,94,.28), rgba(34,197,94,.10) 60%, transparent 72%)'
              : flash === 'red'
              ? 'radial-gradient(closest-side, rgba(255,64,64,.30), rgba(255,64,64,.12) 60%, transparent 72%)'
              : 'radial-gradient(closest-side, rgba(50,255,199,.18), rgba(50,255,199,.06) 60%, transparent 72%)',
          boxShadow:
            flash === 'green'
              ? '0 0 18px rgba(34,197,94,.35), inset 0 0 0 1px rgba(255,255,255,.22)'
              : flash === 'red'
              ? '0 0 18px rgba(255,64,64,.40), inset 0 0 0 1px rgba(255,255,255,.22)'
              : '0 0 18px rgba(50,255,199,.28), inset 0 0 0 1px rgba(255,255,255,.22)',
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background .15s ease, box-shadow .15s ease',
        }}
      />
      <BlueOrbCross3D
        height={px}
        rpm={rpm}                 // sign controls direction
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        overrideAllColor={null}   // keep rainbow cores at rest
        respectReducedMotion={false}
        interactive
        onActivate={doClick}
        // Canvas inside handles pointer; wrapper gives our soft ring
      />
    </button>
  );
}
