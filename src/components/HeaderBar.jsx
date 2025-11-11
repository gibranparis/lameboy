'use client';

import React, { useEffect, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';

const ChakraOrbButton = nextDynamic(() => import('@/components/ChakraOrbButton'), { ssr: false });
const DayNightToggle  = nextDynamic(() => import('@/components/DayNightToggle'),  { ssr: false });
const CartButton      = nextDynamic(() => import('@/components/CartButton'),      { ssr: false });

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  // fixed rails so orb can be bigger than header height
  const railPx    = useResponsive({ desktop: 44, mobile: 44 });
  const orbPx     = useResponsive({ desktop: 80, mobile: 60 });
  const togglePx  = useResponsive({ desktop: 22, mobile: 20 });
  const cartImgPx = useResponsive({ desktop: 28, mobile: 26 });

  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const root = document.querySelector(rootSelector) || document.documentElement;
      root.setAttribute('data-mode', 'shop');
      root.setAttribute('data-theme', isNight ? 'night' : 'day');
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day');
      document.documentElement.style.setProperty('--header-ctrl', `${railPx}px`);
    } catch {}
  }, [isNight, railPx, rootSelector]);

  const headerStyle = useMemo(() => ({
    position: 'fixed',
    inset: '0 0 auto 0',
    zIndex: 500,
    height: railPx,
    display: 'grid',
    gridTemplateColumns: `${railPx}px 1fr ${railPx}px`,
    alignItems: 'center',
    padding: '0 var(--header-pad-x)',
    background: 'transparent'
  }), [railPx]);

  return (
    <header role="banner" style={headerStyle}>
      {/* LEFT — tiny toggle */}
      <div style={{ display:'grid', placeItems:'center', height:railPx, width:railPx, lineHeight:0 }}>
        <DayNightToggle
          className="select-none"
          circlePx={togglePx}
          trackPad={6}
          value={isNight ? 'night' : 'day'}
          onChange={(t) => setIsNight(t === 'night')}
          moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
        />
      </div>

      {/* CENTER — big orb */}
      <div style={{ display:'grid', placeItems:'center', lineHeight:0 }}>
        <ChakraOrbButton
          size={orbPx}
          className="orb-ring"
          style={{ width: orbPx, height: orbPx, display:'grid', placeItems:'center' }}
        />
      </div>

      {/* RIGHT — compact cart */}
      <div style={{ display:'grid', placeItems:'center', height:railPx, width:railPx, lineHeight:0 }}>
        <CartButton size={cartImgPx} inHeader />
      </div>
    </header>
  );
}

function useResponsive({ desktop, mobile, bp = 480 }) {
  const calc = () => (typeof window !== 'undefined' && window.innerWidth <= bp) ? mobile : desktop;
  const [val, setVal] = useState(calc);
  useEffect(() => {
    const onR = () => setVal(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [desktop, mobile, bp]);
  return val;
}
