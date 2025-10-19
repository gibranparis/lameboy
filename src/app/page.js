'use client';

export const dynamic = 'force-static';
export const runtime  = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useCallback } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr:false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr:false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr:false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr:false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr:false });

const HEADER_H = 86;

function useHeaderCtrlPx(defaultPx=56){
  const [px,setPx] = useState(defaultPx);
  useEffect(()=>{
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--header-ctrl') || `${defaultPx}px`;
      setPx(parseInt(v,10)||defaultPx);
    };
    read(); window.addEventListener('resize',read);
    return () => window.removeEventListener('resize',read);
  },[defaultPx]);
  return px;
}

export default function Page(){
  const ctrlPx = useHeaderCtrlPx();
  const [theme,setTheme] = useState('day');
  const [isShop,setIsShop] = useState(false);

  // keep <html> in sync
  useEffect(()=>{
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', isShop ? 'shop' : 'gate');
    if (isShop) root.setAttribute('data-shop-root',''); else root.removeAttribute('data-shop-root');
    root.style.setProperty('--header-ctrl', `${ctrlPx}px`);
  },[theme,isShop,ctrlPx]);

  // pick up theme change from toggle
  useEffect(()=>{
    const onTheme = (e)=> setTheme(e?.detail?.theme==='night' ? 'night' : 'day');
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return ()=>{ window.removeEventListener('theme-change', onTheme); document.removeEventListener('theme-change', onTheme); };
  },[]);

  const emitZoom = useCallback(()=>{
    const overlayOpen = document.body.dataset.overlay === '1';
    if (overlayOpen){
      // act as BACK while overlay is open
      try { window.dispatchEvent(new CustomEvent('lb:close-overlay')); } catch {}
      try { document.dispatchEvent(new CustomEvent('lb:close-overlay')); } catch {}
      return;
    }
    // otherwise: grid zoom ping-pong step
    try { window.dispatchEvent(new CustomEvent('lb:zoom',{ detail:{ step:1 }})); } catch {}
    try { document.dispatchEvent(new CustomEvent('lb:zoom',{ detail:{ step:1 }})); } catch {}
  },[]);

  const headerStyle = useMemo(()=>({
    position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
    display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
    padding:'0 16px', background:'transparent'
  }),[]);

  return (
    <div className="min-h-[100dvh] w-full" style={{ background:'var(--bg,#000)', color:'var(--text,#fff)' }}>
      {isShop && (
        <header role="banner" style={headerStyle}>
          {/* LEFT — ORB */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Zoom grid / Back"
              data-orb="density"
              className="orb-ring"
              style={{ width:ctrlPx, height:ctrlPx, display:'grid', placeItems:'center', borderRadius:'9999px', background:'transparent', border:0, padding:0, cursor:'pointer', lineHeight:0 }}
              onClick={emitZoom}
              onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); emitZoom(); }}}
              title="Zoom / Back"
            >
              <BlueOrbCross3D
                height={`${ctrlPx}px`}
                geomScale={1.08}
                glow
                glowScale={1.25}
                overrideGlowOpacity={0.38}
                rpm={36}
                includeZAxis
                interactive
                onActivate={emitZoom}
              />
            </button>
          </div>

          {/* CENTER — Toggle */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle id="lb-daynight" circlePx={28} trackPad={1} moonImages={['/toggle/moon-red.png','/toggle/moon-blue.png']} />
          </div>

          {/* RIGHT — Cart */}
          <div style={{ display:'grid', justifyContent:'end' }}>
            <div style={{ height:ctrlPx, width:ctrlPx, display:'grid', placeItems:'center' }}>
              <CartButton inHeader />
            </div>
          </div>
        </header>
      )}

      <main style={{ minHeight:'100dvh' }}>
        {!isShop ? (
          <div className="page-center">
            <BannedLogin onProceed={()=>setIsShop(true)} />
          </div>
        ) : (
          <div style={{ paddingTop:HEADER_H }}>
            <ShopGrid hideTopRow />
          </div>
        )}
      </main>
    </div>
  );
}
