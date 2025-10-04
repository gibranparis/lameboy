'use client';

export const dynamic = 'force-static'; // keep the /shop shell prerenderable

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 👇 add this: same component used on the banned page
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

// Lazy-load the heavy grid so it doesn't compete with the intro animation
const ShopGrid = dynamic(() => import('@/components/ShopGrid'), { ssr: false });

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
      // We set this in BannedLogin during the cascade
      const from = sessionStorage.getItem('fromCascade');
      if (from === '1') {
        // Match the Chakra cascade length so the grid mounts AFTER it completes
        const CASCADE_MS = 2400;      // keep in sync with your BannedLogin CASCADE_MS
        const PUSH_OFFSET_MS = 150;   // BannedLogin pushes ~100–150ms into the cascade
        const CUSHION_MS = 120;       // tiny breathing room so it feels smooth
        delay = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS); // ≈ 2370ms
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
      {/* ✅ Same spinner as banned page; keep it visible at the top on all phases */}
      <div className="shop-topbar">
        <BlueOrbCross3D />
      </div>

      <div className="shop-wrap">
        {phase === 'waiting' ? (
          // ✅ Use the same spinner as the placeholder while we wait
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
          background: #000; /* match banned background */
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
          pointer-events: none; /* spinner is decorative */
        }
        .shop-wrap { width: 100%; }
        .shop-waiting {
          height: 60vh;
          width: 100%;
          display: grid;
          place-items: center;
          opacity: 0.95;
          /* neutral veil; avoid extra animations so it doesn't fight the cascade */
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
