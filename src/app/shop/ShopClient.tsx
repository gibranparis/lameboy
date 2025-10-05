'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

type Phase = 'waiting' | 'grid';

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

  return (
    <>
      {/* /shop-only global overrides */}
      <style jsx global>{`
        /* Make the header transparent on /shop (kills the black bar) */
        [data-page="shop"] header {
          background: transparent !important;
          box-shadow: none !important;
        }
        /* If your header has nested elements with bg-black utility, zero them out */
        [data-page="shop"] header [class*="bg-black"] {
          background-color: transparent !important;
        }
        /* Hide any small spinner/canvas living in the header (left orb) */
        [data-page="shop"] header canvas,
        [data-page="shop"] header svg[aria-label*="spinner"],
        [data-page="shop"] header [data-orb],
        [data-page="shop"] header [aria-label*="orb"] {
          display: none !important;
        }
      `}</style>

      {/* Off-white page background */}
      <div className="min-h-[100dvh] grid bg-[#F7F7F2] text-black">
        {/* Centered chakra spinner (this is the only spinner visible now) */}
        <div className="sticky top-3 z-20 flex items-center justify-center py-3 pointer-events-none">
          <BlueOrbCross3D overrideGlowOpacity={0.7} />
        </div>

        <div className="w-full">
          {phase === 'waiting' ? (
            <div
              className="grid h-[60vh] w-full place-items-center opacity-95"
              style={{
                backgroundImage:
                  'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.06), rgba(0,0,0,0.02) 70%, transparent 100%)',
              }}
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
