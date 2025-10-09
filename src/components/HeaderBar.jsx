// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton'; // the tight wrapper around the canvas
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({
  rootSelector = '[data-shop-root]',
  ctrlHeight = 36,  // <— one source of truth for control row height
}) {
  const [isNight, setIsNight] = useState(false);

  // restore theme or prefer system
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') {
        setIsNight(saved === 'night');
        return;
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      setIsNight(!!prefersDark);
    } catch {}
  }, []);

  // apply data attributes for shop theming
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
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '10px 12px 6px',
        // no implicit min-height; controls define their own size
      }}
    >
      {/* LEFT: orb (tight real size; no invisible padding) */}
      <div className="flex items-center gap-2">
        <ChakraOrbButton size={ctrlHeight} />
      </div>

      {/* CENTER: toggle – explicit height keeps track/knob exact */}
      <div className="flex justify-center">
        <DayNightToggle
          track={ctrlHeight}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonChoices={['/moon-red.png','/moon-blue.png']}
        />
      </div>

      {/* RIGHT: cart */}
      <div className="justify-self-end" style={{ height: ctrlHeight, display:'grid', placeItems:'center' }}>
        <CartButton />
      </div>
    </header>
  );
}
