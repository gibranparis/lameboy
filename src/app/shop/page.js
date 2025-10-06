'use client';

export const dynamic = 'force-static';   // SSG ok
export const runtime = 'nodejs';         // avoid Edge so SSG stays enabled

import nextDynamic from 'next/dynamic';  // ⬅️ alias to avoid name collision
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

// Lazy-load the heavy grid so it doesn’t fight the cascade
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });

// demo data (remove when wired to real data)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopPage() {
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

  useEffect(() => {
    // if we came from the banned cascade, let it finish before mounting the grid
    let delay = 0;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        const CASCADE_MS = 2400;
        const PUSH_OFFSET_MS = 150; // pushed early during cascade
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

  return (
    <div className="shop-page" data-shop-root>
      {/* density / +/- orb (same component as banned page) */}
      <button
        type="button"
        className="shop-density"
        aria-label="Change grid density"
        // wire your +/- handler here
      >
        <BlueOrbCross3D height="7vh" />
      </button>

      <div className="shop-wrap">
        {phase === 'waiting' ? (
          <div className="shop-waiting" aria-busy="true" />
        ) : (
          <ShopGrid products={demoProducts} />
        )}
      </div>

      <style jsx>{`
        .shop-page { min-height:100dvh; }
        .shop-wrap { width:100%; padding: 86px 24px 24px; }
        .shop-waiting {
          height: 60vh;
          width: 100%;
          display: grid;
          place-items: center;
          opacity: 0.95;
          background: radial-gradient(
            60% 60% at 50% 40%,
            rgba(0,0,0,0.06),
            rgba(0,0,0,0.02) 70%,
            transparent 100%
          );
        }
        /* position the orb top-left and make it bigger (2×) */
        .shop-density {
          position: fixed;
          left: 18px;
          top: 18px;
          width: 56px;      /* bigger */
          height: 56px;     /* bigger */
          padding: 0;
          border: none;
          background: transparent;
          z-index: 120;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
