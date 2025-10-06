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

  // Hide ANY orb/spinner/logo living inside a header/topbar on /shop
  useEffect(() => {
    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (!header) return;
    const selectors = [
      'canvas',
      '[data-orb]',
      '[aria-label*="orb" i]',
      'svg[aria-label*="spinner" i]',
      'svg[aria-label*="logo" i]',
    ];
    header.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((el) => {
      el.setAttribute('data-hidden-by-shop', '1');
      el.style.display = 'none';
      el.style.visibility = 'hidden';
    });
  }, []);

  // Match the banned->shop cascade and wait for images to settle
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

    const startGrid = () => setPhase('grid');

    if (delay > 0) {
      const t = setTimeout(startGrid, delay);
      return () => clearTimeout(t);
    }

    // if no cascade handoff, still avoid a pop: wait first batch of images
    const imgs = Array.from(document.images || []).slice(0, 12);
    if (imgs.length === 0) return startGrid();
    let done = 0;
    const mark = () => { if (++done >= imgs.length) startGrid(); };
    imgs.forEach((img) => {
      if (img.complete) return mark();
      img.addEventListener('load', mark, { once: true });
      img.addEventListener('error', mark, { once: true });
    });
  }, []);

  return (
    <div className="min-h-[100dvh] grid">
      {/* The ONLY spinner on /shop — identical component used on banned page,
          just positioned in the top-left. 
          IMPORTANT: If your banned page passes custom props (rpm/color/etc.),
          COPY THEM HERE 1:1 so speed/appearance are identical. */}
      <div id="shop-orb-left" className="fixed left-[18px] top-[18px] z-[120] pointer-events-none">
        <BlueOrbCross3D
          /* ⬇️ If banned page uses custom props, paste them here */
          /* rpm={14.4} color="#32ffc7" glowOpacity={0.7} glowScale={1.35} includeZAxis */
          overrideGlowOpacity={0.7}
          height="44px"
        />
      </div>

      {/* no centered spinner */}

      <div className="w-full">
        {phase === 'waiting' ? (
          <div
            className="grid h-[60vh] w-full place-items-center opacity-95"
            style={{
              backgroundImage:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.06), rgba(0,0,0,0.02) 70%, transparent 100%)',
            }}
          >
            {/* small echo while we wait — same component/props */}
            <BlueOrbCross3D overrideGlowOpacity={0.7} height="44px" />
          </div>
        ) : (
          <ShopGrid products={demoProducts} />
        )}
      </div>
    </div>
  );
}
