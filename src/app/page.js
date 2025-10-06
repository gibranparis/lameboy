// src/app/page.js
'use client';

import { useCallback, useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import BannedLogin from '@/components/BannedLogin';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

// Lazy things
const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });
const ProductOverlay = nextDynamic(() => import('@/components/ProductOverlay'), { ssr: false });

// Demo data (replace with real)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

const CASCADE_MS = 2400;

export default function SinglePageApp() {
  // app mode
  const [mode, setMode] = useState<'banned' | 'shop'>('banned');

  // entry gating
  const [cascading, setCascading] = useState(false); // true while the color bands/white wipe are running
  const [phase, setPhase] = useState<'waiting' | 'grid'>('waiting');

  // density control (5→1→5)
  const [cols, setCols] = useState(5);
  const [descending, setDescending] = useState(true);

  // product overlay
  const [activeProduct, setActiveProduct] = useState(null);

  // Called by BannedLogin when cascade starts
  const onCascadeToShop = useCallback(() => {
    setCascading(true);
    setMode('shop');          // flip the view, but keep the grid hidden
    setPhase('waiting');

    // hard gate until the cascade completes
    const t = setTimeout(() => {
      setPhase('grid');
      setCascading(false);
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, []);

  // +/- behavior: 5 → 4 → 3 → 2 → 1 → 2 → 3 → 4 → 5 …
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

  // --- Views ---------------------------------------------------------------
  if (mode === 'banned') {
    return <BannedLogin onCascadeToShop={onCascadeToShop} />;
  }

  return (
    <div className="shop-page" data-shop-root data-cols={cols}>
      {/* Orb density control: top-left, match banned rpm (44).
         If you want slightly smaller/larger tweak height here. */}
      <button
        type="button"
        className="shop-density"
        aria-label="Change grid density"
        onClick={bumpDensity}
      >
        <BlueOrbCross3D height="9vh" rpm={44} />
      </button>

      {/* NOTE: We DO NOT render a CartButton here to avoid duplicates.
               ShopGrid already renders the cart FAB (top-right). */}

      <div className="shop-wrap">
        {phase === 'waiting' || cascading ? (
          <div className="shop-waiting" aria-busy="true" />
        ) : (
          <ShopGrid
            products={demoProducts}
            onOpen={setActiveProduct}   // optional: only if your tiles call it
          />
        )}
      </div>

      {/* Product overlay, if you use it from grid clicks */}
      {activeProduct && (
        <ProductOverlay
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={() => setActiveProduct(null)}
        />
      )}

      {/* Minimal local nudges */}
      <style jsx>{`
        .shop-page { min-height:100dvh; }
        .shop-wrap { width:100%; padding: 86px 24px 24px; }
        .shop-waiting {
          height: 60vh; width: 100%;
          display: grid; place-items: center;
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

      {/* Force columns on the grid based on the current density */}
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
