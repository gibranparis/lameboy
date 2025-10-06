'use client';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

import { useEffect, useMemo, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';

// NOTE: components are in src/app/components/*.jsx in your repo
import BlueOrbCross3D from './components/BlueOrbCross3D.jsx';
import CartButton from './components/CartButton.jsx';
const ShopGrid = nextDynamic(() => import('./components/ShopGrid.jsx'), { ssr: false });

const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

const CASCADE_MS = 2400;
const PUSH_OFFSET_MS = 150;
const CUSHION_MS = 120;

export default function UnifiedPage() {
  const [mode, setMode] = useState('banned'); // 'banned' | 'shop'
  const [showBands, setShowBands] = useState(false);
  const [veil, setVeil] = useState(0);
  const [cols, setCols] = useState(5);
  const [dir, setDir] = useState(-1);
  const orbWrapRef = useRef(null);
  const isShop = mode === 'shop';

  const beginCascadeToShop = () => {
    setShowBands(true);
    setVeil(1);
    setTimeout(() => setVeil(0), 40);

    const handoff = Math.max(0, CASCADE_MS - PUSH_OFFSET_MS + CUSHION_MS);
    setTimeout(() => {
      setMode('shop');
      setShowBands(false);
    }, handoff);
  };

  useEffect(() => {
    if (!isShop) return;

    if (orbWrapRef.current) {
      const s = orbWrapRef.current.style;
      s.position = 'fixed';
      s.left = '18px';
      s.top = '18px';
      s.zIndex = '120';
      s.pointerEvents = 'auto';
      s.width = '112px';
      s.height = '112px';
      s.transform = 'none';
    }

    const keep = new Set(orbWrapRef.current ? orbWrapRef.current.querySelectorAll('canvas') : []);
    document.querySelectorAll('canvas').forEach((c) => { if (!keep.has(c)) c.style.display = 'none'; });

    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');
    if (header) {
      header.querySelectorAll('canvas,[data-orb],[aria-label*="orb" i],svg[aria-label*="spinner" i],svg[aria-label*="logo" i]')
        .forEach((el) => (el.style.display = 'none'));
    }
  }, [isShop]);

  const onDensity = () => {
    setCols((c) => {
      const next = c + dir;
      if (next <= 1) { setDir(+1); return 1; }
      if (next >= 5) { setDir(-1); return 5; }
      return next;
    });
  };

  const banned = useMemo(() => (
    <div className="page-center">
      <div className="login-card vscode-card card-ultra-tight login-stack">
        <button
          className="btn-link bubble-button lameboy-glow"
          onClick={beginCascadeToShop}
          style={{ padding: '8px 14px', borderRadius: 12, fontWeight: 900 }}
        >
          ENTER
        </button>
        <span className="florida-inline florida-link">Florida, USA</span>
      </div>
    </div>
  ), []);

  const shop = useMemo(() => (
    <div data-shop-root className="min-h-[100dvh] grid">
      <div ref={orbWrapRef} data-orb="density" aria-label="Change grid density" role="button">
        <BlueOrbCross3D
          height="112px"
          rpm={14.4}
          overrideGlowOpacity={0.7}
          onActivate={onDensity}
        />
      </div>

      <div data-cart-root style={{ position: 'fixed', right: 18, top: 18, zIndex: 130, pointerEvents: 'auto' }}>
        <CartButton />
      </div>

      <div className="w-full">
        <ShopGrid products={demoProducts} cols={cols} />
      </div>
    </div>
  ), [cols]);

  return (
    <div className="min-h-[100dvh]">
      {mode === 'banned' ? banned : shop}

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
