// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import ChakraOrbButton from '@/components/ChakraOrbButton';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

/** New + legacy zoom event emitter */
function emitZoom(step = 1, dir = 'in') {
  try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step, dir } })); } catch {}
  try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); } catch {}
}

export default function HeaderBar({ rootSelector = '[data-shop-root]' }) {
  const [isNight, setIsNight] = useState(false);
  const ctrlPx = useCtrlPx(56);

  // initial theme from storage or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb:theme');
      if (saved === 'night' || saved === 'day') setIsNight(saved === 'night');
      else setIsNight(!!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    } catch {}
  }, []);

  // reflect on root for CSS tokens
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
      style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}
    >
      {/* LEFT: orb (click = zoom in, right-click = zoom out) */}
      <div className="flex items-center">
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => emitZoom(1, 'in')}
            onContextMenu={(e) => { e.preventDefault(); emitZoom(1, 'out'); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitZoom(1, 'in'); }
              if (e.key === 'ArrowLeft') emitZoom(1, 'in');
              if (e.key === 'ArrowRight') emitZoom(1, 'out');
            }}
            style={{ cursor:'pointer', lineHeight:0 }}
          >
            <ChakraOrbButton size={ctrlPx} onActivate={() => emitZoom(1, 'in')} />
          </div>
        </div>
      </div>

      {/* CENTER: toggle — knob equals ctrlPx */}
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

      {/* RIGHT: cart */}
      <div className="justify-self-end">
        <div style={{ height: ctrlPx, width: ctrlPx, display: 'grid', placeItems: 'center' }}>
          <CartButton size={ctrlPx} />
        </div>
      </div>
    </header>
  );
}

function useCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || `${defaultPx}px`;
      setPx(parseInt(v, 10) || defaultPx);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}
