// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({
  rootSelector = '[data-shop-root]',
}) {
  const [isNight, setIsNight] = useState(false);

  // initial theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') {
        setIsNight(saved === 'night');
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        setIsNight(!!prefersDark);
      }
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

  // read the control size from CSS var
  const ctrlPx = useMemo(() => {
    const r = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || '44px';
    return parseInt(r, 10) || 44;
  }, []);

  return (
    <header
      role="banner"
      className="w-full px-4 pt-3 pb-1"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
      }}
    >
      {/* LEFT: orb — exact square, no extra hit area */}
      <div className="flex items-center">
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <ChakraOrbButton size={ctrlPx} />
        </div>
      </div>

      {/* CENTER: toggle — track height set to (ctrlPx - 14) to match circle */}
      <div className="flex justify-center" id="lb-daynight">
        <DayNightToggle
          className="select-none"
          track={Math.max(28, ctrlPx - 14)}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
        />
      </div>

      {/* RIGHT: cart — same box as orb */}
      <div className="justify-self-end">
        <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
          <CartButton size={ctrlPx} />
        </div>
      </div>
    </header>
  );
}
