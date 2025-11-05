'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);

  // Responsive control size: smaller on narrow screens so the cart
  // is visually smaller than the hoodie tiles on mobile.
  const ctrlPx = useResponsiveCtrlPx({ desktop: 56, mobile: 42, bp: 480 });

  // boot theme from storage or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  // reflect mode + theme
  useEffect(() => {
    try {
      const root = document.querySelector(rootSelector) || document.documentElement;
      root.setAttribute('data-mode', 'shop');
      root.setAttribute('data-theme', isNight ? 'night' : 'day');
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day');
      // expose the chosen size so other parts (like ShopGrid) can read it if needed
      document.documentElement.style.setProperty('--header-ctrl', `${ctrlPx}px`);
    } catch {}
  }, [isNight, rootSelector, ctrlPx]);

  return (
    <header
      role="banner"
      className="w-full px-4 pt-3 pb-1"
      style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}
    >
      {/* LEFT: orb (self-handled events) */}
      <div className="flex items-center select-none" style={{ lineHeight: 0 }}>
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <ChakraOrbButton size={ctrlPx} />
        </div>
      </div>

      {/* CENTER: day/night */}
      <div className="flex justify-center" id="lb-daynight">
        <DayNightToggle
          className="select-none"
          circlePx={ctrlPx}
          trackPad={8}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
        />
      </div>

      {/* RIGHT: cart (smaller on mobile via ctrlPx) */}
      <div className="justify-self-end" style={{ lineHeight: 0 }}>
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <CartButton size={ctrlPx} inHeader />
        </div>
      </div>
    </header>
  );
}

function useResponsiveCtrlPx({ desktop = 56, mobile = 42, bp = 480 } = {}) {
  const pick = () =>
    typeof window !== 'undefined' && window.innerWidth <= bp ? mobile : desktop;

  const [px, setPx] = useState(pick);

  useEffect(() => {
    const onResize = () => setPx(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp, desktop, mobile]);

  return px;
}
