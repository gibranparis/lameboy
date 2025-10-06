'use client';

export const dynamic = 'force-static';   // allow SSG on /
export const runtime = 'nodejs';         // keep Node runtime (no Edge)

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy bits (no SSR so they don't compete with the cascade GPU work)
const BannedLogin   = nextDynamic(() => import('@/components/BannedLogin'),   { ssr: false });
const ShopGrid      = nextDynamic(() => import('@/components/ShopGrid'),      { ssr: false });
const BlueOrbCross3D= nextDynamic(() => import('@/components/BlueOrbCross3D'),{ ssr: false });
const CartButton    = nextDynamic(() => import('@/components/CartButton'),    { ssr: false });

/**
 * Unified page:
 * 1) show gate (BannedLogin)
 * 2) BannedLogin runs cascade & sessionStorage.set('fromCascade','1') then router.push('/')
 * 3) On mount we detect that flag and flip into Shop view, keeping a brief white veil
 */
export default function Page() {
  const [mode, setMode] = useState<'gate' | 'shop'>('gate');
  const [veil, setVeil] = useState(false);
  const [cols, setCols] = useState(5); // 1..5

  // Detect post-cascade return
  useEffect(() => {
    let from = '0';
    try { from = sessionStorage.getItem('fromCascade') || '0'; } catch {}
    if (from === '1') {
      // enter shop and fade the white veil smoothly
      setMode('shop');
      setVeil(true);
      // clear immediately so refreshes go to gate again
      try { sessionStorage.removeItem('fromCascade'); } catch {}
      const t = setTimeout(() => setVeil(false), 420);
      return () => clearTimeout(t);
    }
  }, []);

  // Density orb click (+/- columns)
  const bumpCols = () =>
    setCols((c) => (c <= 1 ? 2 : c >= 5 ? 4 : c + (c < 5 ? 1 : -1)));

  // If we’ve never run the cascade on this session, start at gate
  // (BannedLogin itself will handle playing the cascade + setting the flag)
  const isShop = mode === 'shop';

  return (
    <div
      // This marker lets globals.css switch to off-white + disable black canvases.
      {...(isShop ? { 'data-shop-root': '' } : {})}
      style={{ minHeight: '100dvh', background: isShop ? '#F7F7F2' : '#000' }}
    >
      {/* Gate (banned/login) */}
      {!isShop && (
        <div>
          <BannedLogin />
        </div>
      )}

      {/* Shop view */}
      {isShop && (
        <>
          {/* Density orb — same RPM “feel” as gate but slightly smaller */}
          <div
            data-orb="density"
            aria-label="grid-density"
            style={{
              position: 'fixed',
              left: 18,
              top: 18,
              zIndex: 120,
              width: 36,
              height: 36,
              pointerEvents: 'auto',
            }}
            onClick={bumpCols}
            title="Change grid density"
          >
            <BlueOrbCross3D
              // tad smaller + same vibe
              height="36px"
              rpm={44}
              geomScale={0.9}
              glow
              glowOpacity={0.9}
              includeZAxis
            />
          </div>

          {/* Cart (single source of truth) */}
          <div style={{ position: 'fixed', right: 18, top: 18, zIndex: 130 }}>
            <CartButton />
          </div>

          {/* Product grid */}
          <ShopGrid columns={cols} />
        </>
      )}

      {/* Quick white veil after the cascade push so it feels continuous */}
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
