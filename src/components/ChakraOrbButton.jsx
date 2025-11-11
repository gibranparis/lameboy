// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,
  color = '#32ffc7',
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  className = '',
  style = {},
  tightHitbox = true,
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 160;

  // pulse: 'none' | 'in' | 'out'
  const [pulse, setPulse] = useState('none');
  const [haloTint, setHaloTint] = useState(null);
  const [pulseOn, setPulseOn] = useState(false);
  const pulseTimer = useRef(null);

  const [nextDir, setNextDir] = useState('in');
  const [overlayOpen, setOverlayOpen] = useState(false);

  // overlay flag (reverse spin when overlay or next=OUT)
  useEffect(() => {
    const read = () =>
      setOverlayOpen(
        document.documentElement.getAttribute('data-overlay-open') === '1'
      );
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-overlay-open'],
    });
    return () => mo.disconnect();
  }, []);

  // predict next direction from density
  useEffect(() => {
    const onDensity = (e) => {
      const d = Number(e?.detail?.density ?? e?.detail?.value);
      if (!Number.isFinite(d)) return;
      if (d <= 1) setNextDir('out');
      else if (d >= 5) setNextDir('in');
    };
    document.addEventListener('lb:grid-density', onDensity);
    return () => document.removeEventListener('lb:grid-density', onDensity);
  }, []);

  const GREEN = '#00ff2a';
  const RED   = '#ff1a1a';

  // Strong “banned-level” flash: big aura + heavy drop-shadows, brief
  const triggerPulse = useCallback((kind) => {
    clearTimeout(pulseTimer.current);
    setPulse(kind);
    setPulseOn(true);
    setHaloTint(kind === 'in' ? GREEN : kind === 'out' ? RED : null);
    pulseTimer.current = setTimeout(() => {
      setPulse('none');
      setHaloTint(null);
      setPulseOn(false);
    }, 380); // slightly longer to really read
  }, []);

  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    triggerPulse(dir === 'in' ? 'in' : 'out');

    const detail = { step: 1, dir };
    document.dispatchEvent(new CustomEvent('lb:zoom', { detail }));
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
    document.dispatchEvent(new CustomEvent('grid-density', { detail })); // legacy
  }, [triggerPulse]);

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

  // reflect external pulses too
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {};
      if (d.dir === 'in' || d.dir === 'out') triggerPulse(d.dir);
    };
    document.addEventListener('lb:zoom', onExternal);
    return () => document.removeEventListener('lb:zoom', onExternal);
  }, [triggerPulse]);

  const px = typeof size === 'number' ? `${size}px` : size;
  const rpmValue = ((overlayOpen || nextDir === 'out') ? -1 : 1) * rpm;

  // keep visual size; tighten the hit test so there’s no “invisible rim”
  const HIT_INSET = tightHitbox ? 4 : 0;
  const innerPx = `calc(${px} - ${HIT_INSET * 2}px)`;

  // heavy drop-shadow stack (mirrors banned page intensity)
  const strongShadow =
    pulse === 'in'
      ? `drop-shadow(0 0 10px rgba(0,255,42,1))
         drop-shadow(0 0 28px rgba(0,255,42,.95))
         drop-shadow(0 0 64px rgba(0,255,42,.70))
         drop-shadow(0 0 110px rgba(0,255,42,.50))`
      : pulse === 'out'
      ? `drop-shadow(0 0 10px rgba(255,26,26,1))
         drop-shadow(0 0 28px rgba(255,26,26,.95))
         drop-shadow(0 0 64px rgba(255,26,26,.70))
         drop-shadow(0 0 110px rgba(255,26,26,.50))`
      : 'none';

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        position: 'relative',
        display: 'inline-block',
        borderRadius: '9999px',
        overflow: 'hidden',   // clip aura to the circle so size feels exact
        boxShadow: 'none',
        ...style,
      }}
    >
      {/* INTENSE background aura (under canvas, clipped by overflow) */}
      {pulseOn && (
        <>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: '-22%',
              borderRadius: '9999px',
              background:
                pulse === 'in'
                  ? 'radial-gradient(closest-side, rgba(0,255,42,1) 0%, rgba(0,255,42,.65) 45%, rgba(0,255,42,.15) 80%, transparent 100%)'
                  : 'radial-gradient(closest-side, rgba(255,26,26,1) 0%, rgba(255,26,26,.65) 45%, rgba(255,26,26,.15) 80%, transparent 100%)',
              filter: 'blur(14px)',
              pointerEvents: 'none',
              zIndex: 0,
              mixBlendMode: 'screen',
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: '-8%',
              borderRadius: '9999px',
              background:
                pulse === 'in'
                  ? 'radial-gradient(closest-side, rgba(0,255,42,.95), transparent 72%)'
                  : 'radial-gradient(closest-side, rgba(255,26,26,.95), transparent 72%)',
              filter: 'blur(10px)',
              pointerEvents: 'none',
              zIndex: 0,
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}

      {/* real hit target */}
      <button
        type="button"
        aria-label="Zoom products"
        title="Zoom products (Click = Smart IN/OUT • Right-click = OUT)"
        data-orb="density"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        style={{
          position: 'absolute',
          left: HIT_INSET,
          top: HIT_INSET,
          width: innerPx,
          height: innerPx,
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          margin: 0,
          lineHeight: 0,
          background: 'transparent',
          border: 0,
          borderRadius: '9999px',
          cursor: 'pointer',
          clipPath: 'circle(50% at 50% 50%)',
          WebkitTapHighlightColor: 'transparent',
          outline: 0,
          boxShadow: 'none',
          WebkitAppearance: 'none',
          // push “banned-level” glow directly onto the canvas via filters
          filter: strongShadow,
          transition: 'filter .08s ease',
        }}
      >
        <BlueOrbCross3D
          height={innerPx}
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
          haloTint={haloTint}   // still tints the internal halos
        />
      </button>
    </div>
  );
}
