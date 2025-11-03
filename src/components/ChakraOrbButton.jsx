// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpmBase = 9,                // slow + hypnotic
  color = '#32ffc7',
  geomScale = 1.25,
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  className = '',
  style = {},
  idlePulse = true,
}) {
  const FIRE_COOLDOWN_MS = 150;
  const lastFireRef = useRef(0);

  // we learn current density from ShopGrid broadcasts
  const [cols, setCols] = useState(5);
  const [spinDir, setSpinDir] = useState(+1);      // +1 cw, -1 ccw
  const [haloTint, setHaloTint] = useState(null);  // transient ring

  // receive density updates
  useEffect(() => {
    const onDensity = (e) => {
      const d = e?.detail?.density ?? e?.detail?.value;
      if (typeof d === 'number') {
        setCols(d);
        // spin points “expand/outward” when we’re at min density to hint zooming out of 1
        setSpinDir(d === 1 ? +1 : -1);
      }
    };
    const names = ['lb:grid-density', 'lb:zoom/grid-density'];
    names.forEach((n) => { window.addEventListener(n, onDensity); document.addEventListener(n, onDensity); });
    return () => names.forEach((n) => { window.removeEventListener(n, onDensity); document.removeEventListener(n, onDensity); });
  }, []);

  const flash = (hex) => {
    setHaloTint(hex);
    setTimeout(() => setHaloTint(null), 520);
  };

  const sendZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    flash(dir === 'in' ? '#39ff14' : '#ff001a'); // green grow / red shrink

    const detail = { step: 1, dir };
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
  }, []);

  // primary click:
  // - if overlay open → always "out" (close) → red
  // - else ping-pong by density: cols>1 => "out" (shrink, red), cols===1 => "in" (expand, green)
  const onPrimary = () => {
    const overlayOpen = document.documentElement.hasAttribute('data-overlay-open');
    if (overlayOpen) return sendZoom('out');
    return sendZoom(cols > 1 ? 'out' : 'in');
  };

  const onContextMenu = (e) => { e.preventDefault(); sendZoom('out'); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPrimary(); }
    else if (e.key === 'ArrowLeft')  sendZoom('in');
    else if (e.key === 'ArrowRight') sendZoom('out');
  };
  const onWheel = (e) => {
    e.preventDefault();
    const { deltaX, deltaY } = e;
    const ax = Math.abs(deltaX), ay = Math.abs(deltaY);
    if (ax > ay) { deltaX > 0 ? sendZoom('out') : sendZoom('in'); }
    else         { deltaY > 0 ? sendZoom('in')  : sendZoom('out'); }
  };

  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <button
      type="button"
      aria-label="Zoom products"
      title="Zoom products (Click/Enter = In (at 1) or Out, Right-click = Out, Wheel = In/Out)"
      data-orb="density"
      onClick={onPrimary}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      className={className}
      style={{
        width: px, height: px, display: 'inline-grid', placeItems: 'center',
        lineHeight: 0, borderRadius: '9999px', overflow: 'visible',
        padding: 0, margin: 0, background: 'transparent', border: 0,
        cursor: 'pointer', position: 'relative', zIndex: 900,
        contain: 'layout paint style', ...style,
      }}
    >
      {/* gentle idle pulse */}
      {idlePulse && !haloTint && (
        <>
          <span aria-hidden className="lb-idle-pulse" style={{ position:'absolute', inset:0, borderRadius:'9999px', pointerEvents:'none', zIndex:1 }} />
          <style jsx>{`
            @keyframes lbIdlePulse {
              0%   { box-shadow: 0 0 0 0 rgba(50,255,199,.16), inset 0 0 0 1px rgba(255,255,255,.18); }
              50%  { box-shadow: 0 0 10px 2px rgba(50,255,199,.22), inset 0 0 0 1px rgba(255,255,255,.18); }
              100% { box-shadow: 0 0 0 0 rgba(50,255,199,.16), inset 0 0 0 1px rgba(255,255,255,.18); }
            }
            .lb-idle-pulse { animation: lbIdlePulse 2.2s ease-in-out infinite; }
          `}</style>
        </>
      )}

      {/* GREEN / RED transient ring */}
      {haloTint && (
        <span
          aria-hidden
          style={{
            position:'absolute', inset:-2, borderRadius:'9999px',
            boxShadow:`0 0 18px ${haloTint}88, 0 0 36px ${haloTint}55, inset 0 0 0 1px ${haloTint}66`,
            pointerEvents:'none', zIndex:3,
          }}
        />
      )}

      <BlueOrbCross3D
        height={px}
        rpm={rpmBase * spinDir}
        color={color}
        geomScale={geomScale}
        offsetFactor={offsetFactor}
        armRatio={armRatio}
        glow={glow}
        glowOpacity={glowOpacity}
        includeZAxis={includeZAxis}
        haloTintColor={haloTint}     // tint outer glow only; chakra cores keep colors
        interactive
        respectReducedMotion={false}
        onActivate={onPrimary}
      />
    </button>
  );
}
