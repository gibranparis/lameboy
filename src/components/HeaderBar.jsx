'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);

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

  // read --header-ctrl so all three controls match in pixels
  const ctrlPx = useCtrlPx();

  return (
    <header
      role="banner"
      className="w-full px-4 pt-3 pb-1"
      style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center' }}
    >
      {/* LEFT: orb */}
      <div className="flex items-center">
        <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
          <ChakraOrbButton size={ctrlPx} />
        </div>
      </div>

      {/* CENTER: toggle — knob matches orb exactly */}
      <div className="flex justify-center" id="lb-daynight">
        <DayNightToggle
          className="select-none"
          circlePx={ctrlPx}
          trackPad={8}                        // tiny cushion so the pill isn’t taller than needed
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
        />
      </div>

      {/* RIGHT: cart */}
      <div className="justify-self-end">
        <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
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
      const v = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || `${defaultPx}px`;
      setPx(parseInt(v, 10) || defaultPx);
    };
    read();
    // respond to theme/font-size changes just in case
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}
