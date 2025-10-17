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

/** Read --header-ctrl from CSS so header controls stay in sync with globals.css */
function useHeaderCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--header-ctrl') || `${defaultPx}px`;
      setPx(parseInt(v, 10) || defaultPx);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [defaultPx]);
  return px;
}

const HEADER_H  = 86;
const MIN_COLS  = 1;
const MAX_COLS  = 5;

export default function Page() {
  const ctrlPx = useHeaderCtrlPx();
  const [theme, setTheme]   = useState('day');  // 'day' | 'night'
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  /** 🔢 Grid is now controlled here */
  const [columns, setColumns] = useState(MAX_COLS);
  const [zoomDir, setZoomDir] = useState/** @type {'in'|'out'} */('in'); // 'in' = 5→1

  const stepDensity = useCallback((delta = 1) => {
    setColumns((prev) => {
      const isIn = zoomDir === 'in';
      let next = prev + (isIn ? -delta : +delta);
      if (next < MIN_COLS) { next = MIN_COLS + 1; setZoomDir('out'); }
      else if (next > MAX_COLS) { next = MAX_COLS - 1; setZoomDir('in'); }
      return next;
    });
  }, [zoomDir]);

  // Keep <html> in sync for global CSS tokens
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');
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

  // arrival veil after cascade
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  const headerStyle = useMemo(() => ({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px', background:'transparent'
  }), []);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {/* SHOP HEADER */}
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT: orb button — click or keyboard to step density */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Zoom products"
              data-orb="density"
              style={{
                width: ctrlPx, height: ctrlPx,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0
              }}
              onClick={() => stepDensity(1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stepDensity(1); }
              }}
              title="Bump product columns"
            >
              <BlueOrbCross3D
                width={`${ctrlPx}px`}
                height={`${ctrlPx}px`}
                geomScale={0.98}
                rpm={44}
                glow
                includeZAxis
                interactive={true}
                onActivate={() => stepDensity(1)} // canvas-level activation too
              />
            </button>
          </div>

          {/* CENTER: toggle (knob == ctrlPx) */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={ctrlPx}
              trackPad={8}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart — same square for rhythm */}
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
            {/* 🔗 Pass controlled columns so the grid reacts instantly */}
            <ShopGrid hideTopRow columns={columns} />
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
