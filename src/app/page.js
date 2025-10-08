// src/app/page.js
'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

/**
 * One place to make the three header controls align visually:
 * - CONTROL_H        : row height
 * - ORB_GEOM_SCALE   : passes to BlueOrbCross3D (controls inner visual diameter)
 * - TOGGLE_RATIO     : toggle height = CONTROL_H * TOGGLE_RATIO
 *
 * Empirically, the inner orb geometry (with your current params) fills about ~62% of the canvas box.
 * Adjust TOGGLE_RATIO if you tweak the orb later.
 */
const CONTROL_H       = 64;
const ORB_GEOM_SCALE  = 1.05;
const TOGGLE_RATIO    = 0.62; // <- makes toggle match inner orb, not canvas edge
const TOGGLE_SIZE     = Math.round(CONTROL_H * TOGGLE_RATIO);

const HEADER_H        = 86; // you had this; keeps some breathing room around the 64px control row

export default function Page() {
  const [theme, setTheme] = useState('day');   // 'day' | 'night'
  const [isShop, setIsShop] = useState(false); // false: gate/banned, true: shop
  const [veil, setVeil] = useState(false);

  // keep html/body tokens in sync so the wrapper paints the color
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    return () => root.removeAttribute('data-theme');
  }, [theme]);

  // after cascade hop, fade the white veil away smoothly
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

  // gate → shop (called by BannedLogin when cascade finishes)
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
            display:'grid', gridTemplateColumns:'1fr auto 1fr',
            alignItems:'center',
            background:'transparent'
          }}
        >
          {/* LEFT: orb (square wrapper = CONTROL_H) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <div
              data-orb="density"
              aria-label="density-orb"
              style={{
                width: CONTROL_H, height: CONTROL_H,
                display:'grid', placeItems:'center',
                pointerEvents:'auto'
              }}
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                rpm={44}
                includeZAxis
                glow
                // IMPORTANT: inner visual diameter controlled by geomScale
                geomScale={ORB_GEOM_SCALE}
                // only meshes receive pointer hits; wrapper empty area is inert
                onActivate={()=> setTheme(t => t === 'day' ? 'night' : 'day')}
              />
            </div>
          </div>

          {/* CENTER: toggle sized to match inner orb */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              value={theme}
              onChange={setTheme}
              size={TOGGLE_SIZE}
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
