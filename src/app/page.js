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

const HEADER_H = 86;           // visual header height (matches .shop-wrap padding)
const TOGGLE_SIZE = 110;       // DayNightToggle size prop (width); height ≈ 0.48 * size

export default function Page() {
  const [mode, setMode] = useState('gate'); // 'gate' | 'shop'
  const [veil, setVeil] = useState(false);
  const [cols, setCols] = useState(5);
  const [theme, setTheme] = useState('day'); // 'day' | 'night'

  // If we just arrived from cascade, enter shop and fade veil
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

  const bumpCols = () => setCols(c => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));
  const isShop = mode === 'shop';

  const toggleH = Math.round(TOGGLE_SIZE * 0.48);
  const toggleTop = Math.round((HEADER_H - toggleH) / 2);

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
            position:'fixed', inset:'0 0 auto 0', height: HEADER_H, zIndex: 140,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 16px', background:'transparent'
          }}
        >
          {/* Left: density orb */}
          <div style={{ position:'relative', width:88, height:88 }}>
            <button
              aria-label="Toggle grid density"
              onClick={bumpCols}
              style={{ position:'absolute', inset:0, border:'none', background:'transparent', cursor:'pointer', zIndex:2 }}
            />
            <BlueOrbCross3D rpm={44} glow includeZAxis />
          </div>

          {/* Right: cart + centered toggle */}
          <div style={{ position:'relative', height:'100%', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative', zIndex:130 }}>
              <CartButton />
            </div>
            <div style={{ position:'relative', width:TOGGLE_SIZE, height:toggleH, top:0 }}>
              <div style={{ position:'absolute', top:toggleTop, right:0 }}>
                <DayNightToggle value={theme} onChange={setTheme} size={TOGGLE_SIZE} />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      {!isShop ? (
        <BannedLogin
          onProceed={() => {
            try { sessionStorage.setItem('fromCascade','1'); } catch {}
            setVeil(true);      // white veil first (avoids black flash)
            setMode('shop');    // then flip to shop
            setTimeout(() => setVeil(false), 480);
          }}
        />
      ) : (
        <>
          {/* leave headroom for fixed header */}
          <div style={{ height: HEADER_H }} />
          <div className="shop-wrap">
            <ShopGrid columns={cols} />
          </div>
        </>
      )}

      {/* White veil */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, background: '#fff',
            opacity: 1, transition: 'opacity .42s ease-out',
            zIndex: 200, pointerEvents: 'none',
          }}
          ref={(el) => el && requestAnimationFrame(() => (el.style.opacity = 0))}
        />
      )}
    </div>
  );
}
