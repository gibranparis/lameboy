// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  // Compact control size so the orb can dominate visually
  const ctrlPx = useResponsiveCtrlPx({ desktop: 36, mobile: 32, bp: 520 });

  const [isNight, setIsNight] = useState(false);

  // boot theme from storage or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  // reflect mode + theme + control size
  useEffect(() => {
    try {
      const root = document.querySelector(rootSelector) || document.documentElement;
      root.setAttribute('data-mode', 'shop');
      root.setAttribute('data-theme', isNight ? 'night' : 'day');
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day');
      document.documentElement.style.setProperty('--header-ctrl', `${ctrlPx}px`);
      // mark the shop root so globals.css can hide the big 3D logo
      document.documentElement.setAttribute('data-shop-root', '');
    } catch {}
  }, [isNight, rootSelector, ctrlPx]);

  // sizes
  const sizes = useMemo(() => {
    return {
      box: ctrlPx,          // container square for the side controls
      toggleDot: 22,        // toggle “sun/moon” circle size
      cartImg: 28,          // purse image actual size (CSS also enforces)
      orb: Math.round(ctrlPx * 1.9), // make orb clearly larger than everything
    };
  }, [ctrlPx]);

  return (
    <header
      role="banner"
      className="w-full"
      style={{
        position: 'fixed',
        inset: '0 0 auto 0',
        zIndex: 500,
        height: `var(--header-ctrl)`,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 var(--header-pad-x)',
        background: 'transparent',
      }}
    >
      {/* LEFT: day/night toggle */}
      <div className="flex items-center" style={{ lineHeight: 0 }}>
        <div style={{ height: sizes.box, width: sizes.box, display: 'grid', placeItems: 'center' }}>
          <DayNightToggle
            className="select-none"
            circlePx={sizes.toggleDot}
            trackPad={1}
            value={isNight ? 'night' : 'day'}
            onChange={(t) => setIsNight(t === 'night')}
            moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
          />
        </div>
      </div>

      {/* CENTER: ORB — larger than everything else */}
      <div className="flex items-center justify-center" style={{ lineHeight: 0 }}>
        <ChakraOrbButton size={sizes.orb} />
      </div>

      {/* RIGHT: cart */}
      <div className="flex items-center justify-end" style={{ lineHeight: 0 }}>
        <div style={{ height: sizes.box, width: sizes.box, display: 'grid', placeItems: 'center' }}>
          <CartButton size={sizes.cartImg} inHeader />
        </div>
      </div>
    </header>
  );
}

function useResponsiveCtrlPx({ desktop = 36, mobile = 32, bp = 520 } = {}) {
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
