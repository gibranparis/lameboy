'use client';

export const dynamic = 'force-static';       // allow SSG
export const runtime = 'nodejs';             // ⬅️ opt this page out of Edge so SSG works

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

// Lazy-load the heavy grid so it doesn't compete with the intro animation
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });

// Demo data (keep/remove as you need)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopPage() {
  const [phase, setPhase] = useState<'waiting' | 'grid'>('waiting');

  useEffect(() => {
    let delay = 0;
    try {
      const from = sessionStorage.getItem('fromCascade');
      if (from === '1') {
        const CASCADE_MS = 2400;    // keep in sync with BannedLogin
        const PUSH_OFFSET_MS = 150; // BannedLogin pushes ~100–150ms into the cascade
        const CUSHION_MS = 120;     // tiny breathing room so it feels smooth
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
    <div className="shop-page">
      {/* Same spinner used on the banned page */}
      <div className="shop-topbar">
        <BlueOrbCross3D />
      </div>

      <div className="shop-wrap">
        {phase === 'waiting' ? (
          <div className="shop-waiting">
            <BlueOrbCross3D />
          </div>
        ) : (
          <ShopGrid products={demoProducts} />
        )}
      </div>

      <style jsx>{`
        .shop-page {
          min-height: 100dvh;
          display: grid;
          background: #000;
          color: #fff;
        }
        .shop-topbar {
          position: sticky;
          top: 12px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0;
          pointer-events: none;
        }
        .shop-wrap { width: 100%; }
        .shop-waiting {
          height: 60vh;
          width: 100%;
          display: grid;
          place-items: center;
          opacity: 0.95;
          background: radial-gradient(
            60% 60% at 50% 40%,
            rgba(255,255,255,0.18),
            rgba(255,255,255,0.06) 70%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  );
}
