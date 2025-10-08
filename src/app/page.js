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

/* ========= Visual alignment constants =========
   - CONTROL_H: square box used by header orb + cart
   - ORB_GEOM_SCALE: scales inner 3D geometry *without* changing hitbox
   - TOGGLE_SIZE: toggle height (width ≈ height * 1.62)
   - HEADER_H: header bar height
*/
const CONTROL_H      = 56;
const ORB_GEOM_SCALE = 1.35;
const TOGGLE_SIZE    = 30; // height in px (slim)
const HEADER_H       = 84;

export default function Page() {
  const [theme, setTheme] = useState('day');     // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);   // gate (false) → shop (true)
  const [veil, setVeil] = useState(false);       // arrival veil after cascade

  // keep <html> data-theme in sync so CSS tokens apply
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    return () => root.removeAttribute('data-theme');
  }, [theme]);

  // if we arrived from banned cascade, briefly white-veil the shop
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

  // toggle handler (DayNightToggle wants isNight/onToggle)
  const flipTheme = () => setTheme((t) => (t === 'day' ? 'night' : 'day'));
  const isNight = theme === 'night';

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
            position:'fixed',
            inset:'0 0 auto 0',
            height: HEADER_H,
            zIndex: 140,
            display:'grid',
            gridTemplateColumns:'1fr auto 1fr',
            alignItems:'center',
            background:'transparent'
          }}
        >
          {/* LEFT: decorative orb (tight square; no extra hit area) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <div
              data-orb="density"
              aria-label="density-orb"
              style={{
                width: CONTROL_H,
                height: CONTROL_H,
                display:'grid',
                placeItems:'center',
                pointerEvents:'none' // decorative in header
              }}
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                rpm={44}
                includeZAxis
                glow
                geomScale={ORB_GEOM_SCALE} // bigger inner geometry, same outer box
                interactive={false}
              />
            </div>
          </div>

          {/* CENTER: slimmer toggle sized to match orb geometry */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              width={Math.round(TOGGLE_SIZE * 1.62)}
              height={TOGGLE_SIZE}
              isNight={isNight}
              onToggle={flipTheme}
            />
          </div>

          {/* RIGHT: cart as silhouette, vertically aligned to CONTROL_H */}
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
            position:'fixed',
            inset:0,
            background:'#fff',
            opacity:1,
            transition:'opacity .42s ease-out',
            zIndex:200,
            pointerEvents:'none'
          }}
          ref={(el)=> el && requestAnimationFrame(() => (el.style.opacity = 0))}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  );
}
