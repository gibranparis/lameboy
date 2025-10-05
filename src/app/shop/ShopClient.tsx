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

  // Mark <html> so we can apply global overrides anywhere in the app on /shop
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.getAttribute('data-page');
    el.setAttribute('data-page', 'shop');
    return () => {
      if (prev) el.setAttribute('data-page', prev);
      else el.removeAttribute('data-page');
    };
  }, []);

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
      {/* Global /shop-only overrides that affect ANY header injected elsewhere */}
      <style jsx global>{`
        /* 1) Page background off-white, text dark */
        html[data-page="shop"] body {
          background: #F7F7F2 !important;
          color: #111 !important;
        }

        /* 2) Make any header/topbar transparent on /shop (removes black bar) */
        html[data-page="shop"] header,
        html[data-page="shop"] [role="banner"],
        html[data-page="shop"] .topbar,
        html[data-page="shop"] .navbar {
          background: transparent !important;
          box-shadow: none !important;
          border: 0 !important;
        }
        /* If utilities/classes force bg-black on descendants, null them out */
        html[data-page="shop"] header [class*="bg-black"],
        html[data-page="shop"] [role="banner"] [class*="bg-black"] {
          background-color: transparent !important;
        }

        /* 3) Hide any small spinner/canvas in the header (top-left orb) */
        html[data-page="shop"] header canvas,
        html[data-page="shop"] [role="banner"] canvas,
        html[data-page="shop"] header svg[aria-label*="spinner"],
        html[data-page="shop"] header [data-orb],
        html[data-page="shop"] header [aria-label*="orb"],
        html[data-page="shop"] [role="banner"] [data-orb] {
          display: none !important;
        }
      `}</style>

      {/* Page content */}
      <div className="min-h-[100dvh] grid">
        {/* Centered chakra spinner (only spinner visible) */}
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
