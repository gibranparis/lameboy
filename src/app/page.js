// src/app/page.js
'use client';

export const dynamic = 'force-static'; // allow SSG
export const runtime = 'nodejs';       // avoid Edge so SSG prerender works

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/* Lazy bits (no SSR to avoid competing with the cascade) */
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const ShopGrid       = dynamic(() => import('@/components/ShopGrid'),       { ssr: false });
const CartButton     = dynamic(() => import('@/components/CartButton'),     { ssr: false });

/* Timings */
const CASCADE_MS  = 2400;     // total sweep
const SWAP_AT_MS  = 2100;     // when we let the grid come in under the last bands

/* --- “reverse curtain” cascade: equal bands over a white base --- */
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

  // ease for the white base fade (fast to near-1 so bands glow over white)
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const whiteAlpha = easeOut(Math.min(1, p * 1.25)); // hits white quickly

  // Slide a 100vw-wide, 7-column block across screen: -100% → +100%
  // Keeps each band exactly the same width throughout.
  const txPct = -100 + (200 * p); // from -100% (off left) to +100% (off right)

  return (
    <>
      {/* White base sits *under* the moving bands the whole time */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: `rgba(255,255,255,${whiteAlpha})`,
          zIndex: 9997,
          pointerEvents: 'none',
          willChange: 'opacity',
        }}
      />

      {/* Moving rainbow block (exactly 100vw wide; equal 7 columns) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100vw',
          transform: `translate3d(${txPct}%, 0, 0)`,
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {['#c084fc','#4f46e5','#3b82f6','#22c55e','#facc15','#f97316','#ef4444'].map((c,i)=>(
            <div key={i} style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Brand during sweep */}
      <div
        style={{
          position:'fixed',
          inset:0,
          display:'grid',
          placeItems:'center',
          zIndex: 10001,
          pointerEvents:'none'
        }}
      >
        <span style={{
          color:'#fff',
          fontWeight:700,
          letterSpacing:'.08em',
          textTransform:'uppercase',
          fontSize:'clamp(11px,1.3vw,14px)',
          textShadow:'0 0 8px rgba(0,0,0,.25)'
        }}>
          LAMEBOY, USA
        </span>
      </div>
    </>
  );
}

export default function HomePage() {
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'grid'

  // Smoothly move from cascade to grid without flashing
  useEffect(() => {
    const t = setTimeout(() => setPhase('grid'), SWAP_AT_MS);
    return () => clearTimeout(t);
  }, []);

  // Make sure shop mode CSS is active (your globals look for this)
  useEffect(() => {
    // mark that we are the shop root to flip theme & hide the global bg canvas
    document.documentElement.setAttribute('data-shop-root', '1');
    return () => document.documentElement.removeAttribute('data-shop-root');
  }, []);

  // Orb click → let ShopGrid handle density cycling (keeps your existing wiring)
  const onOrbActivate = () => {
    try { window.dispatchEvent(new CustomEvent('shop:cycle-density')); } catch {}
  };

  return (
    <div data-shop-root className="shop-page" style={{ minHeight: '100dvh' }}>
      {/* Cascade only while we’re in the waiting phase */}
      {phase === 'waiting' && <CascadeOverlay duration={CASCADE_MS} />}

      {/* Top-left orb (smaller; rpm matches banned page) */}
      <div
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          zIndex: 120,
          width: 44,  // hit target
          height: 44,
          pointerEvents: 'auto',
        }}
        aria-label="density-orb"
      >
        <BlueOrbCross3D
          height="6.5vh"   // a tad smaller than before
          rpm={44}         // same spin speed as banned page
          onActivate={onOrbActivate}
        />
      </div>

      {/* Cart button (top-right) */}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 130 }}>
        <CartButton />
      </div>

      {/* Grid */}
      <div className="shop-wrap">
        {phase === 'waiting' ? (
          // Light veil so the grid mounts cleanly under the cascade
          <div
            style={{
              height: '60vh',
              width: '100%',
              opacity: 0.95,
              background:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.05), rgba(0,0,0,0.02) 70%, transparent 100%)',
            }}
            aria-busy="true"
          />
        ) : (
          <ShopGrid />
        )}
      </div>
    </div>
  );
}
