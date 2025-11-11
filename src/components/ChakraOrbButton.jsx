// src/components/ChakraOrbButton.jsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 64,
  rpm = 44,                 // match BANNED
  color = '#32ffc7',        // base seafoam
  geomScale = 1.12,         // match BANNED
  offsetFactor = 2.25,
  armRatio = 0.35,
  glow = true,
  glowOpacity = 0.9,
  includeZAxis = true,
  className = '',
  style = {},
  tightHitbox = true,       // keeps click radius tight to the visible orb
}) {
  const lastFireRef = useRef(0);
  const FIRE_COOLDOWN_MS = 150;

  // press state like BANNED: we momentarily override the core color itself
  const [pressColor, setPressColor] = useState(null); // null | '#11ff4f' | '#ff001a'
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [nextDir, setNextDir] = useState('in');

  // watch overlay flag (reverse spin under overlay like before)
  useEffect(() => {
    const read = () =>
      setOverlayOpen(document.documentElement.getAttribute('data-overlay-open') === '1');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay-open'] });
    return () => mo.disconnect();
  }, []);

  // track density to predict next in/out
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

  // exact BANNED hues
  const GREEN = '#11ff4f';
  const RED   = '#ff001a';

  // “BANNED-style pulse”: change core color briefly & max the glow
  const pulse = useCallback((c) => {
    setPressColor(c);
    const t = setTimeout(() => setPressColor(null), 420);
    return () => clearTimeout(t);
  }, []);

  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    // pulse first (true BANNED look)
    pulse(dir === 'in' ? GREEN : RED);

    const detail = { step: 1, dir };
    document.dispatchEvent(new CustomEvent('lb:zoom', { detail }));
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
    document.dispatchEvent(new CustomEvent('grid-density', { detail })); // legacy
  }, [pulse]);

  // mirror external zoom pulses, too
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {};
      if (d.dir === 'in')  pulse(GREEN);
      if (d.dir === 'out') pulse(RED);
    };
    document.addEventListener('lb:zoom', onExternal);
    return () => document.removeEventListener('lb:zoom', onExternal);
  }, [pulse]);

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

  // tight clickable area so no “bigger than it looks”
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
        overflow: 'visible',             // let WebGL glow breathe (BlueOrb handles bloom)
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
          // max glow while pressed like BANNED; otherwise your default
          glowOpacity={pressColor ? 1.0 : glowOpacity}
          includeZAxis={includeZAxis}
          respectReducedMotion={false}
          onActivate={onClick}
          // key line: override the ENTIRE core color briefly (BANNED behavior)
          overrideAllColor={pressColor || null}
          __interactive
        />
      </button>
    </div>
  );
}
