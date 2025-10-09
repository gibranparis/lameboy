// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({
  rootSelector = '[data-shop-root]',
  ctrlHeight = 36, // change this once; orb, toggle, cart will match
}) {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') {
        setIsNight(saved === 'night'); return;
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      setIsNight(!!prefersDark);
    } catch {}
  }, []);

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
        display:'grid',
        gridTemplateColumns:'1fr auto 1fr',
        alignItems:'center',
        padding:'10px 12px 6px',
        lineHeight:0, // kill stray line-height expansion
      }}
    >
      <div className="flex items-center" style={{ lineHeight:0 }}>
        <ChakraOrbButton size={ctrlHeight} />
      </div>

      <div className="flex justify-center" style={{ lineHeight:0 }}>
        <DayNightToggle
          track={ctrlHeight}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonChoices={['/IMG_6681.PNG','/IMG_6682.PNG']}
        />
      </div>

      <div className="justify-self-end" style={{ height: ctrlHeight, display:'grid', placeItems:'center', lineHeight:0 }}>
        <CartButton size={ctrlHeight} />
      </div>
    </header>
  );
}
