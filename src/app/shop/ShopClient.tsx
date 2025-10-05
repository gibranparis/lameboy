'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';

// Lazy-load the heavy grid so it doesn't compete with the intro animation
const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

type Phase = 'waiting' | 'grid';

// Demo data (keep/remove as you need)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  const [phase, setPhase] = useState<Phase>('waiting');

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
    <>
      {/* 
        HIDE the small site orb/logo that lives in the top-left (header) 
        ONLY on /shop, without touching your header code.
        - If your header gives that icon an id or data-attr (e.g., #site-orb or [data-orb="site"]),
          this CSS will hide it when [data-page="shop"] is present (we added that in page.js).
        - If your header uses a different selector, replace the two selectors below to match.
      */}
      <style jsx global>{`
        [data-page="shop"] #site-orb,
        [data-page="shop"] [data-orb="site"] { display: none !important; }
      `}</style>

      <div className="min-h-[100dvh] grid bg-[#F7F7F2] text-black">
        {/* Centered chakra spinner (BlueOrbCross3D) */}
        <div className="sticky top-3 z-20 flex items-center justify-center py-3 pointer-events-none">
          <BlueOrbCross3D overrideGlowOpacity={0.7} />
        </div>

        <div className="w-full">
          {phase === 'waiting' ? (
            <div
              className="grid h-[60vh] w-full place-items-center opacity-95
                         bg-[radial-gradient(60%_60%_at_50%_40%,rgba(0,0,0,0.06),rgba(0,0,0,0.02)_70%,transparent_100%)]"
            >
              <BlueOrbCross3D overrideGlowOpacity={0.7} />
            </div>
          ) : (
            <ShopGrid products={demoProducts} />
          )}
        </div>
      </div>
    </>
  );
}
