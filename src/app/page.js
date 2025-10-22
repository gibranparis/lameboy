'use client';

export const dynamic = 'force-static';
// NOTE: If you previously had `export const runtime = 'nodejs'`, it’s intentionally removed here.

/* Imports */
import nextDynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useCallback } from 'react';

/* Dynamic client components (no SSR) */
const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

/* Simple, in-file ErrorBoundary (no new files) */
import React from 'react';
class PageErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ try{ console.error('[page.js] runtime error:', error, info); } catch {} }
  render(){
    if(!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:'100dvh',display:'grid',placeItems:'center',background:'#000',color:'#fff',padding:'24px'}}>
        <div style={{textAlign:'center',maxWidth:640,opacity:.9}}>
          <div style={{fontWeight:900,letterSpacing:'.06em',marginBottom:8}}>LAMEBOY</div>
          <div style={{marginBottom:12}}>Something hiccuped while loading the UI.</div>
          <div style={{fontSize:12,opacity:.75}}>Open the browser console for details. The app will keep trying to render.</div>
        </div>
      </div>
    );
  }
}

/* Read --header-ctrl safely */
function useHeaderCtrlPx(defaultPx = 56) {
  const [px, setPx] = useState(defaultPx);
  useEffect(() => {
    const read = () => {
      try {
        const root = typeof document !== 'undefined' ? document.documentElement : null;
        const v = root ? getComputedStyle(root).getPropertyValue('--header-ctrl') : `${defaultPx}px`;
        const n = parseInt(String(v).trim().replace('px',''), 10);
        setPx(Number.isFinite(n) ? n : defaultPx);
      } catch { setPx(defaultPx); }
    };
    read();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', read);
      return () => window.removeEventListener('resize', read);
    }
  }, [defaultPx]);
  return px;
}

const HEADER_H = 86;

export default function Page(){
  const ctrlPx = useHeaderCtrlPx();
  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // Header sizing
  const TOGGLE_KNOB_PX   = 28;
  const TOGGLE_TRACK_PAD = 1;
  const ORB_PX           = 64;

  // Sync <html> attributes, default 5-per-row
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
      if (isShop) {
        root.setAttribute('data-shop-root','');
        if (!root.style.getPropertyValue('--grid-cols')) {
          root.style.setProperty('--grid-cols','5');
        }
      } else {
        root.removeAttribute('data-shop-root');
      }
      root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
    } catch {}
  }, [theme, isShop, ctrlPx]);

  // Listen for theme-change from toggle
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    try {
      window.addEventListener('theme-change', onTheme);
      document.addEventListener('theme-change', onTheme);
      return () => {
        window.removeEventListener('theme-change', onTheme);
        document.removeEventListener('theme-change', onTheme);
      };
    } catch { return () => {}; }
  }, []);

  // White veil after cascade
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  // Orb event emitter — document only (avoids double-steps)
  const emitZoomStep = useCallback((step = 1) => {
    try {
      const evt = new CustomEvent('lb:zoom', { detail:{ step } });
      document.dispatchEvent(evt);
    } catch {}
  }, []);

  const headerStyle = useMemo(() => ({
    position:'fixed',
    inset:'0 0 auto 0',
    height:HEADER_H,
    zIndex:140,
    display:'grid',
    gridTemplateColumns:'1fr auto 1fr',
    alignItems:'center',
    padding:'0 16px',
    background:'transparent',
  }), []);

  return (
    <PageErrorBoundary>
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
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitZoomStep(1); } }}
                title="Zoom products / Back from item view"
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
                />
              </button>
            </div>

            {/* CENTER: day/night toggle */}
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
            ref={(el)=> { if (el) requestAnimationFrame(() => { el.style.opacity = '0'; }); }}
            onTransitionEnd={() => setVeil(false)}
          />
        )}
      </div>
    </PageErrorBoundary>
  );
}
