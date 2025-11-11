// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);

  // Base control size used as the "contract" for --header-ctrl
  const ctrlPx = useResponsiveCtrlPx({ desktop: 56, mobile: 42, bp: 480 });

  // Visual sizes: orb up, cart down (relative to ctrlPx)
  const { leftCol, rightCol, orbPx, moonPx, cartPx } = useMemo(() => {
    const ORB_SCALE  = 1.14; // ~64 when ctrl=56
    const CART_SCALE = 0.72; // ~40 when ctrl=56
    const MOON_SCALE = 1.00;

    const orb  = Math.round(ctrlPx * ORB_SCALE);
    const cart = Math.round(ctrlPx * CART_SCALE);
    const moon = Math.round(ctrlPx * MOON_SCALE);

    return {
      orbPx: orb,
      cartPx: cart,
      moonPx: moon,
      // Grid columns should be at least as big as their visual control
      leftCol:  Math.max(ctrlPx, orb),
      rightCol: Math.max(ctrlPx, cart),
    };
  }, [ctrlPx]);

  // boot theme from storage or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  // reflect mode + theme + control size (CSS var stays the base ctrlPx)
  useEffect(() => {
    try {
      const root = document.querySelector(rootSelector) || document.documentElement;
      root.setAttribute('data-mode', 'shop');
      root.setAttribute('data-theme', isNight ? 'night' : 'day');
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day');
      document.documentElement.style.setProperty('--header-ctrl', `${ctrlPx}px`);
    } catch {}
  }, [isNight, rootSelector, ctrlPx]);

  return (
    <header
      role="banner"
      className="w-full px-4 pt-3 pb-1"
      style={{
        display: 'grid',
        gridTemplateColumns: `${leftCol}px 1fr ${rightCol}px`,
        alignItems: 'center',
      }}
    >
      {/* LEFT: ORB (larger) */}
      <div className="flex items-center select-none" style={{ lineHeight: 0, overflow: 'visible' }}>
        <div style={{ height: orbPx, width: orbPx, display: 'grid', placeItems: 'center' }}>
          <ChakraOrbButton size={orbPx} />
        </div>
      </div>

      {/* CENTER: Day/Night toggle (kept at base size, no blue focus ring) */}
      <div className="flex justify-center" id="lb-daynight" style={{ lineHeight: 0 }}>
        <DayNightToggle
          className="select-none"
          circlePx={moonPx}
          trackPad={8}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonImages={['/toggle/moon-red.png', '/toggle/moon-blue.png']}
        />
      </div>

      {/* RIGHT: CART (smaller) */}
      <div className="justify-self-end" style={{ lineHeight: 0 }}>
        <div style={{ height: cartPx, width: cartPx, display: 'grid', placeItems: 'center' }}>
          <CartButton size={cartPx} inHeader />
        </div>
      </div>

      {/* Scoped CSS: remove the blue ring around the moon toggle */}
      <style jsx global>{`
        #lb-daynight .lb-switch { outline: 0 !important; }
      `}</style>
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
