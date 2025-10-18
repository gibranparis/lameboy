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
  const [isShop, setIsShop] = useState(false);  // start at banned login
  const [veil,  setVeil]    = useState(false);

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
    // also listen on document just in case
    // @ts-ignore
    document.addEventListener('theme-change', onTheme);
    return () => {
      // @ts-ignore
      window.removeEventListener('theme-change', onTheme);
      // @ts-ignore
      document.removeEventListener('theme-change', onTheme);
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

  // === CORE: CSS-var grid zoom (no events) ================================
  // Each click changes --grid-cols by ±1 and wraps in [1..5].
  // Click = zoom in (-1), Shift+Click = zoom out (+1).
  const setGridCols = useCallback((next) => {
    const root = document.documentElement;
    root.style.setProperty('--grid-cols', String(next));
    try { localStorage.setItem('lb:grid-cols', String(next)); } catch {}
  }, []);

  const getGridCols = useCallback(() => {
    const root = document.documentElement;
    const cssVal = getComputedStyle(root).getPropertyValue('--grid-cols').trim();
    const stored = (() => { try { return localStorage.getItem('lb:grid-cols'); } catch { return null; } })();
    const num = parseInt(stored ?? cssVal || '4', 10);
    if (Number.isFinite(num)) return Math.min(5, Math.max(1, num));
    return 4;
  }, []);

  // restore persisted grid cols on mount
  useEffect(() => {
    const n = getGridCols();
    setGridCols(n);
  }, [getGridCols, setGridCols]);

  const onOrbClick = useCallback((e) => {
    const delta = e?.shiftKey ? +1 : -1; // shift = zoom out, click = zoom in
    const curr = getGridCols();
    let next = curr + delta;
    if (next < 1) next = 5;       // wrap
    if (next > 5) next = 1;       // wrap
    setGridCols(next);
  }, [getGridCols, setGridCols]);

  const onProceed = () => setIsShop(true);

  const headerStyle = useMemo(() => ({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px', // breathing room so cart doesn’t hug the edge
    background:'transparent'
  }), []);

  // Sizes you can tweak (independent of --header-ctrl)
  const ORB_PX = Math.max(44, ctrlPx);       // make orb at least as big as ctrl
  const TOGGLE_KNOB_PX = Math.max(28, ctrlPx - 20);
  const TOGGLE_TRACK_PAD = 1;

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {/* SHOP HEADER */}
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT: orb button — click & keyboard activate; perfect hitbox */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Zoom grid"
              data-orb="density"                   // <- ties into globals.css circle clip/hitbox
              className="orb-ring"
              style={{
                width: ORB_PX, height: ORB_PX,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0,
                borderRadius:'9999px'
              }}
              onClick={onOrbClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOrbClick(e);
                }
              }}
              title="Zoom products"
            >
              {/* Canvas fills the square exactly — no extra padding */}
              <BlueOrbCross3D
                height={`${ORB_PX}px`}
                geomScale={1.08}      // a touch larger so it reads like the toggle
                glow
                glowScale={1.25}
                overrideGlowOpacity={0.38}
                includeZAxis
                interactive={false}   // button handles interaction; canvas is display-only
                rpm={36}
              />
            </button>
          </div>

          {/* CENTER: toggle (knob == size below), tighter track via trackPad */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle id="lb-daynight" circlePx={TOGGLE_KNOB_PX} trackPad={TOGGLE_TRACK_PAD}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart — same square for visual rhythm */}
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
            {/* Banned login gate shows first; click “Proceed” reveals shop */}
            <BannedLogin onProceed={onProceed} />
          </div>
        ) : (
          <div style={{ paddingTop: HEADER_H }}>
            {/* Grid reads --grid-cols directly from CSS; no props needed */}
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
