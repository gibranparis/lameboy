// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);
  const ctrlPx = useCtrlPx(56); // reads --header-ctrl; default 56px to match globals.css

  // initial theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  // reflect on root for CSS tokens
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    root.setAttribute('data-mode', 'shop');
    root.setAttribute('data-theme', isNight ? 'night' : 'day');
    try { localStorage.setItem('lb:theme', isNight ? 'night' : 'day'); } catch {}
  }, [isNight, rootSelector]);

  // emit zoom step (both new + legacy events)
  const emitZoomStep = useCallback((step = 1) => {
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); } catch {}
  }, []);

  return (
    <header
      role="banner"
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 16px', // side breathing room so cart doesn’t hug the edge
      }}
    >
      {/* LEFT: orb (fires zoom) */}
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Zoom products"
          data-orb="density" // ties into globals.css: perfect circular hitbox
          onClick={() => emitZoomStep(1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              emitZoomStep(1);
            }
          }}
          style={{
            width: ctrlPx,
            height: ctrlPx,
            padding: 0,
            margin: 0,
            background: 'transparent',
            border: 0,
            display: 'grid',
            placeItems: 'center',
            lineHeight: 0,
            borderRadius: '9999px',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          title="Zoom products"
        >
          {/* ChakraOrbButton’s wrapper ignores events; canvas inside is interactive. */}
          <ChakraOrbButton
            size={ctrlPx}
            rpm={44}
            includeZAxis
            glow
            geomScale={1.78}              // ← make the cross visually fill the square
            onActivate={() => emitZoomStep(1)} // meshes inside canvas also trigger zoom
          />
        </button>
      </div>

      {/* CENTER: toggle — knob equals ctrlPx, track auto-slim via trackPad */}
      <div className="flex justify-center" id="lb-daynight">
        <DayNightToggle
          className="select-none lb-switch"
          circlePx={ctrlPx}
          trackPad={8}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
        />
      </div>

      {/* RIGHT: cart */}
      <div className="justify-self-end">
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <CartButton size={ctrlPx} />
        </div>
      </div>
    </header>
  );
}

function useCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || `${defaultPx}px`;
      setPx(parseInt(v, 10) || defaultPx);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}
