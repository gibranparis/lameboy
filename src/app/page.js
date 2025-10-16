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

/** ===== Visual alignment (single source of truth) ====================== */
const CONTROL_H       = 44;   // knob/orb/cart square in px — tweak this only
const ORB_GEOM_SCALE  = 0.60; // visible orb fill inside its square (0.58–0.62)
const HEADER_H        = 86;

export default function Page() {
  const [theme, setTheme]   = useState('day');  // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // Sync theme + mode ON <html> so global CSS applies to the whole page
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');

    // Keep globals.css in sync for any CSS that reads --header-ctrl
    root.style.setProperty('--header-ctrl', `${CONTROL_H}px`);
  }, [theme, isShop]);

  // Listen for DayNightToggle's 'theme-change' event
  useEffect(() => {
    /** @param {CustomEvent<{theme:'day'|'night'}>} e */
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    // @ts-ignore
    window.addEventListener('theme-change', onTheme);
    return () => {
      // @ts-ignore
      window.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // after cascade hop, fade the white veil away smoothly
  useEffect(() => {
    let fromCascade = false;
    try {
      fromCascade = sessionStorage.getItem('fromCascade') === '1';
      if (fromCascade) {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  return (
    <div
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
              aria-label="Grid density +1"
              style={{
                width: CONTROL_H, height: CONTROL_H,
                padding: 0, margin: 0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer',
                lineHeight: 0
              }}
              onClick={() => {
                // Talk to ShopGrid via global custom event
                window.dispatchEvent(new CustomEvent('grid-density', { detail: { step: 1 } }));
              }}
              title="Bump product columns"
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

          {/* CENTER: toggle — knob equals orb size; day clouds / night stars included */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={CONTROL_H}   // knob diameter == orb/chakra square
              trackPad={8}           // reduce to 6 if track reads a hair tall
              // optionally pass your moon images
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart — same square box as orb */}
          <div style={{ display:'grid', justifyContent:'end' }}>
            <div style={{ height: CONTROL_H, width: CONTROL_H, display:'grid', placeItems:'center' }}>
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
            {/* Top-row controls/cart are already in the header */}
            <ShopGrid hideTopRow />
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
