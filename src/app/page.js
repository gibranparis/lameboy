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

/**
 * Visual alignment constants
 */
const CONTROL_H       = 64;       // header row height for controls
const ORB_GEOM_SCALE  = 1.05;     // inner orb fill inside its 64px square
const TOGGLE_RATIO    = 0.62;     // toggle height ≈ inner orb geometry height
const TOGGLE_SIZE     = Math.round(CONTROL_H * TOGGLE_RATIO);

const HEADER_H        = 86;

export default function Page() {
  const [theme, setTheme] = useState('day');     // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);
  const [veil, setVeil] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    return () => root.removeAttribute('data-theme');
  }, [theme]);

  useEffect(() => {
    let cameFromCascade = false;
    try {
      cameFromCascade = sessionStorage.getItem('fromCascade') === '1';
      if (cameFromCascade) {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}
      data-theme={theme}
      {...(isShop ? { 'data-shop-root': '' } : {})}
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* SHOP HEADER */}
      {isShop && (
        <header
          role="banner"
          style={{
            position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
            display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
            background:'transparent'
          }}
        >
          {/* LEFT: decorative orb (tight square, no hitbox outside of geometry) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <div
              data-orb="density"
              aria-label="density-orb"
              style={{
                width: CONTROL_H, height: CONTROL_H,
                display:'grid', placeItems:'center',
                pointerEvents:'none'               // decorative
              }}
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                rpm={44}
                includeZAxis
                glow
                geomScale={ORB_GEOM_SCALE}
                interactive={false}                // decorative in header
              />
            </div>
          </div>

          {/* CENTER: toggle sized to inner orb geometry */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              size={TOGGLE_SIZE}
              value={theme}
              onChange={setTheme}
              showVirgo
            />
          </div>

          {/* RIGHT: cart as silhouette (no pill) */}
          <div style={{ display:'grid', justifyContent:'end' }}>
            <div style={{ height: CONTROL_H, display:'grid', placeItems:'center' }}>
              <CartButton inHeader />
            </div>
          </div>
        </header>
      )}

      {/* PAGES */}
      <main style={{ minHeight:'100dvh' }}>
        {!isShop ? (
          <div className="page-center">
            <BannedLogin onProceed={onProceed} />
          </div>
        ) : (
          <div style={{ paddingTop: HEADER_H }}>
            <ShopGrid columns={5} />
          </div>
        )}
      </main>

      {/* arrival veil after cascade */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position:'fixed', inset:0, background:'#fff',
            opacity:1, transition:'opacity .42s ease-out',
            zIndex:200, pointerEvents:'none'
          }}
          ref={(el)=> el && requestAnimationFrame(() => (el.style.opacity = 0))}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  );
}
