// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 24,                 // hypnotic base rate
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

  // pulse: none | in | out  (also drives haloTint)
  const [pulse, setPulse] = useState('none');
  const [haloTint, setHaloTint] = useState(null);
  const pulseTimer = useRef(null);

  // nextDir inferred from current grid density (1 => next is OUT, 5 => next is IN)
  const [nextDir, setNextDir] = useState('in');

  // overlay open? reverse spin to signify “back to grid”
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    const read = () => setOverlayOpen(document.documentElement.getAttribute('data-overlay-open') === '1');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay-open'] });
    return () => mo.disconnect();
  }, []);

  // density listener
  useEffect(() => {
    const onDensity = (e) => {
      const d = Number(e?.detail?.density ?? e?.detail?.value);
      if (!Number.isFinite(d)) return;
      if (d <= 1) setNextDir('out');
      else if (d >= 5) setNextDir('in');
    };
    window.addEventListener('lb:grid-density', onDensity);
    document.addEventListener('lb:grid-density', onDensity);
    return () => {
      window.removeEventListener('lb:grid-density', onDensity);
      document.removeEventListener('lb:grid-density', onDensity);
    };
  }, []);

  // pulse helpers (visual + haloTint)
  const GREEN = '#00ff78';
  const RED   = '#ff2e2e';
  const triggerPulse = useCallback((kind) => {
    setPulse(kind);
    setHaloTint(kind === 'in' ? GREEN : kind === 'out' ? RED : null);
    clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => { setPulse('none'); setHaloTint(null); }, 320);
  }, []);

  // dispatch zoom
  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    triggerPulse(dir === 'in' ? 'in' : 'out');
    const detail = { step: 1, dir };
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('grid-density', { detail: { step: 1, dir } })); } catch {}
  }, [triggerPulse]);

  // interactions
  const onClick       = () => fireZoom(nextDir);
  const onContextMenu = (e) => { e.preventDefault(); fireZoom('out'); };
  const onKeyDown     = (e) => {
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

  // also react to external zoom events (for consistent pulse)
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

  // reverse spin if overlay is open OR if next action is OUT (grid at 1)
  const rpmValue = ((overlayOpen || nextDir === 'out') ? -1 : 1) * rpm;

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

      {/* top-layer aura for obvious click feedback */}
      {pulse !== 'none' && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '9999px',
            boxShadow:
              pulse === 'in'
                ? `0 0 28px 10px rgba(0,255,120,.85), 0 0 80px 36px rgba(0,255,120,.35)`
                : `0 0 28px 10px rgba(255,46,46,.85), 0 0 80px 36px rgba(255,46,46,.35)`,
            transition: 'opacity .32s ease',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      )}

      {/* 3D orb — chakra cores stay colorful; halos tint to pulse color */}
      <BlueOrbCross3D
        height={px}
        rpm={rpmValue}
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        respectReducedMotion={false}
        onActivate={onClick}
        haloTint={haloTint}   // <— drives green/red halo glow
      />
    </button>
  );
}
