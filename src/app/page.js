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
// Change this one number to scale orb, toggle knob, and cart uniformly.
const CONTROL_H       = 44;    // header control square (px)
const ORB_GEOM_SCALE  = 0.98;  // how much the orb fills its square (0.96–0.99)
const HEADER_H        = 86;    // pinned header height (px)

export default function Page() {
  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // Sync theme + mode on <html>; expose --header-ctrl for CSS consumers
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');
    root.style.setProperty('--header-ctrl', `${CONTROL_H}px`);
  }, [theme, isShop]);

  // Day/Night events from the toggle
  useEffect(() => {
    /** @param {CustomEvent<{theme:'day'|'night'}>} e */
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    return () => window.removeEventListener('theme-change', onTheme);
  }, []);

  // Veil fade after cascade
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  // Emit BOTH events so new/legacy listeners respond
  const emitZoomStep = (step = 1) => {
    window.dispatchEvent(new CustomEvent('lb:zoom',      { detail: { step } })); // new
    window.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); // legacy
  };

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {/* SHOP HEADER */}
      {isShop && (
        <header
          role="banner"
          style={{
            position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
            display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
            padding:'12px 18px', background:'transparent'
          }}
        >
          {/* LEFT: orb (fills the square; wrapper click + mesh click both zoom) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Grid density +1"
              style={{
                width: CONTROL_H, height: CONTROL_H,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0
              }}
              onClick={() => emitZoomStep(1)}
              title="Bump product columns"
            >
              <div style={{ width: CONTROL_H, height: CONTROL_H }}>
                <BlueOrbCross3D
                  width={`${CONTROL_H}px`}
                  height={`${CONTROL_H}px`}
                  rpm={44}
                  includeZAxis
                  glow
                  geomScale={ORB_GEOM_SCALE}
                  interactive
                  onActivate={() => emitZoomStep(1)}
                />
              </div>
            </button>
          </div>

          {/* CENTER: toggle — knob equals orb size; clouds/stars handled inside */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={CONTROL_H}
              trackPad={8}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart — same square as orb */}
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
            <ShopGrid hideTopRow />
          </div>
        )}
      </main>

      {/* arrival veil after cascade */}
      {veil && (
        <div
          aria-hidden="true"
          style={{ position:'fixed', inset:0, background:'#fff', opacity:1, transition:'opacity .42s ease-out', zIndex:200, pointerEvents:'none' }}
          ref={(el)=> el && requestAnimationFrame(() => (el.style.opacity = 0))}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  );
}
