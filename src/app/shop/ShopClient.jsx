'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';
import CartButton from '../../components/CartButton';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

// Demo data — swap for real products when ready
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  // cascade handoff: 'waiting' → 'grid'
  const [phase, setPhase] = useState('waiting');

  // grid density controller (columns)
  const [cols, setCols] = useState(5);     // start at 5 per row
  const [dir, setDir]   = useState(-1);    // first click will go 5→4 (then to 1, then back up to 5)

  // Clicking the orb cycles 5→1→5, one step per click
  const handleDensityToggle = () => {
    setCols((c) => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  // Banned→Shop timing + small “images ready” cushion to avoid jolt
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

    const mount = () => {
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
      const t = setTimeout(mount, delay);
      return () => clearTimeout(t);
    }
    mount();
  }, []);

  return (
    <div className="min-h-[100dvh] grid">
      {/* TOP-LEFT: the SAME BlueOrbCross3D used on banned page, now acting as +/- button */}
      <div
        className="fixed left-[18px] top-[18px] z-[120]"
        style={{ pointerEvents: 'auto' }} // must be clickable
        aria-label="change grid density"
        role="button"
      >
        <BlueOrbCross3D
          height="56px"                // visible size as a button (bigger than 10vh on laptops)
          overrideGlowOpacity={0.7}
          onActivate={handleDensityToggle}   // <-- click/Enter/Space handled inside component
          // If your banned page passes custom props, copy them here to match motion exactly:
          // rpm={14.4} color="#32ffc7" glowOpacity={0.7} glowScale={1.35} includeZAxis
        />
      </div>

      {/* TOP-RIGHT: cart button (back) */}
      <div className="cart-fab" style={{ position: 'fixed', right: 18, top: 18, zIndex: 130 }}>
        <CartButton />
      </div>

      {/* CONTENT */}
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
          <ShopGrid products={demoProducts} cols={cols} />
        )}
      </div>
    </div>
  );
}
