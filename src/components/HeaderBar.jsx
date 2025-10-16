// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);
  const ctrlPx = useCtrlPx(44); // reads --header-ctrl; default 44px

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

  return (
    <header
      role="banner"
      className="w-full px-4 pt-3 pb-1"
      style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}
    >
      {/* LEFT: orb (fires lb:zoom) */}
      <div className="flex items-center">
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <ChakraOrbButton
            size={ctrlPx}
            onActivate={() => {
              try { window.dispatchEvent(new CustomEvent('lb:zoom')); } catch {}
            }}
          />
        </div>
      </div>

      {/* CENTER: toggle — knob equals ctrlPx, track auto-slim via trackPad */}
      <div className="flex justify-center" id="lb-daynight">
        <DayNightToggle
          className="select-none"
          circlePx={ctrlPx}
          trackPad={8} // keeps pill tight so it doesn’t look taller than the sun/moon
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

function useCtrlPx(defaultPx = 44) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      const v =
        getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') ||
        `${defaultPx}px`;
      setPx(parseInt(v, 10) || defaultPx);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}
