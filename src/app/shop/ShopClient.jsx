'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';
import CartButton from '../../components/CartButton';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

  // Hide any header orbs/spinners on /shop
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
    header.querySelectorAll(selectors.join(',')).forEach((el) => {
      el.setAttribute('data-hidden-by-shop', '1');
      el.style.display = 'none';
      el.style.visibility = 'hidden';
    });
  }, []);

  // Cascade handoff + wait for initial images
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

  const ORB_HEIGHT = '10vh'; // same feel as banned page

  return (
    <div className="min-h-[100dvh] grid">
      {/* Top-left chakra orb (same component; move left) */}
      <div className="fixed left-[18px] top-[18px] z-[120] pointer-events-none">
        <BlueOrbCross3D
          height={ORB_HEIGHT}
          overrideGlowOpacity={0.7}
          // If your banned page passes custom props (rpm/color/etc), copy them here.
          // rpm={14.4} color="#32ffc7" glowOpacity={0.7} glowScale={1.35} includeZAxis
        />
      </div>

      {/* Top-right cart */}
      <div className="cart-fab" style={{ position: 'fixed', right: 18, top: 18, zIndex: 130 }}>
        <CartButton />
      </div>

      <div className="w-full">
        {phase === 'waiting' ? (
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
