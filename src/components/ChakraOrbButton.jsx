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
  /** shrink the interactive radius to feel exactly like the orb (no outer dead rim) */
  tightHitbox = true,
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 160;

  // pulse: 'none' | 'in' | 'out'
  const [pulse, setPulse] = useState('none');
  const [haloTint, setHaloTint] = useState(null);
  const pulseTimer = useRef(null);

  const [nextDir, setNextDir] = useState('in'); // inferred from grid density
  const [overlayOpen, setOverlayOpen] = useState(false);

  // watch overlay flag (reverse spin there)
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

  // grid density -> predict next direction
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
  const RED = '#ff1a1a';

  const triggerPulse = useCallback((kind) => {
    clearTimeout(pulseTimer.current);
    setPulse(kind);
    setHaloTint(kind === 'in' ? GREEN : kind === 'out' ? RED : null);
    pulseTimer.current = setTimeout(() => {
      setPulse('none');
      setHaloTint(null);
    }, 320);
  }, []);

  const fireZoom = useCallback(
    (dir) => {
      const now = performance.now();
      if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
      lastFireRef.current = now;

      triggerPulse(dir === 'in' ? 'in' : 'out');

      const detail = { step: 1, dir };
      document.dispatchEvent(new CustomEvent('lb:zoom', { detail }));
      document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
      document.dispatchEvent(new CustomEvent('grid-density', { detail })); // legacy
    },
    [triggerPulse]
  );

  const onClick = () => fireZoom(nextDir);
  const onContextMenu = (e) => {
    e.preventDefault();
    fireZoom('out');
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fireZoom(nextDir);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      fireZoom('in');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      fireZoom('out');
    }
  };
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX),
      ay = Math.abs(deltaY);
    if (ax > ay) {
      deltaX > 0 ? fireZoom('out') : fireZoom('in');
    } else {
      deltaY > 0 ? fireZoom('in') : fireZoom('out');
    }
  };

  // reflect external zoom pulses too
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

  // shrink the actual clickable area slightly so it feels exactly like the visible orb
  // (keeps visual size unchanged; only hit-test tightens)
  const HIT_INSET = tightHitbox ? 4 : 0; // px
  const innerPx = `calc(${px} - ${HIT_INSET * 2}px)`;

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        position: 'relative',
        display: 'inline-block',
        // clip anything that would extend beyond the circular visual (pulse glow)
        borderRadius: '9999px',
        overflow: 'hidden', // prevents aura from making it "feel bigger"
        // remove any accidental layout/paint inflation
        boxShadow: 'none',
        ...style,
      }}
    >
      {/* real hit target (optionally tightened) */}
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
          // ensure pointer area equals visual circle
          clipPath: 'circle(50% at 50% 50%)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* pulse aura — now clipped inside the circle by the overflow above */}
        {pulse !== 'none' && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0, // fill the circle; no negative inset overflow
              borderRadius: '9999px',
              boxShadow:
                pulse === 'in'
                  ? `0 0 22px 8px rgba(0,255,42,.85), 0 0 70px 28px rgba(0,255,42,.35)`
                  : `0 0 22px 8px rgba(255,26,26,.85), 0 0 70px 28px rgba(255,26,26,.35)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

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
          haloTint={haloTint}
        />
      </button>
    </div>
  );
}
