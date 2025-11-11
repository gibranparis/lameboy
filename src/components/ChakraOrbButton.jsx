'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

export default function ChakraOrbButton({
  size = 72,              // universal orb size (matches BANNED)
  rpm = 44,               // match BANNED
  color = '#32ffc7',      // base seafoam
  geomScale = 1.12,
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
  const FIRE_COOLDOWN_MS = 150;

  const [pressColor, setPressColor] = useState(null); // '#11ff4f' | '#ff001a' | null
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [nextDir, setNextDir] = useState('in');

  // keep the “edge behavior” correct: at MAX → go IN, at MIN → go OUT
  const MIN = 1, MAX = 5;

  useEffect(() => {
    const read = () =>
      setOverlayOpen(document.documentElement.getAttribute('data-overlay-open') === '1');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay-open'] });
    return () => mo.disconnect();
  }, []);

  // predict next in/out based on density
  useEffect(() => {
    const onDensity = (e) => {
      const d = Number(e?.detail?.density ?? e?.detail?.value);
      if (!Number.isFinite(d)) return;
      if (d <= MIN) setNextDir('out');   // at 1 → next should back OUT
      else if (d >= MAX) setNextDir('in'); // at 5 → next should go IN
      // else leave whatever the user last did (feels natural)
    };
    document.addEventListener('lb:grid-density', onDensity);
    return () => document.removeEventListener('lb:grid-density', onDensity);
  }, []);

  const GREEN = '#11ff4f';  // zoom IN
  const RED   = '#ff001a';  // zoom OUT

  const pulse = useCallback((c) => {
    setPressColor(c);
    const t = setTimeout(() => setPressColor(null), 420);
    return () => clearTimeout(t);
  }, []);

  const fireZoom = useCallback((dir) => {
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    pulse(dir === 'in' ? GREEN : RED);

    const detail = { step: 1, dir };
    // modern events
    document.dispatchEvent(new CustomEvent('lb:zoom', { detail }));
    document.dispatchEvent(new CustomEvent('lb:zoom/grid-density', { detail }));
    // legacy name (harmless if nobody listens)
    document.dispatchEvent(new CustomEvent('grid-density', { detail }));
    // remember user intent between middling densities
    setNextDir(dir);
  }, [pulse]);

  // mirror external zoom pulses
  useEffect(() => {
    const onExternal = (ev) => {
      const d = ev?.detail || {};
      if (d.dir === 'in')  pulse(GREEN);
      if (d.dir === 'out') pulse(RED);
      if (d.dir === 'in' || d.dir === 'out') setNextDir(d.dir);
    };
    document.addEventListener('lb:zoom', onExternal);
    return () => document.removeEventListener('lb:zoom', onExternal);
  }, [pulse]);

  const onClick       = () => fireZoom(nextDir);
  const onContextMenu = (e) => { e.preventDefault(); fireZoom('out'); };
  const onKeyDown     = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fireZoom(nextDir); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')  { e.preventDefault(); fireZoom('in');  }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); fireZoom('out'); }
  };
  const onWheel = (e) => {
    // natural feel: scroll up = zoom IN, down = OUT
    e.preventDefault();
    const y = e.deltaY;
    if (y < 0) fireZoom('in');
    if (y > 0) fireZoom('out');
  };

  const px = typeof size === 'number' ? `${size}px` : size;
  const rpmValue = ((overlayOpen || nextDir === 'out') ? -1 : 1) * rpm;

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
        overflow: 'visible',
        boxShadow: 'none',
        ...style,
      }}
    >
      <button
        type="button"
        aria-label="Zoom products"
        title="Zoom products (Click = Smart IN/OUT • Right-click = OUT • Wheel = IN/OUT)"
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
          glowOpacity={pressColor ? 1.0 : glowOpacity}
          includeZAxis={includeZAxis}
          respectReducedMotion={false}
          onActivate={onClick}
          overrideAllColor={pressColor || null}
          haloTint={pressColor || null}
        />
      </button>
    </div>
  );
}
