// src/app/page.js
'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

/** Read --header-ctrl from CSS so everything matches globals.css exactly */
function useHeaderCtrlPx(defaultPx = 56) {
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

const HEADER_H = 86; // visual header height

export default function Page() {
  const ctrlPx = useHeaderCtrlPx(); // ← pulls 56px from globals.css
  const [theme, setTheme]   = useState('day');  // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // Sync <html> data-attributes + keep --header-ctrl in sync
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
  }, [theme, isShop, ctrlPx]);

  // Listen for DayNightToggle broadcast
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

  // arrival veil after cascade
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

  // Emit BOTH events that ShopGrid listens for
  const emitZoomStep = useCallback((step = 1) => {
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail: { step } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail: { step } })); } catch {}
  }, []);

  const headerStyle = useMemo(() => ({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px',            // breathing room (cart won’t hug the edge)
    background:'transparent'
  }), []);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {/* SHOP HEADER */}
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT: ORB BUTTON — perfect circular hitbox, both click + keyboard */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Zoom grid"
              data-orb="density"
              style={{
                width: ctrlPx, height: ctrlPx,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0,
                borderRadius:'9999px', overflow:'hidden'
              }}
              onClick={() => emitZoomStep(1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  emitZoomStep(1);
                }
              }}
              title="Zoom products"
            >
              {/* Canvas fills the square exactly; geometry fills the canvas */}
              <BlueOrbCross3D
                height={`${ctrlPx}px`}   // square footprint internally
                rpm={44}
                includeZAxis
                glow
                // ⬇ Make the cross BIG. 1.65–1.9 fills most squares depending on taste.
                geomScale={1.78}
                interactive={true}
                onActivate={() => emitZoomStep(1)}  // meshes fire this too
              />
            </button>
          </div>

          {/* CENTER: Toggle (knob == ctrlPx) */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={ctrlPx}
              trackPad={8}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: Cart — same square for rhythm */}
          <div style={{ display:'grid', justifyContent:'end' }}>
            <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
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
