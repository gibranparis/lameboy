'use client';

export const dynamic = 'force-static';

import nextDynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

/* Dynamic client components */
const BannedLogin      = nextDynamic(() => import('@/components/BannedLogin'),      { ssr: false });
const ShopGrid         = nextDynamic(() => import('@/components/ShopGrid'),         { ssr: false });
const ChakraOrbButton  = nextDynamic(() => import('@/components/ChakraOrbButton'),  { ssr: false });
const CartButton       = nextDynamic(() => import('@/components/CartButton'),       { ssr: false });
const DayNightToggle   = nextDynamic(() => import('@/components/DayNightToggle'),   { ssr: false });

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

const HEADER_H = 86;

export default function Page(){
  const ctrlPx = useHeaderCtrlPx();
  const [theme, setTheme]   = useState('day');
  const [isShop, setIsShop] = useState(false);
  const [veil,  setVeil]    = useState(false);

  // header control sizes
  const TOGGLE_KNOB_PX   = 28;
  const TOGGLE_TRACK_PAD = 1;
  const ORB_PX           = 64;

  // Sync <html> attributes
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

  // Theme sync from toggle
  useEffect(() => {
    const onTheme = (e) => setTheme(e?.detail?.theme === 'night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // White veil after cascade
  useEffect(() => {
    if (!isShop) return;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  // Emit zoom/density step; also used as "back" when overlay is open
  const emitZoomStep = useCallback((step = 1, dir = 'in') => {
    try {
      const evt = new CustomEvent('lb:zoom', { detail:{ step, dir } });
      // use *document* only to avoid double listeners
      document.dispatchEvent(evt);
    } catch {}
    try {
      const evt2 = new CustomEvent('grid-density', { detail:{ step, dir } });
      document.dispatchEvent(evt2);
    } catch {}
  }, []);

  const headerStyle = useMemo(() => ({
    position:'fixed',
    inset:'0 0 auto 0',
    height:HEADER_H,
    zIndex:140,
    display:'grid',
    gridTemplateColumns:'auto 1fr auto',
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
              <ChakraOrbButton
                size={ORB_PX}
                className="orb-ring"
                // click / enter = in, right-click = out, wheel handled inside
                // also dispatches lb:zoom & grid-density
                // we still pass onActivate to be safe
                style={{ display:'grid', placeItems:'center' }}
              />
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
