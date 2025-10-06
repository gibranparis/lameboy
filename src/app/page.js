'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import { useEffect, useMemo, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';

// Your components live in src/components
import BannedLogin from '@/components/BannedLogin.jsx';
import BlueOrbCross3D from '@/components/BlueOrbCross3D.jsx';
import CartButton from '@/components/CartButton.jsx';
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid.jsx'), { ssr: false });

// Demo data – swap with real products
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

const CASCADE_MS = 2400;
const PUSH_OFFSET_MS = 150;
const CUSHION_MS = 120;

export default function UnifiedPage() {
  // 'banned' → cascade → 'shop' (same URL; no route change)
  const [mode, setMode] = useState<'banned' | 'shop'>('banned');
  const [showBands, setShowBands] = useState(false);
  const [veil, setVeil] = useState(0);

  // grid density 5 → 1 → 5 (via orb)
  const [cols, setCols] = useState(5);
  const [dir, setDir] = useState(-1);
  const orbWrapRef = useRef<HTMLDivElement | null>(null);
  const isShop = mode === 'shop';

  // Called by the banned screen when user proceeds
  const beginCascadeToShop = () => {
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setShowBands(true);
    setVeil(1);
    setTimeout(() => setVeil(0), 40);

    const handoff = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
    setTimeout(() => {
      setMode('shop');
      setShowBands(false);
    }, handoff);
  };

  // Pin orb; hide stray canvases/spinners in header on shop
  useEffect(() => {
    if (!isShop) return;

    if (orbWrapRef.current) {
      const s = orbWrapRef.current.style;
      s.position = 'fixed';
      s.left = '18px';
      s.top = '18px';
      s.zIndex = '120';
      s.pointerEvents = 'auto';
      s.width = '112px'; // 2× bigger
      s.height = '112px';
      s.transform = 'none';
    }

    const keep = new Set(orbWrapRef.current ? orbWrapRef.current.querySelectorAll('canvas') : []);
    document.querySelectorAll('canvas').forEach((c) => { if (!keep.has(c)) c.style.display = 'none'; });

    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (header) {
      header.querySelectorAll('canvas,[data-orb],[aria-label*="orb" i],svg[aria-label*="spinner" i],svg[aria-label*="logo" i]')
        .forEach((el) => (el as HTMLElement).style.display = 'none');
    }
  }, [isShop]);

  // Orb +/- density
  const onDensity = () => {
    setCols((c) => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  const banned = useMemo(() => (
    <BannedLogin onProceed={beginCascadeToShop} />
  ), []);

  const shop = useMemo(() => (
    <div data-shop-root className="min-h-[100dvh] grid">
      {/* 2× density orb, pinned top-left */}
      <div ref={orbWrapRef} data-orb="density" aria-label="Change grid density" role="button">
        <BlueOrbCross3D
          height="112px"
          rpm={14.4}
          overrideGlowOpacity={0.7}
          onActivate={onDensity}
        />
      </div>

      {/* Cart (single, crisp layer) */}
      <div data-cart-root style={{ position: 'fixed', right: 18, top: 18, zIndex: 130, pointerEvents: 'auto' }}>
        <CartButton />
      </div>

      {/* Grid */}
      <div className="w-full">
        <ShopGrid products={demoProducts} cols={cols} />
      </div>
    </div>
  ), [cols]);

  return (
    <div className="min-h-[100dvh]">
      {mode === 'banned' ? banned : shop}

      {/* Chakra bands bridge the feel during handoff */}
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

      {/* Black → white veil so it reads as ONE motion */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: '#000',
          opacity: veil,
          transition: 'opacity 600ms cubic-bezier(.22,1,.36,1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
