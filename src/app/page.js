// src/app/page.js
'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const BannedLogin    = nextDynamic(() => import('@/components/BannedLogin'),    { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const DayNightToggle = nextDynamic(() => import('@/components/DayNightToggle'), { ssr: false });

/** Visual alignment */
const CONTROL_H      = 56;   // square for orb
const ORB_GEOM_SCALE = 1.08; // inner orb fill
const HEADER_H       = 86;

// Temporary demo products so the grid isn't empty.
// Remove when your real data is wired.
const DEMO = [
  { id: 'p1', name: 'LB Tee — Black',  price: 38, image: '/demo/demo-tee-black.jpg'  },
  { id: 'p2', name: 'LB Tee — White',  price: 38, image: '/demo/demo-tee-white.jpg'  },
  { id: 'p3', name: 'Dad Cap — Navy',  price: 32, image: '/demo/demo-cap-navy.jpg'   },
  { id: 'p4', name: 'Sticker Pack',    price: 12, image: '/demo/demo-stickers.jpg'   },
];

export default function Page() {
  const [isShop, setIsShop] = useState(false);
  const [veil, setVeil] = useState(false);

  // After cascade hop, fade the white veil away smoothly
  useEffect(() => {
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        setVeil(true);
        sessionStorage.removeItem('fromCascade');
      }
    } catch {}
  }, [isShop]);

  const onProceed = () => setIsShop(true);

  // Header orb → tell the grid to bump density (loops 1→5→1)
  const bumpDensity = () => {
    const evt = /** @type {CustomEventInit<{step:number}>} */({ detail: { step: 1 } });
    window.dispatchEvent(new CustomEvent('grid-density', evt));
  };

  return (
    <div
      data-mode={isShop ? 'shop' : 'gate'}
      {...(isShop ? { 'data-shop-root': '' } : {})}
      className="min-h-[100dvh] w-full"
      style={{ background: 'var(--bg,#000)', color: 'var(--text,#fff)' }}
    >
      {/* SHOP HEADER */}
      {isShop && (
        <header
          role="banner"
          style={{
            position:'fixed', inset:'0 0 auto 0', height:HEADER_H, zIndex:140,
            display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
            background:'transparent'
          }}
        >
          {/* LEFT: interactive orb (tight square) */}
          <div style={{ display:'grid', justifyContent:'start' }}>
            <button
              type="button"
              aria-label="Grid density +1"
              onClick={bumpDensity}
              style={{
                width: CONTROL_H, height: CONTROL_H,
                padding:0, margin:0, background:'transparent', border:0,
                display:'grid', placeItems:'center', cursor:'pointer', lineHeight:0
              }}
              title="Add a column (loops 1–5)"
              data-orb="density"
            >
              <BlueOrbCross3D
                height={`${CONTROL_H}px`}
                rpm={44}
                includeZAxis
                glow
                geomScale={ORB_GEOM_SCALE}
                interactive={false} // wrapper handles click
              />
            </button>
          </div>

          {/* CENTER: day/night toggle (uncontrolled; it manages html[data-theme]) */}
          <div style={{ display:'grid', placeItems:'center' }}>
            <DayNightToggle />
          </div>

          {/* RIGHT: (intentionally empty)
              We removed the header CartButton to avoid duplicates.
              ShopGrid already renders its own cart control. */}
          <div />
        </header>
      )}

      {/* PAGES */}
      <main style={{ minHeight:'100dvh' }}>
        {!isShop ? (
          <div className="page-center">
            <BannedLogin onProceed={onProceed} />
          </div>
        ) : (
          <div style={{ paddingTop: HEADER_H }}>
            <ShopGrid products={DEMO} />
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
