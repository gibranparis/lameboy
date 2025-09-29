'use client';

export const dynamic = 'force-static'; // keep the /shop shell prerenderable

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy-load the heavy grid so it doesn't compete with the intro animation
const ShopGrid = dynamic(() => import('@/components/ShopGrid'), { ssr: false });

// Demo data (keep/remove as you need)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopPage() {
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

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
      <div className="shop-wrap">
        {phase === 'waiting' ? (
          // Lightweight placeholder so the cascade can finish cleanly
          <div className="shop-placeholder" aria-busy="true" />
        ) : (
          <ShopGrid products={demoProducts} />
        )}
      </div>

      <style jsx>{`
        .shop-page { min-height: 100dvh; display: grid; }
        .shop-wrap { width: 100%; }
        .shop-placeholder {
          height: 60vh;
          width: 100%;
          opacity: 0.9;
          /* simple neutral veil; no animations to avoid competing with cascade */
          background: radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 70%, transparent 100%);
        }
      `}</style>
    </div>
  );
}
