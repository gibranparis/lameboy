'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';
import CartButton from '../../components/CartButton';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

type Phase = 'waiting' | 'grid';

const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  const [phase, setPhase] = useState<Phase>('waiting');

  // Hide any header orbs/spinners on /shop (small left orb, etc.)
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

  // Cascade handoff: match banned timing, then also wait for initial images
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

    const mountGrid = () => {
      // wait for first batch of images (reduces jolt)
      const imgs = Array.from(document.images || []).slice(0, 12);
      if (!imgs.length) return setPhase('grid');
      let done = 0;
      const mark = () => { if (++done >= imgs.length) setPhase('grid'); };
      imgs.forEach((img) => {
        if (img.complete) return mark();
        img.addEventListener('load', mark, { once: true });
        img.addEventListener('error', mark, { once: true });
      });
    };

    if (delay > 0) {
      const t = setTimeout(mountGrid, delay);
      return () => clearTimeout(t);
    }
    mountGrid();
  }, []);

  // Use the SAME size/feel as banned page (default component height is '10vh')
  const ORB_HEIGHT = '10vh';

  return (
    <div className="min-h-[100dvh] grid">
      {/* ✅ Top-left chakra orb (same component/feel as banned page, just moved) */}
      <div className="fixed left-[18px] top-[18px] z-[120] pointer-events-none">
        <BlueOrbCross3D
          height={ORB_HEIGHT}
          overrideGlowOpacity={0.7}   // TS requirement; banned page feel
          // If banned page passes custom props (rpm/color/etc), copy them here 1:1.
          // rpm={14.4} color="#32ffc7" glowOpacity={0.7} glowScale={1.35} includeZAxis
        />
      </div>

      {/* ✅ Top-right cart (bring it back explicitly) */}
      <div className="cart-fab" style={{ position: 'fixed', right: 18, top: 18, zIndex: 130 }}>
        <CartButton />
      </div>

      <div className="w-full">
        {phase === 'waiting' ? (
          // Light veil while the cascade finishes + images settle
          <div
            className="grid h-[60vh] w-full place-items-center opacity-95"
            style={{
              backgroundImage:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.06), rgba(0,0,0,0.02) 70%, transparent 100%)',
            }}
          />
        ) : (
          <ShopGrid products={demoProducts} />
        )}
      </div>
    </div>
  );
}
