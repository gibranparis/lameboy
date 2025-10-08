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

export default function Page() {
  const [mode, setMode] = useState('gate');   // 'gate' | 'shop'
  const [veil, setVeil] = useState(false);
  const [cols, setCols] = useState(5);
  const [theme, setTheme] = useState('day');  // 'day' | 'night'

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
  const bumpCols = () => setCols(c => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}
      data-theme={theme}
      {...(isShop ? { 'data-shop-root': '' } : {})}
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* Fixed LEFT orb – outside header so CSS never hides it */}
      {isShop && (
        <div
          data-orb="density"
          style={{
            position:'fixed', left:18, top:18, zIndex:120,
            width:88, height:88, pointerEvents:'auto'
          }}
          title="Toggle grid density"
          onClick={bumpCols}
        >
          <BlueOrbCross3D rpm={44} glow includeZAxis />
        </div>
      )}

      {/* Fixed header — centered toggle via 3-col grid */}
      {isShop && (
        <header
          role="banner"
          style={{
            position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
            display:'grid', gridTemplateColumns:'1fr auto 1fr',
            alignItems:'center', background:'transparent', padding:'0 16px'
          }}
        >
          {/* left slot kept empty; orb is separate fixed element */}
          <div />
          {/* center slot: Day/Night toggle */}
          <div style={{ justifySelf:'center' }}>
            <DayNightToggle value={theme} onChange={setTheme} size={112} />
          </div>
          {/* right slot: cart */}
          <div style={{ justifySelf:'end', display:'flex', alignItems:'center', gap:12 }}>
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
          {/* spacer for fixed header */}
          <div style={{ height: HEADER_H }} />
          {/* NOTE: .shop-wrap is transparent in CSS so wrapper drives color */}
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
