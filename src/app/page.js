'use client';

export const dynamic = 'force-static';

import nextDynamic from 'next/dynamic';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import products from '@/lib/products';

const LandingGate     = nextDynamic(() => import('@/components/LandingGate'),     { ssr: false });
const ShopGrid        = nextDynamic(() => import('@/components/ShopGrid'),        { ssr: false });
const ChakraOrbButton = nextDynamic(() => import('@/components/ChakraOrbButton'), { ssr: false });
const CartButton      = nextDynamic(() => import('@/components/CartButton'),      { ssr: false });
const DayNightToggle  = nextDynamic(() => import('@/components/DayNightToggle'),  { ssr: false });
const BannedLogin     = nextDynamic(() => import('@/components/BannedLogin'),     { ssr: false });

const HEADER_H = 86;

function useHeaderCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || `${defaultPx}px`;
        const n = parseInt(String(v).trim().replace('px',''), 10);
        setPx(Number.isFinite(n) ? n : defaultPx);
      } catch { setPx(defaultPx); }
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}

export default function Page(){
  const ctrlPx = useHeaderCtrlPx();
  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // submit/login modal on shop
  const [loginOpen, setLoginOpen] = useState(false);

  // reflect attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) {
      root.setAttribute('data-shop-root','');
      if (!root.style.getPropertyValue('--grid-cols')) root.style.setProperty('--grid-cols','5');
    } else {
      root.removeAttribute('data-shop-root');
    }
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
  }, [theme, isShop, ctrlPx]);

  // listen to theme-change from toggles
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // white veil after cascade into shop (set by landing or banned)
  useEffect(() => {
    if (!isShop) return;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const enterShop = () => setIsShop(true);

  const headerStyle = useMemo(() => ({
    position:'fixed',
    inset:'0 0 auto 0',
    height:HEADER_H,
    zIndex:500,
    display:'grid',
    gridTemplateColumns:'auto 1fr auto',
    alignItems:'center',
    padding:'0 16px',
    background:'transparent',
  }), []);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {!isShop ? (
        <main style={{ minHeight:'100dvh' }}>
          <LandingGate onCascadeComplete={enterShop} />
        </main>
      ) : (
        <>
          <header role="banner" style={headerStyle}>
            {/* LEFT: orb */}
            <div style={{ display:'grid', justifyContent:'start' }}>
              <ChakraOrbButton size={64} className="orb-ring" style={{ display:'grid', placeItems:'center' }} />
            </div>

            {/* CENTER: day/night toggle */}
            <div id="lb-daynight" style={{ display:'grid', placeItems:'center' }}>
              <DayNightToggle circlePx={28} trackPad={1} moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']} />
            </div>

            {/* RIGHT: cart */}
            <div style={{ display:'grid', justifyContent:'end' }}>
              <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
                <CartButton inHeader />
              </div>
            </div>
          </header>

          <main style={{ paddingTop: HEADER_H }}>
            <ShopGrid products={products} autoOpenFirstOnMount />

            {/* Submit FAB → open banned login in LOGIN mode (glowing red heart) */}
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              aria-label="Submit"
              title="Submit"
              className="heart-submit"
              style={{ position:'fixed', right:18, bottom:18, zIndex:520 }}
            />

            {loginOpen && (
              <div
                role="dialog"
                aria-modal="true"
                style={{
                  position:'fixed', inset:0, zIndex:540,
                  display:'grid', placeItems:'center', background:'rgba(0,0,0,.55)'
                }}
                onClick={(e)=>{ if(e.target === e.currentTarget) setLoginOpen(false); }}
              >
                <div style={{ outline:'none' }}>
                  <BannedLogin
                    onProceed={() => setLoginOpen(false)}
                    startView="login"
                  />
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {veil && (
        <div
          aria-hidden="true"
          style={{ position:'fixed', inset:0, background:'#fff', opacity:1, transition:'opacity .42s ease-out', zIndex:200, pointerEvents:'none' }}
          ref={(el)=> { if (el) requestAnimationFrame(() => { el.style.opacity = '0'; }); }}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  );
}
