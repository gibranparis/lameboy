'use client';

import { useCallback, useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import BannedLogin from '@/components/BannedLogin';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';
import CartButton from '@/components/CartButton';

const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });
const ProductOverlay = nextDynamic(() => import('@/components/ProductOverlay'), { ssr: false });

// demo data — replace when wired
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function SinglePageApp() {
  const [mode, setMode] = useState('banned');      // 'banned' | 'shop'
  const [phase, setPhase] = useState('waiting');   // 'waiting' | 'grid'
  const [cols, setCols]   = useState(5);           // 5..1..5 ring
  const [descending, setDescending] = useState(true);

  // overlay state
  const [activeProduct, setActiveProduct] = useState(null);

  // called by BannedLogin during the early white of the cascade
  const onCascadeToShop = useCallback(() => {
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setMode('shop');
  }, []);

  // Defer grid mount until the cascade finishes
  useEffect(() => {
    if (mode !== 'shop') return;
    let delay = 0;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        const CASCADE_MS = 2400, PUSH_OFFSET_MS = 150, CUSHION_MS = 120;
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
  }, [mode]);

  // +/- behavior: 5 → 4 → 3 → 2 → 1 → 2 → ... → 5
  const bumpDensity = useCallback(() => {
    setCols(c => {
      if (descending) {
        const next = c - 1;
        if (next <= 1) setDescending(false);
        return Math.max(1, next);
      } else {
        const next = c + 1;
        if (next >= 5) setDescending(true);
        return Math.min(5, next);
      }
    });
  }, [descending]);

  if (mode === 'banned') {
    return <BannedLogin onCascadeToShop={onCascadeToShop} />;
  }

  return (
    <div className="shop-page" data-shop-root data-cols={cols}>
      {/* Orb: top-left, matches Banned (rpm=44) but slightly smaller than before */}
      <button
        type="button"
        className="shop-density"
        aria-label="Change grid density"
        onClick={bumpDensity}
      >
        <BlueOrbCross3D height="9vh" rpm={44} />
      </button>

      {/* Cart button back (top-right). If your CartContext drives the badge, it’ll wire up as before. */}
      <div className="cart-fab" style={{ right: 18, top: 18, position: 'fixed', zIndex: 130 }}>
        <CartButton />
      </div>

      <div className="shop-wrap">
        {phase === 'waiting' ? (
          <div className="shop-waiting" aria-busy="true" />
        ) : (
          <ShopGrid
            products={demoProducts}
            onOpen={setActiveProduct}      // ShopGrid can call this if it supports it
          />
        )}
      </div>

      {/* Product overlay (uses your existing component) */}
      {activeProduct && (
        <ProductOverlay
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={() => setActiveProduct(null)}
        />
      )}

      {/* local style nudges */}
      <style jsx>{`
        .shop-page { min-height:100dvh; }
        .shop-wrap { width:100%; padding: 86px 24px 24px; }
        .shop-waiting {
          height: 60vh;
          width: 100%;
          display: grid;
          place-items: center;
          opacity: 0.95;
          background: radial-gradient(
            60% 60% at 50% 40%,
            rgba(0,0,0,0.06),
            rgba(0,0,0,0.02) 70%,
            transparent 100%
          );
        }
        .shop-density{
          position:fixed; left:18px; top:18px; z-index:130;
          width:56px; height:56px; padding:0; border:0; background:transparent; cursor:pointer;
        }
      `}</style>

      {/* hard-override ShopGrid columns using the dynamic value */}
      <style jsx>{`
        [data-cols="${cols}"] :global(.shop-grid){
          display:grid !important;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
          gap: var(--gap, 28px) !important;
        }
      `}</style>
    </div>
  );
}
