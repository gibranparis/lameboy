// src/app/shop/page.js
'use client';

export const dynamic = 'force-static';   // allow SSG
export const runtime = 'nodejs';         // avoid Edge so SSG works

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// use the same orb component as Banned page
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
// keep the grid lightweight until after the cascade finishes
const ShopGrid = dynamic(() => import('@/components/ShopGrid'), { ssr: false });

// (demo) products; replace with your real data source when ready
const demoProducts = [
  { id: 'tee-01',  name: 'TEE 01',  price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02',  name: 'TEE 02',  price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopPage() {
  // grid density: 1..5 columns (orb click cycles 5 → 1 → …)
  const [cols, setCols] = useState(3);
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

  // smooth handoff from the banned-page cascade
  useEffect(() => {
    let delay = 0;
    try {
      const from = sessionStorage.getItem('fromCascade');
      if (from === '1') {
        const CASCADE_MS = 2400;
        const PUSH_OFFSET_MS = 150;
        const CUSHION_MS = 120;
        delay = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
      }
    } catch {}

    if (delay > 0) {
      const t = setTimeout(() => {
        try { sessionStorage.removeItem('fromCascade'); } catch {}
        setPhase('grid');
      }, delay);
      return () => clearTimeout(t);
    }
    setPhase('grid');
  }, []);

  // orb click: cycle 5 → 1 and back up to 5 (one step per click)
  const bumpDensity = () => {
    setCols((c) => (c <= 1 ? 5 : c - 1)); // 5..1..5 (minus for “tighten” feel)
  };

  // build CSS custom prop for grid columns; ShopGrid respects --tile via CSS,
  // but we can “hint” density using a data-attr if your grid reads it
  const gridProps = {
    'data-cols': cols,
  };

  return (
    // data-shop-root triggers your globals.css “shop mode” (off-white bg, etc.)
    <div data-shop-root className="shop-page">
      {/* Top-left orb (2× bigger, same rpm as banned page) */}
      <div
        aria-label="density-orb"
        style={{
          position: 'fixed',
          left: 18,
          top: 18,
          zIndex: 110,
          width: 72,        // visual box; Canvas is responsive inside
          height: 72,       // ~2× the earlier size
          pointerEvents: 'auto',
        }}
      >
        <BlueOrbCross3D
          rpm={44}                // same speed as BannedLogin
          height="72px"
          geomScale={1.9}         // make the cross itself larger
          glow
          includeZAxis
          onActivate={bumpDensity}
        />
      </div>

      {/* Wrap: leaves space so fixed controls don’t overlap first row */}
      <div className="shop-wrap">
        {phase === 'waiting' ? (
          // light veil while cascade finishes—no heavy DOM/3D
          <div
            className="shop-waiting"
            style={{
              height: '50vh',
              display: 'grid',
              placeItems: 'center',
              background:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.06), rgba(0,0,0,0.02) 70%, transparent 100%)',
            }}
            aria-busy="true"
          />
        ) : (
          // pass density hint; your ShopGrid can read data-cols to adjust tiles
          <div {...gridProps}>
            <ShopGrid products={demoProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
