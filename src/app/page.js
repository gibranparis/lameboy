'use client';

export const dynamic = 'force-static';   // prerender shell
export const runtime = 'nodejs';         // opt out of Edge so SSG works

import { useEffect, useMemo, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';
import BlueOrbCross3D from './components/BlueOrbCross3D';
import CartButton from './components/CartButton';

// Lazy so grid work doesn't compete with the cascade
const ShopGrid = nextDynamic(() => import('./components/ShopGrid'), { ssr: false });

/** Demo data — swap with your real products */
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

const CASCADE_MS = 2400;     // must match your banned cascade timing
const PUSH_OFFSET_MS = 150;  // we “push” a bit into the cascade
const CUSHION_MS = 120;      // breathing room

export default function UnifiedPage() {
  /** mode: 'banned' → cascade → 'shop' (no navigation) */
  const [mode, setMode] = useState('banned'); // 'banned' | 'shop'

  /** carry-over visuals */
  const [showBands, setShowBands] = useState(false);
  const [veil, setVeil] = useState(0); // 0..1 black→white fade

  /** shop density (5 → 1 → 5) */
  const [cols, setCols] = useState(5);
  const [dir, setDir] = useState(-1);
  const orbWrapRef = useRef(null);

  const isShop = mode === 'shop';

  /** Start cascade → flip to shop (call this from the banned button) */
  const beginCascadeToShop = () => {
    // visual: show chakra bands over black
    setShowBands(true);

    // start with black veil, fade to 0 so black→white reads as one motion
    setVeil(1);
    setTimeout(() => setVeil(0), 40);

    // flip to shop slightly after the cascade “push” so it feels continuous
    const handoff = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
    setTimeout(() => {
      setMode('shop');
      setShowBands(false);
    }, handoff);
  };

  /** Keep orb pinned top-left (2×), hide stray canvases when in shop */
  useEffect(() => {
    if (!isShop) return;

    // Pin the density orb strongly
    if (orbWrapRef.current) {
      const s = orbWrapRef.current.style;
      s.position = 'fixed';
      s.left = '18px';
      s.top = '18px';
      s.zIndex = '120';
      s.pointerEvents = 'auto';
      s.width = '112px';   // 2× bigger
      s.height = '112px';
      s.transform = 'none';
    }

    // Hide any canvases NOT inside our orb (prevents ghost spinners)
    const keep = new Set(orbWrapRef.current ? orbWrapRef.current.querySelectorAll('canvas') : []);
    document.querySelectorAll('canvas').forEach((c) => { if (!keep.has(c)) c.style.display = 'none'; });

    // Neutralize header visuals on shop
    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (header) {
      header.querySelectorAll('canvas,[data-orb],[aria-label*="orb" i],svg[aria-label*="spinner" i],svg[aria-label*="logo" i]')
        .forEach((el) => (el.style.display = 'none'));
    }
  }, [isShop]);

  /** Density +/- button (orb) */
  const onDensity = () => {
    setCols((c) => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  /** Banned page content (minimum, keep your existing card if you like) */
  const banned = useMemo(() => (
    <div className="page-center">
      <div className="login-card vscode-card card-ultra-tight login-stack">
        {/* Your existing center bubble can stay here */}
        <button
          className="btn-link bubble-button lameboy-glow"
          onClick={beginCascadeToShop}
          style={{ padding: '8px 14px', borderRadius: 12, fontWeight: 900 }}
        >
          ENTER
        </button>
        <span className="florida-inline florida-link">Florida, USA</span>
      </div>

      {/* Your banned center orb/logo (optional). If you want it, put it here. */}
      {/* <BlueOrbCross3D height="120px" /> */}
    </div>
  ), []);

  /** Shop content (exact same look/behavior you wanted) */
  const shop = useMemo(() => (
    <div data-shop-root className="min-h-[100dvh] grid">
      {/* 2× ORB DENSITY BUTTON — pinned top-left */}
      <div ref={orbWrapRef} data-orb="density" aria-label="Change grid density" role="button">
        <BlueOrbCross3D
          height="112px"
          rpm={14.4}
          overrideGlowOpacity={0.7}
          onActivate={onDensity}
        />
      </div>

      {/* CART — crisp single layer, no double-looking wrapper */}
      <div data-cart-root style={{ position: 'fixed', right: 18, top: 18, zIndex: 130, pointerEvents: 'auto' }}>
        <CartButton />
      </div>

      {/* Content */}
      <div className="w-full">
        <ShopGrid products={demoProducts} cols={cols} />
      </div>
    </div>
  ), [cols]);

  return (
    <div className="min-h-[100dvh]">
      {/* MODE VIEWS */}
      {mode === 'banned' ? banned : shop}

      {/* Chakra bands shown during cascade handoff */}
      {showBands && (
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

      {/* Black → white fade veil to make it feel like ONE motion */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,                  // below orb (120) & cart (130)
          background: '#000',
          opacity: veil,
          transition: 'opacity 600ms cubic-bezier(.22,1,.36,1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
