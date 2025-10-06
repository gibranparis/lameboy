// src/app/page.js
'use client';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

import { useCallback, useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import BannedLogin from '@/components/BannedLogin';
import BlueOrbCross3D from '@/components/BlueOrbCross3D';
import CartButton from '@/components/CartButton';

const ShopGrid = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });
const ProductOverlay = nextDynamic(() => import('@/components/ProductOverlay'), { ssr: false });

/* --- timings to match your banned page --- */
const CASCADE_MS = 2400;
const SWAP_AT_MS = 2100; // switch content under the white near the end

/* --- lightweight cascade overlay (same vibe as banned) --- */
function CascadeOverlay({ duration = CASCADE_MS }) {
  const [p, setP] = useState(0);

  useEffect(() => {
    let start, raf;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / duration);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const whiteW = `${(p * 100).toFixed(3)}%`;
  const COLOR_VW = 120;
  const tx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return (
    <>
      {/* white sheet that grows from left to right */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh',
          width: whiteW, background: '#fff', zIndex: 9998,
          pointerEvents: 'none', willChange: 'width', transition: 'width 16ms linear'
        }}
      />
      {/* moving rainbow block (RTL vibe) */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
          transform:`translate3d(${tx}vw,0,0)`, zIndex:9999, pointerEvents:'none'
        }}
      >
        <div style={{position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)'}}>
          {['#c084fc','#4f46e5','#3b82f6','#22c55e','#facc15','#f97316','#ef4444'].map((c,i)=>(
            <div key={i} style={{background:c}}/>
          ))}
        </div>
      </div>
      {/* tiny brand text while it moves */}
      <div style={{position:'fixed', inset:0, display:'grid', placeItems:'center', zIndex:10001, pointerEvents:'none'}}>
        <span style={{
          color:'#fff', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
          fontSize:'clamp(11px,1.3vw,14px)', textShadow:'0 0 8px rgba(0,0,0,.25)'
        }}>LAMEBOY, USA</span>
      </div>
    </>
  );
}

export default function Page() {
  const [mode, setMode] = useState('banned');         // 'banned' | 'shop'
  const [cascading, setCascading] = useState(false);  // overlay running?
  const [phase, setPhase] = useState('waiting');      // 'waiting' | 'grid'

  const [cols, setCols] = useState(5);
  const [descending, setDescending] = useState(true);

  const [activeProduct, setActiveProduct] = useState(null);

  // +/- grid density (5→1→5)
  const bumpDensity = useCallback(() => {
    setCols((c) => {
      if (descending) {
        const next = c - 1;
        if (next <= 1) setDescending(false);
        return Math.max(1, next);
      }
      const next = c + 1;
      if (next >= 5) setDescending(true);
      return Math.min(5, next);
    });
  }, [descending]);

  // BannedLogin → parent: start cascade
  const onCascadeStart = useCallback(() => {
    // run the overlay on top of the banned view
    setCascading(true);

    // near the end of the sweep, swap in the grid under the white
    const swapT = setTimeout(() => {
      setMode('shop');
      setPhase('grid');
    }, SWAP_AT_MS);

    // then drop the overlay completely
    const endT = setTimeout(() => {
      setCascading(false);
    }, CASCADE_MS);

    return () => { clearTimeout(swapT); clearTimeout(endT); };
  }, []);

  /* banned */
  if (mode === 'banned') {
    return (
      <>
        <BannedLogin onCascadeToShop={onCascadeStart} />
        {cascading && <CascadeOverlay />}
      </>
    );
  }

  /* shop */
  return (
    <div className="shop-page" data-shop-root data-cols={cols}>
      {/* top-left chakra orb (+/- density) — smaller + rpm matches banned (44) */}
      <button
        type="button"
        className="shop-density"
        aria-label="Change grid density"
        onClick={bumpDensity}
      >
        <BlueOrbCross3D height="7.2vh" rpm={44} />
      </button>

      {/* single cart FAB; hide any duplicates from inner components */}
      <CartButton />

      <div className="shop-wrap">
        {phase === 'waiting' ? (
          <div className="shop-waiting" aria-busy="true" />
        ) : (
          <ShopGrid
            products={[
              { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
              { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
              { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
            ]}
            onOpen={setActiveProduct}
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

      {/* local nudges */}
      <style jsx>{`
        .shop-wrap { width:100%; padding:86px 24px 24px; }
        .shop-waiting {
          height:60vh; width:100%;
          display:grid; place-items:center;
          opacity:.95;
          background: radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,.06), rgba(0,0,0,.02) 70%, transparent 100%);
        }
        .shop-density {
          position:fixed; left:18px; top:18px; z-index:130;
          width:56px; height:56px; padding:0; border:0; background:transparent; cursor:pointer;
        }
        /* de-dupe: if an inner component mounts its own .cart-fab, hide all but the first */
        :global(.cart-fab:not(:first-of-type)) { display:none !important; }
      `}</style>

      {/* lock grid columns to N */}
      <style jsx>{`
        [data-cols="${cols}"] :global(.shop-grid){
          display:grid !important;
          grid-template-columns: repeat(${cols}, minmax(0,1fr)) !important;
        }
      `}</style>

      {/* keep the overlay visible even on shop view if we're still finishing */}
      {cascading && <CascadeOverlay />}
    </div>
  );
}
