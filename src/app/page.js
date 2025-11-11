// src/app/page.js
'use client';

export const dynamic = 'force-static';

import nextDynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import products from '@/lib/products';

const LandingGate        = nextDynamic(() => import('@/components/LandingGate'),        { ssr: false });
const ShopGrid           = nextDynamic(() => import('@/components/ShopGrid'),           { ssr: false });
const HeaderBar          = nextDynamic(() => import('@/components/HeaderBar'),          { ssr: false });
const ChakraBottomRunner = nextDynamic(() => import('@/components/ChakraBottomRunner'), { ssr: false });
const HeartBeatButton    = nextDynamic(() => import('@/components/HeartBeatButton'),    { ssr: false });
const BannedLogin        = nextDynamic(() => import('@/components/BannedLogin'),        { ssr: false });

const RUNNER_H = 14;

function useCssNumberVar(name, fallback = 56) {
  const [n, setN] = useState(fallback);
  useEffect(() => {
    const read = () => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name) || `${fallback}px`;
        const p = parseInt(String(v).trim().replace('px',''), 10);
        setN(Number.isFinite(p) ? p : fallback);
      } catch { setN(fallback); }
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [name, fallback]);
  return n;
}

export default function Page(){
  const ctrlPx = useCssNumberVar('--header-ctrl', 56);

  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);
  const [veilColor, setVeilColor] = useState('#000');
  const [loginOpen, setLoginOpen] = useState(false);

  // reflect runner height CSS var
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--runner-h', `${RUNNER_H}px`);
  }, []);

  // theme-sync listener (from DayNightToggle)
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // entering shop from cascade: fade the CURRENT background, not white
  useEffect(() => {
    if (!isShop) return;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        // read computed background so we don't flash white
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg')?.trim() || '#000';
        setVeilColor(bg);
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const enterShop = () => setIsShop(true);

  const mainStyle = useMemo(() => ({ paddingTop: ctrlPx }), [ctrlPx]);

  return (
    <div className="lb-screen w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {!isShop ? (
        <main className="lb-screen">
          <LandingGate onCascadeComplete={enterShop} />
        </main>
      ) : (
        <>
          <HeaderBar />

          <main style={mainStyle}>
            <ShopGrid products={products} autoOpenFirstOnMount />

            {/* Heart FAB */}
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
                  background:'transparent',
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
          style={{
            position:'fixed',
            inset:0,
            background: veilColor,  // ← match current theme bg
            opacity:1,
            transition:'opacity .42s ease-out',
            zIndex:200,
            pointerEvents:'none'
          }}
          ref={(el)=> { if (el) requestAnimationFrame(() => { el.style.opacity = '0'; }); }}
          onTransitionEnd={() => setVeil(false)}
        />
      )}
    </div>
  );
}
