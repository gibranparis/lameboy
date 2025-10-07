// src/app/page.js
'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

export default function Page() {
  const [mode, setMode] = useState('gate'); // 'gate' | 'shop'
  const [veil, setVeil] = useState(false);
  const [cols, setCols] = useState(5);
  const [theme, setTheme] = useState('day'); // 'day' | 'night'

  // If we just arrived from the cascade, enter shop and fade veil
  useEffect(() => {
    let from = '0';
    try { from = sessionStorage.getItem('fromCascade') || '0'; } catch {}
    if (from === '1') {
      setMode('shop');
      setVeil(true);
      try { sessionStorage.removeItem('fromCascade'); } catch {}
      const t = setTimeout(() => setVeil(false), 420);
      return () => clearTimeout(t);
    }
  }, []);

  const bumpCols = () => setCols(c => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));
  const isShop = mode === 'shop';

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}
      data-theme={theme}
      {...(isShop ? { 'data-shop-root': '' } : {})}
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* Density orb (shop only) */}
      {isShop && (
        <div style={{ position: 'fixed', top: 12, left: 12, width: 88, height: 88, zIndex: 120 }} data-orb="density">
          <button
            aria-label="Toggle grid density"
            onClick={bumpCols}
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'pointer', zIndex: 2 }}
          />
          <BlueOrbCross3D rpm={44} glow includeZAxis />
        </div>
      )}

      {/* Cart */}
      {isShop && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 130 }} data-cart-root>
          <CartButton />
        </div>
      )}

      {/* Day/Night Toggle — top right, under cart */}
      {isShop && (
        <div style={{ position: 'fixed', top: 64, right: 16, zIndex: 125 }}>
          <DayNightToggle
            value={theme}
            onChange={setTheme}
            size={110}
          />
        </div>
      )}

      {/* Content */}
      {!isShop ? (
        <BannedLogin
          onProceed={() => {
            try { sessionStorage.setItem('fromCascade','1'); } catch {}
            setVeil(true);      // white veil first (avoids black flash)
            setMode('shop');    // then flip to shop
            setTimeout(() => setVeil(false), 480);
          }}
        />
      ) : (
        <>
          <div style={{ paddingTop: 110 }} />
          <ShopGrid columns={cols} />
        </>
      )}

      {/* White veil */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, background: '#fff',
            opacity: 1, transition: 'opacity .42s ease-out',
            zIndex: 200, pointerEvents: 'none',
          }}
          ref={(el) => el && requestAnimationFrame(() => (el.style.opacity = 0))}
        />
      )}
    </div>
  );
}
