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

const HEADER_H = 86; // visual header height (keeps page content pushed down)

export default function Page() {
  const ctrlPx = useHeaderCtrlPx(); // ← pulls 56px from your globals.css
  const [theme, setTheme]   = useState('day');  // 'day' | 'night'
  const [isShop, setIsShop] = useState(true);   // show shop immediately
  const [veil,  setVeil]    = useState(false);

  // ✅ Size choices: bigger orb, slimmer toggle (but same visual rhythm)
  const ORB_PX        = Math.round(ctrlPx * 1.18);  // make chakra ~18% larger
  const TOGGLE_KNOB_PX= Math.round(ctrlPx * 0.86);  // knob smaller than orb
  const TOGGLE_TRACK_PAD = 2;                       // tight “glove” around moon/sun

  // Keep <html> in sync for global CSS tokens
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');
    // also keep the var updated in case you tweak ctrl size in code later
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
  }, [theme, isShop, ctrlPx]);

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

  // Emit both the new and legacy events so ShopGrid reacts
  const emitZoomStep = useCallback((step = 1) => {
    const detail = { step };
    console.log('[orb] emit', detail);
    try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('grid-density', { detail })); } catch {}
  }, []);

  const headerStyle = useMemo(() => ({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px', // breathing room so cart doesn’t hug the edge
    background:'transparent'
  }), []);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {/* SHOP HEADER */}
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT: orb button — click & keyboard activate */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Zoom grid"
              data-orb="density"
              className="orb-ring"
              style={{
                width: ORB_PX, height: ORB_PX,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0,
                borderRadius:'9999px',
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
              <BlueOrbCross3D
                height={`${ORB_PX}px`}      // ← bigger canvas
                rpm={44}
                geomScale={1.02}            // fill the circle more
                glow
                glowScale={1.5}
                includeZAxis
                interactive={true}
                onActivate={() => emitZoomStep(1)}
                overrideGlowOpacity={0.9}
              />
            </button>
          </div>

          {/* CENTER: toggle (slimmer track, smaller than orb, knob == TOGGLE_KNOB_PX) */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={TOGGLE_KNOB_PX}
              trackPad={TOGGLE_TRACK_PAD}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart — keep original square for rhythm */}
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
