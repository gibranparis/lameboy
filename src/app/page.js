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

const HEADER_H = 86;

export default function Page() {
  const ctrlPx = useHeaderCtrlPx();
  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false); // ⬅️ start at the banned login gate
  const [veil,  setVeil]    = useState(false);

  // Sizes
  const TOGGLE_KNOB_PX   = 28; // change to taste
  const TOGGLE_TRACK_PAD = 1;  // slimmer pill around the knob
  const ORB_PX           = 64; // chakra orb size in header

  // keep <html> in sync
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root', '');
    else root.removeAttribute('data-shop-root');
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
  }, [theme, isShop, ctrlPx]);

  // pick up theme-change from toggle
  useEffect(() => {
    /** @param {CustomEvent<{theme:'day'|'night'}>} e */
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  // ====== ZOOM EMIT (single event type; fire on both window & document) ======
  const emitZoomStep = useCallback((step = 1) => {
    const detail = { step };
    const evt = new CustomEvent('lb:zoom', { detail });
    try { window.dispatchEvent(evt); } catch {}
    try { document.dispatchEvent(evt); } catch {}
  }, []);

  const headerStyle = useMemo(() => ({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px', background:'transparent'
  }), []);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT: orb */}
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
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitZoomStep(1); }
              }}
              title="Zoom products"
            >
              <BlueOrbCross3D
                height={`${ORB_PX}px`}
                geomScale={1.08}
                glow
                glowScale={1.25}
                overrideGlowOpacity={0.38}
                rpm={36}
                includeZAxis
                interactive
                onActivate={() => emitZoomStep(1)}
              />
            </button>
          </div>

          {/* CENTER: toggle */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle
              id="lb-daynight"
              circlePx={TOGGLE_KNOB_PX}
              trackPad={TOGGLE_TRACK_PAD}
              moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']}
            />
          </div>

          {/* RIGHT: cart */}
          <div style={{ display:'grid', justifyContent:'end' }}>
            <div style={{ height: ctrlPx, width: ctrlPx, display:'grid', placeItems:'center' }}>
              <CartButton inHeader />
            </div>
          </div>
        </header>
      )}

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
