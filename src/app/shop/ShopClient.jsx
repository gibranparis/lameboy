'use client';

import nextDynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import BlueOrbCross3D from '../../components/BlueOrbCross3D';
import CartButton from '../../components/CartButton';

const ShopGrid = nextDynamic(() => import('../../components/ShopGrid'), { ssr: false });

// Demo data – swap out later
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopClient() {
  // ===== Grid density 5 → 1 → 5
  const [cols, setCols] = useState(5);
  const [dir, setDir] = useState(-1);
  const handleDensityToggle = () => {
    setCols(c => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  // ===== Phases & carry-over effects
  const [phase, setPhase] = useState('waiting'); // waiting | grid
  const [showCarry, setShowCarry] = useState(false); // chakra bands
  const [veil, setVeil] = useState(0);              // 0..1 black→white fade
  const orbWrapRef = useRef(null);

  // Kill stray header orbs/spinners; keep only our density orb
  useEffect(() => {
    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (header) {
      header
        .querySelectorAll('canvas,[data-orb],[aria-label*="orb" i],svg[aria-label*="spinner" i],svg[aria-label*="logo" i]')
        .forEach(el => (el.style.display = 'none'));
    }
    const keep = new Set(orbWrapRef.current ? orbWrapRef.current.querySelectorAll('canvas') : []);
    document.querySelectorAll('canvas').forEach(c => { if (!keep.has(c)) c.style.display = 'none'; });

    // Hard pin the density orb
    if (orbWrapRef.current) {
      const s = orbWrapRef.current.style;
      s.position = 'fixed';
      s.left = '18px';
      s.top = '18px';
      s.zIndex = '120';
      s.pointerEvents = 'auto';
      // 2× bigger orb
      s.width = '112px';
      s.height = '112px';
      s.transform = 'none';
    }
  }, []);

  // Cascade timing + carry overlay + black→white fade veil
  useEffect(() => {
    let delay = 0;
    let fromCascade = false;
    try {
      const from = sessionStorage.getItem('fromCascade');
      if (from === '1') {
        fromCascade = true;
        const CASCADE_MS = 2400;
        const PUSH_OFFSET_MS = 150;
        const CUSHION_MS = 120;
        delay = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
      }
    } catch {}

    if (fromCascade) {
      // show chakra bands briefly so the color flow reads
      setShowCarry(true);
      // start with a black veil and fade it out smoothly to white/off-white
      setVeil(1); // fully black
      // fade veil -> 0 over ~600ms
      const v1 = setTimeout(() => setVeil(0), 40);
      const carryHideAt = Math.max(600, delay - 300);
      const t1 = setTimeout(() => setShowCarry(false), carryHideAt);
      const t2 = setTimeout(() => setShowCarry(false), delay + 200);
      return () => { clearTimeout(v1); clearTimeout(t1); clearTimeout(t2); };
    } else {
      // No banned cascade: no veil
      setVeil(0);
    }
  }, []);

  // Mount grid after delay + initial images
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
      imgs.forEach(img => {
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
      {/* 2× ORB DENSITY BUTTON — pinned top-left */}
      <div ref={orbWrapRef} data-orb="density" aria-label="Change grid density" role="button">
        <BlueOrbCross3D
          height="112px"            // 2× larger
          rpm={14.4}
          overrideGlowOpacity={0.7}
          onActivate={handleDensityToggle}
          // If banned page uses custom colors/glowScale, copy them here.
        />
      </div>

      {/* CART — single, crisp layer (no double-looking wrapper) */}
      <div
        data-cart-root
        style={{
          position: 'fixed',
          right: 18,
          top: 18,
          zIndex: 130,
          pointerEvents: 'auto',
        }}
      >
        <CartButton />
      </div>

      {/* carry-over chakra overlay to bridge the feel */}
      {showCarry && (
        <div className="chakra-overlay" aria-hidden="true" style={{ pointerEvents: 'none' }}>
          <span className="chakra-band band-7 chakra-crown" />
          <span className="chakra-band band-6 chakra-thirdeye" />
          <span className="chakra-band band-5 chakra-throat" />
          <span className="chakra-band band-4 chakra-heart" />
          <span className="chakra-band band-3 chakra-plexus" />
          <span className="chakra-band band-2 chakra-sacral" />
          <span className="chakra-band band-1 chakra-root" />
        </div>
      )}

      {/* black→white fade veil for a fluent page color transition */}
      {/* It sits above the page, fades out quickly when arriving from banned */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110, // above content but below cart/orb (which are 120/130)
          background: '#000',
          opacity: veil,
          transition: 'opacity 600ms cubic-bezier(.22,1,.36,1)',
          pointerEvents: 'none',
        }}
      />

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
