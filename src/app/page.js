// src/app/page.js
'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

const HEADER_H = 86;
const CONTROL_H = 56; // keep all three controls visually matched

export default function Page() {
  const [mode, setMode]   = useState('gate');  // 'gate' | 'shop'
  const [veil, setVeil]   = useState(false);
  const [cols, setCols]   = useState(5);
  const [theme, setTheme] = useState('day');   // 'day' | 'night'

  useEffect(() => {
    let from = '0';
    try { from = sessionStorage.getItem('fromCascade') || '0'; } catch {}
    if (from === '1') {
      setMode('shop');
      setVeil(true);
      try { sessionStorage.removeItem('fromCascade'); } catch {}
      const t = setTimeout(() => setVeil(false), 420);
      return () => clearTimeout(t);
    }
  }, []);

  const isShop = mode === 'shop';
  const bumpCols = () =>
    setCols(c => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}
      data-theme={theme}
      {...(isShop ? { 'data-shop-root': '' } : {})}
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {isShop && (
        <header
          role="banner"
          style={{
            position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
            display:'grid', gridTemplateColumns:'auto 1fr auto',
            alignItems:'center', background:'transparent', padding:'0 16px'
          }}
        >
          {/* LEFT: orb (exact 56×56 square) */}
          <div style={{ display:'flex', alignItems:'center', height:'100%' }}>
            <div
              data-orb="density"
              role="button"
              title="Toggle grid density"
              onClick={bumpCols}
              style={{
                width: CONTROL_H, height: CONTROL_H,        // 56 × 56
                display:'grid', placeItems:'center'
              }}
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                style={{ width: `${CONTROL_H}px` }}         // ensure square wrapper
                rpm={44}
                includeZAxis
                glow
                geomScale={1.05}                             // fill the square nicely
              />
            </div>
          </div>

          {/* CENTER: toggle (same height as orb) */}
          <div style={{ justifySelf:'center', display:'grid', alignItems:'center', height:'100%' }}>
            <DayNightToggle value={theme} onChange={setTheme} size={CONTROL_H} />
          </div>

          {/* RIGHT: cart silhouette */}
          <div style={{ justifySelf:'end', display:'grid', alignItems:'center', height:'100%' }}>
            <CartButton />
          </div>
        </header>
      )}

      {/* Content */}
      {!isShop ? (
        <BannedLogin
          onProceed={() => {
            try { sessionStorage.setItem('fromCascade','1'); } catch {}
            setVeil(true);
            setMode('shop');
            setTimeout(() => setVeil(false), 480);
          }}
        />
      ) : (
        <>
          <div style={{ height: HEADER_H }} />
          <div className="shop-wrap">
            <ShopGrid columns={cols} />
          </div>
        </>
      )}

      {/* Veil */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position:'fixed', inset:0, background:'#fff',
            opacity:1, transition:'opacity .42s ease-out',
            zIndex:200, pointerEvents:'none'
          }}
          ref={(el)=> el && requestAnimationFrame(() => (el.style.opacity = 0))}
        />
      )}
    </div>
  );
}
