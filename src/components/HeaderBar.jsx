// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({
  rootSelector = '[data-shop-root]',
  controlSize = 48, // one canonical size for orb & toggle
}) {
  const [isNight, setIsNight] = useState(false);

  // restore theme (or system preference)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') {
        setIsNight(saved === 'night');
      } else {
        setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
      }
    } catch {}
  }, []);

  // apply to the shop root + persist
  useEffect(() => {
    const root = document.querySelector(rootSelector) || document.documentElement;
    root.setAttribute('data-mode', 'shop');
    root.setAttribute('data-theme', isNight ? 'night' : 'day');
    try { localStorage.setItem('lb:theme', isNight ? 'night' : 'day'); } catch {}
  }, [isNight, rootSelector]);

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
      {/* LEFT: orb */}
      <div className="flex items-center gap-2">
        <ChakraOrbButton size={controlSize} />
      </div>

      {/* CENTER: toggle */}
      <div className="flex justify-center">
        <DayNightToggle
          size={controlSize}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonSrcs={['/moon-red.png', '/moon-blue.png']}
        />
      </div>

      {/* RIGHT: cart */}
      <div className="justify-self-end">
        <CartButton />
      </div>
    </header>
  );
}
