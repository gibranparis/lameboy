// src/app/page.js
'use client';

export const dynamic = 'force-static';   // ok to SSG /
export const runtime = 'nodejs';         // keep Node runtime

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy components so GPU/cascade stays smooth
const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'),     { ssr: false });

export default function Page() {
  // 'gate' = banned/login screen; 'shop' = product grid
  const [mode, setMode] = useState('gate');
  const [veil, setVeil] = useState(false);   // quick white veil after cascade
  const [cols, setCols] = useState(5);       // 1..5 grid density

  // If we just came back from the cascade (BannedLogin sets this), enter the shop and fade the veil
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

  // Orb click: 5→4→3→2→1→2→3→4→5…
  const bumpCols = () =>
    setCols((c) => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));

  const isShop = mode === 'shop';

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}  // globals.css can key off this
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* Density orb pinned top-left (shop only) */}
      {isShop && (
        <div style={{ position: 'fixed', top: 12, left: 12, width: 88, height: 88, zIndex: 60 }}>
          <button
            aria-label="Toggle grid density"
            onClick={bumpCols}
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'pointer', zIndex: 2 }}
          />
          <BlueOrbCross3D rpm={44} glow includeZAxis />
        </div>
      )}

      {/* Cart button in shop */}
      {isShop && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 60 }}>
          <CartButton />
        </div>
      )}

      {/* Content */}
      {!isShop ? (
        <BannedLogin
          onProceed={() => {
            // Stay on the same page, flip to shop, fade veil for a continuous handoff
            try { sessionStorage.setItem('fromCascade','1'); } catch {}
            setMode('shop');
            setVeil(true);
            setTimeout(() => setVeil(false), 420);
          }}
        />
      ) : (
        <>
          {/* Spacer so the orb/cart don’t overlap the grid header row */}
          <div style={{ paddingTop: 110 }} />
          <ShopGrid columns={cols} />
        </>
      )}

      {/* White veil fade after cascade */}
      {veil && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#fff',
            opacity: 1,
            transition: 'opacity .42s ease-out',
            zIndex: 80,
            pointerEvents: 'none',
          }}
          ref={(el) => el && requestAnimationFrame(() => (el.style.opacity = 0))}
        />
      )}
    </div>
  );
}
