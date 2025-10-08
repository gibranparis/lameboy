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

/** Visual alignment */
const CONTROL_H       = 56;        // header control square (orb/canvas + cart row height)
const ORB_GEOM_SCALE  = 1.08;      // inner orb fill inside its square
const TOGGLE_SIZE     = 34;        // small, matches inner orb feel
const HEADER_H        = 86;

export default function Page() {
  const [theme, setTheme] = useState('day');       // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);
  const [veil, setVeil] = useState(false);
  const [cols, setCols] = useState(3);             // start at 3 cols

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

  const onProceed = () => setIsShop(true);

  // header orb action: cycle columns 1→5→1
  const cycleCols = () => setCols(c => (c % 5) + 1);

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
          {/* LEFT: interactive orb (tight square) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Add a column (loops 1–5)"
              style={{
                width: CONTROL_H, height: CONTROL_H,
                padding: 0, margin: 0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer',
                lineHeight: 0
              }}
              onClick={cycleCols}
              title="Add a column (loops 1–5)"
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                rpm={44}
                includeZAxis
                glow
                geomScale={ORB_GEOM_SCALE}
                interactive={false}   // wrapper handles click; canvas hitbox stays tight
              />
            </button>
          </div>

          {/* CENTER: compact toggle */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              size={TOGGLE_SIZE}
              value={theme}
              onChange={setTheme}
            />
          </div>

          {/* RIGHT: cart as silhouette (Birkin 25) */}
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
            <ShopGrid columns={cols} />
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
