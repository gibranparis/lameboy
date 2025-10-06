'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';
import CartButton from '../../components/CartButton';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

// Demo data (replace with real products later)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  // grid density
  const [cols, setCols] = useState(5);
  const [dir, setDir] = useState(-1); // 5→4→3→2→1 then flip to +1

  // phasing
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'
  const [showCarryCascade, setShowCarryCascade] = useState(false);

  const orbWrapRef = useRef(null);

  // Clicking the orb cycles density 5→1→5
  const handleDensityToggle = () => {
    setCols((c) => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  // Hide any header or stray canvases (keep only our density orb)
  useEffect(() => {
    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (header) {
      header.querySelectorAll('canvas,[data-orb],[aria-label*="orb" i],svg[aria-label*="spinner" i],svg[aria-label*="logo" i]')
        .forEach((el) => (el.style.display = 'none'));
    }
    // Keep ONLY the canvas inside our orb wrapper, hide all other canvases on /shop
    const keep = new Set(orbWrapRef.current ? orbWrapRef.current.querySelectorAll('canvas') : []);
    document.querySelectorAll('canvas').forEach((c) => {
      if (!keep.has(c)) c.style.display = 'none';
    });
  }, []);

  // Cascade handoff: match banned timing and optionally show a brief carry-over overlay
  useEffect(() => {
    let delay = 0;
    let showCarry = false;

    try {
      const from = sessionStorage.getItem('fromCascade');
      if (from === '1') {
        const CASCADE_MS = 2400;
        const PUSH_OFFSET_MS = 150;
        const CUSHION_MS = 120;
        delay = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
        showCarry = true;
      }
    } catch {}

    if (showCarry) {
      setShowCarryCascade(true);
      // auto-hide carry overlay a bit before we mount grid to feel continuous
      const tCarry = setTimeout(() => setShowCarryCascade(false), Math.max(600, delay - 300));
      const tDone = setTimeout(() => setShowCarryCascade(false), delay + 200);
      return () => { clearTimeout(tCarry); clearTimeout(tDone); };
    }
  }, []);

  // Mount grid after delay + initial images are ready (reduces pop-in)
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

  return (
    <div className="min-h-[100dvh] grid">
      {/* TOP-LEFT ORB — exact same component as banned; now a +/- density button */}
      <div
        ref={orbWrapRef}
        data-orb="density"
        className="fixed z-[120]"
        style={{ left: 18, top: 18, pointerEvents: 'auto', width: 56, height: 56 }}
        aria-label="Change grid density"
        role="button"
      >
        <BlueOrbCross3D
          height="56px"
          overrideGlowOpacity={0.7}
          onActivate={handleDensityToggle}
          // If your banned page uses custom motion/colors, copy the same props here:
          // rpm={14.4} color="#32ffc7" glowOpacity={0.7} glowScale={1.35} includeZAxis
        />
      </div>

      {/* TOP-RIGHT CART — ensure crisp layering (solid backdrop + GPU promote) */}
      <div
        className="cart-fab"
        style={{
          position: 'fixed',
          right: 18,
          top: 18,
          zIndex: 130,
          background: '#ffffffE6',     // semi-solid to prevent see-through artifacts
          willChange: 'transform',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        <CartButton />
      </div>

      {/* OPTIONAL carry-over chakra overlay for smoother perceived transition */}
      {showCarryCascade && (
        <div
          className="chakra-overlay"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        >
          <span className="chakra-band band-7 chakra-crown" />
          <span className="chakra-band band-6 chakra-thirdeye" />
          <span className="chakra-band band-5 chakra-throat" />
          <span className="chakra-band band-4 chakra-heart" />
          <span className="chakra-band band-3 chakra-plexus" />
          <span className="chakra-band band-2 chakra-sacral" />
          <span className="chakra-band band-1 chakra-root" />
        </div>
      )}

      {/* CONTENT */}
      <div className="w-full">
        {phase === 'waiting' ? (
          <div
            className="grid h-[52vh] w-full place-items-center opacity-95"
            style={{
              backgroundImage:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.06), rgba(0,0,0,0.02) 70%, transparent 100%)',
              willChange: 'opacity, transform',
              transform: 'translateZ(0)',
            }}
          />
        ) : (
          <ShopGrid products={demoProducts} cols={cols} />
        )}
      </div>
    </div>
  );
}
