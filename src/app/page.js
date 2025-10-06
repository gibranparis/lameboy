// src/app/page.js
'use client';

export const runtime = 'nodejs';       // avoid Edge so SSG works
export const dynamic = 'force-static'; // keep the shell prerenderable

import { useCallback, useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import BannedLogin from '@/components/BannedLogin';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';

const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });
const ProductOverlay = nextDynamic(() => import('@/components/ProductOverlay'), { ssr: false });

const CASCADE_MS = 2400;

// Demo products (swap with real data)
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function Page() {
  // view mode
  const [mode, setMode] = useState('banned'); // 'banned' | 'shop'

  // cascade gate
  const [cascading, setCascading] = useState(false);
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

  // grid density (5→1→5)
  const [cols, setCols] = useState(5);
  const [descending, setDescending] = useState(true);

  // product overlay (if your grid uses it)
  const [activeProduct, setActiveProduct] = useState(null);

  // called by BannedLogin when the cascade starts
  const onCascadeToShop = useCallback(() => {
    setCascading(true);
    setMode('shop');        // flip the view, but keep the grid hidden
    setPhase('waiting');

    // let the overlay complete before we show grid
    const t = setTimeout(() => {
      setPhase('grid');
      setCascading(false);
    }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  // +/- density control
  const bumpDensity = useCallback(() => {
    setCols((c) => {
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
    // NOTE: BannedLogin can ignore the prop; if you wired it, call onCascadeToShop() when starting the overlay.
    return <BannedLogin onCascadeToShop={onCascadeToShop} />;
  }

  return (
    <div className="shop-page" data-shop-root data-cols={cols}>
      {/* Orb +/- density control — top-left, a tad smaller, rpm matches banned page (44) */}
      <button
        type="button"
        className="shop-density"
        aria-label="Change grid density"
        onClick={bumpDensity}
      >
        <BlueOrbCross3D height="7.5vh" rpm={44} />
      </button>

      {/* DO NOT render CartButton here — ShopGrid already includes it */}
      <div className="shop-wrap">
        {phase === 'waiting' || cascading ? (
          <div className="shop-waiting" aria-busy="true" />
        ) : (
          <ShopGrid
            products={demoProducts}
            onOpen={setActiveProduct} // only if your tiles call this
          />
        )}
      </div>

      {activeProduct && (
        <ProductOverlay
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={() => setActiveProduct(null)}
        />
      )}

      {/* local nudges only */}
      <style jsx>{`
        .shop-wrap { width:100%; padding:86px 24px 24px; }
        .shop-waiting {
          height:60vh; width:100%;
          display:grid; place-items:center;
          opacity:.95;
          background: radial-gradient(
            60% 60% at 50% 40%,
            rgba(0,0,0,.06),
            rgba(0,0,0,.02) 70%,
            transparent 100%
          );
        }
        .shop-density {
          position:fixed; left:18px; top:18px; z-index:130;
          width:56px; height:56px; padding:0; border:0; background:transparent; cursor:pointer;
        }
      `}</style>

      {/* lock the grid to N columns */}
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
