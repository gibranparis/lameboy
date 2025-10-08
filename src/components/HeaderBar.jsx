// src/components/HeaderBar.jsx
'use client';

import React, { useEffect, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';
import DayNightToggle from '@/components/DayNightToggle';
import CartButton from '@/components/CartButton';

/**
 * Header row for the /shop page.
 * - Left: decorative orb (no pointer events, small square)
 * - Center: Day/Night Toggle (explicit width/height)
 * - Right: CartButton (silhouette; styling is in globals.css)
 *
 * If you already have a theme store/context, replace the local state with it.
 */
export default function HeaderBar({
  rootSelector = '[data-shop-root]',
  toggleWidth = 88,
  toggleHeight = 30,
}) {
  const [isNight, setIsNight] = useState(false);

  // Restore theme from localStorage (optional) and honor system preference on first load
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

  // Apply data attributes to the unified shop root so CSS tokens take effect
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    root.setAttribute('data-mode', 'shop');
    root.setAttribute('data-theme', isNight ? 'night' : 'day');
    try {
      localStorage.setItem('lb:theme', isNight ? 'night' : 'day');
    } catch {}
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
      {/* LEFT: decorative orb (small, non-interactive) */}
      <div className="flex items-center gap-2">
        <BlueOrbCross3D height="28px" />
      </div>

      {/* CENTER: toggle (explicit size so it never “inherits” the orb’s footprint) */}
      <div className="flex justify-center">
        <DayNightToggle
          width={toggleWidth}
          height={toggleHeight}
          isNight={isNight}
          onToggle={() => setIsNight(v => !v)}
        />
      </div>

      {/* RIGHT: cart (silhouette; globals.css handles theme colors) */}
      <div className="justify-self-end">
        <CartButton />
      </div>
    </header>
  );
}
