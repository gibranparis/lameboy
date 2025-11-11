// src/app/page.js
'use client';

export const dynamic = 'force-static';

import nextDynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import products from '@/lib/products';

const LandingGate        = nextDynamic(() => import('@/components/LandingGate'),        { ssr: false });
const ShopGrid           = nextDynamic(() => import('@/components/ShopGrid'),           { ssr: false });
const ChakraOrbButton    = nextDynamic(() => import('@/components/ChakraOrbButton'),    { ssr: false });
const CartButton         = nextDynamic(() => import('@/components/CartButton'),         { ssr: false });
const DayNightToggle     = nextDynamic(() => import('@/components/DayNightToggle'),     { ssr: false });
const BannedLogin        = nextDynamic(() => import('@/components/BannedLogin'),        { ssr: false });
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), { ssr: false });
const HeartBeatButton    = nextDynamic(() => import('@/components/HeartBeatButton'),    { ssr: false });

const RUNNER_H = 14;

/* Read --header-ctrl so header height + padding-top stay in sync with CSS */
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
  const [loginOpen, setLoginOpen] = useState(false);

  // reflect mode/theme + header size + runner height (for heart offset)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
    root.style.setProperty('--runner-h', `${RUNNER_H}px`);
    if (isShop) {
      root.setAttribute('data-shop-root','');
      if (!root.style.getPropertyValue('--grid-cols')) root.style.setProperty('--grid-cols','5');
    } else {
      root.removeAttribute('data-shop-root');
    }
  }, [theme, isShop, ctrlPx]);

  // listen for theme-change events from the toggle
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // white veil when entering shop via cascade
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

  // Header
  const headerStyle = useMemo(() => ({
    position:'fixed',
    inset:'0 0 auto 0',
    height: ctrlPx,
    zIndex: 500,
    display:'grid',
    gridTemplateColumns:'auto 1fr auto', // left • center • right
    alignItems:'center',
    padding:'0 16px',
    background:'transparent',
  }), [ctrlPx]);

  // Sizing: make orb dominant, cart smaller
  const ORB_DESKTOP = 80;
  const ORB_MOBILE  = 60;
  const orbPx = typeof window !== 'undefined' && window.innerWidth <= 480 ? ORB_MOBILE : ORB_DESKTOP;

  return (
    <div className="lb-screen w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {!isShop ? (
        <main className="lb-screen">
          <LandingGate onCascadeComplete={enterShop} />
        </main>
      ) : (
        <>
          <header role="banner" style={headerStyle}>
            {/* LEFT: Day/Night Toggle (compact) */}
            <div style={{ display:'grid', justifyContent:'start' }}>
              <DayNightToggle
                className="select-none"
                circlePx={36}
                trackPad={6}
                moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
              />
            </div>

            {/* CENTER: Chakra Orb (dominant) */}
            <div style={{ display:'grid', placeItems:'center' }}>
              <ChakraOrbButton
                size={orbPx}
                tightHitbox
              />
            </div>

            {/* RIGHT: Cart (smaller than orb) */}
            <div style={{ display:'grid', justifyContent:'end' }}>
              <div style={{ height: 44, width: 44, display:'grid', placeItems:'center' }}>
                <CartButton inHeader />
              </div>
            </div>
          </header>

          <main style={{ paddingTop: ctrlPx }}>
            <ShopGrid products={products} />

            {/* Heart FAB (offset uses --runner-h in CSS) */}
            <HeartBeatButton
              className="heart-submit"
              aria-label="Open login"
              onClick={() => setLoginOpen(true)}
            />

            {loginOpen && (
              <div
                role="dialog"
                aria-modal="true"
                style={{
                  position:'fixed',
                  inset:0,
                  zIndex:540,
                  display:'grid',
                  placeItems:'center',
                  background:'#fff'
                }}
                onClick={(e)=>{ if(e.target === e.currentTarget) setLoginOpen(false); }}
              >
                <div style={{ outline:'none' }}>
                  <BannedLogin onProceed={() => setLoginOpen(false)} startView="login" />
                </div>
              </div>
            )}
          </main>

          {/* Runner pinned to the physical bottom, safe-area aware */}
          <div className="lb-chakra-runner">
            <ChakraBottomRunner height={RUNNER_H} speedSec={12} />
          </div>
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
