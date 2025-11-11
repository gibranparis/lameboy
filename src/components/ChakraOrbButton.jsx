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
  /** keep click area tight to the visible orb */
  tightHitbox = true,
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 150;

  // 'none' | 'in' | 'out'
  const [pulse, setPulse] = useState('none');
  const [haloTint, setHaloTint] = useState(null); // passes into BlueOrbCross3D for core halo hint
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [nextDir, setNextDir] = useState('in');

  // watch overlay flag (reverse spin there)
  useEffect(() => {
    const read = () =>
      setOverlayOpen(
        document.documentElement.getAttribute('data-overlay-open') === '1'
      );
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay-open'] });
    return () => mo.disconnect();
  }, []);

  // grid density -> predict next dir (ping-pong)
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

  // banned-page glow palette
  const GREEN = '#11ff4f'; // stronger neon
  const RED   = '#ff1b47'; // saturated red

  const playPulse = useCallback((kind) => {
    setPulse(kind);
    setHaloTint(kind === 'in' ? GREEN : kind === 'out' ? RED : null);
    // clear shortly after animation finishes (CSS 420ms)
    const t = setTimeout(() => { setPulse('none'); setHaloTint(null); }, 460);
    return () => clearTimeout(t);
  }, []);

  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    playPulse(dir === 'in' ? 'in' : 'out');

    const detail = { step: 1, dir };
    document.dispatchEvent(new CustomEvent('lb:zoom', { detail }));
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
    document.dispatchEvent(new CustomEvent('grid-density', { detail })); // legacy
  }, [playPulse]);

  // reflect external pulses
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {};
      if (d.dir === 'in' || d.dir === 'out') playPulse(d.dir);
    };
    document.addEventListener('lb:zoom', onExternal);
    return () => document.removeEventListener('lb:zoom', onExternal);
  }, [playPulse]);

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

  const px = typeof size === 'number' ? `${size}px` : size;
  const rpmValue = ((overlayOpen || nextDir === 'out') ? -1 : 1) * rpm;

  // tight click hit box so no “bigger than it looks” feeling
  const HIT_INSET = tightHitbox ? 4 : 0;
  const innerPx = `calc(${px} - ${HIT_INSET * 2}px)`;

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        position: 'relative',
        display: 'inline-block',
        borderRadius: '9999px',
        overflow: 'visible',         // allow the BANNED-style bloom to breathe
        boxShadow: 'none',
        ...style,
      }}
    >
      <button
        type="button"
        aria-label="Zoom products"
        title="Zoom products (Click = Smart IN/OUT • Right-click = OUT)"
        data-orb="density"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        className={`orb-press ${pulse !== 'none' ? `is-${pulse}` : ''}`}
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
          outline: '0',
        }}
      >
        {/* strong banned-style bloom */}
        <span
          aria-hidden
          className="orb-bloom"
        />
        {/* tint layer that flips red/green on press */}
        <span
          aria-hidden
          className="orb-bloom-tint"
          style={{
            // color set via CSS for in/out; keep here as fallback
            background:
              pulse === 'in'
                ? 'radial-gradient(closest-side, rgba(17,255,79,.95), rgba(17,255,79,.35) 55%, transparent 72%)'
                : pulse === 'out'
                ? 'radial-gradient(closest-side, rgba(255,27,71,.95), rgba(255,27,71,.35) 55%, transparent 72%)'
                : 'transparent',
            opacity: pulse === 'none' ? 0 : 1,
          }}
        />

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

      {/* inline CSS scoped to the component */}
      <style jsx>{`
        .orb-press{
          transform: translateZ(0) scale(1);
          transition: transform 140ms cubic-bezier(.3,.7,.2,1);
        }
        .orb-press.is-in,
        .orb-press.is-out{
          transform: translateZ(0) scale(1.06); /* tiny pop like BANNED */
        }

        /* Base bloom (subtle even when idle; no blue ring) */
        .orb-bloom{
          position:absolute; inset:-2px;
          border-radius:9999px;
          pointer-events:none;
          mix-blend-mode:screen;
          box-shadow:
            0 0 14px 6px rgba(255,255,255,.18),
            0 0 40px 16px rgba(120,255,230,.18);
        }

        /* Tint bloom: strong BANNED layers on press */
        .orb-bloom-tint{
          position:absolute; inset:-10px;
          border-radius:9999px;
          pointer-events:none;
          mix-blend-mode:screen;
          filter: saturate(1.4) brightness(1.05);
          transition: opacity 420ms ease;
          box-shadow:
            /* tight inner bloom */
            0 0 26px 10px rgba(255,255,255,.55),
            /* mid aura */
            0 0 70px 28px rgba(255,255,255,.35),
            /* far aura */
            0 0 120px 60px rgba(255,255,255,.18);
        }
        .orb-press.is-in .orb-bloom-tint{
          background: radial-gradient(closest-side, rgba(17,255,79,.95), rgba(17,255,79,.35) 55%, transparent 72%);
          box-shadow:
            0 0 26px 10px rgba(17,255,79,.95),
            0 0 90px 40px rgba(17,255,79,.46),
            0 0 140px 70px rgba(17,255,79,.25);
          opacity: 1;
        }
        .orb-press.is-out .orb-bloom-tint{
          background: radial-gradient(closest-side, rgba(255,27,71,.95), rgba(255,27,71,.35) 55%, transparent 72%);
          box-shadow:
            0 0 26px 10px rgba(255,27,71,.95),
            0 0 90px 40px rgba(255,27,71,.46),
            0 0 140px 70px rgba(255,27,71,.25);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
