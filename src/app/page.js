'use client';

export const dynamic = 'force-static'; // allow SSG
export const runtime = 'nodejs';       // avoid Edge so SSG prerender works

import { useEffect, useMemo, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';

// Lazy bits (no SSR so they don't compete with the cascade)
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const ShopGrid       = nextDynamic(() => import('@/components/ShopGrid'), { ssr: false });
const CartButton     = nextDynamic(() => import('@/components/CartButton'), { ssr: false });

// --- Simple cascade overlay (bands slide L->R over a white base) ---
function CascadeOverlay({ duration = 2400 }) {
  const [p, setP] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      setP(k);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [duration]);

  // seven equal bands, translate as one block
  const bandWidthVW = 84; // total width of the colored block (vw)
  const tx = (1 - p) * (100 + bandWidthVW) - bandWidthVW; // start offscreen left → exit right

  return (
    <>
      {/* White base so colors glow over white, not black */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, background: '#fff',
          zIndex: 998, pointerEvents: 'none'
        }}
      />
      {/* Color block that slides over the white */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: `${bandWidthVW}vw`,
          transform: `translate3d(${tx}vw,0,0)`,
          zIndex: 999, pointerEvents: 'none', willChange: 'transform'
        }}
      >
        <div
          style={{
            height: '100%', display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)'
          }}
        >
          {['#c084fc','#4f46e5','#3b82f6','#22c55e','#facc15','#f97316','#ef4444'].map((c, i) => (
            <div key={i} style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Brand in the middle */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
          zIndex: 1000, pointerEvents: 'none'
        }}
      >
        <span
          style={{
            color: '#fff', fontWeight: 700, letterSpacing: '.08em',
            textTransform: 'uppercase', fontSize: 'clamp(11px,1.3vw,14px)',
            textShadow: '0 0 8px rgba(0,0,0,.25)'
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </>
  );
}

const demoProducts = [
  { id: 'tee-01',  name: 'TEE 01',  price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02',  name: 'TEE 02',  price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function Page() {
  const [showGrid, setShowGrid] = useState(false);
  const [showCascade, setShowCascade] = useState(false);

  // Shop mode: flip theme + hide global bg/header artifacts
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-shop-root');
    html.setAttribute('data-shop-root', '1');
    return () => {
      if (prev == null) html.removeAttribute('data-shop-root');
      else html.setAttribute('data-shop-root', prev);
    };
  }, []);

  // Entry sequencing: if we arrived from the banned page, run cascade and
  // delay the grid so it appears *after* the bands have mostly crossed.
  useEffect(() => {
    let delay = 0;
    try {
      if (sessionStorage.getItem('fromCascade') === '1') {
        const CASCADE_MS = 2400;
        const PUSH_OFFSET = 150; // early push from banned
        const CUSHION = 180;
        delay = Math.max(0, CASCADE_MS - PUSH_OFFSET + CUSHION);
        setShowCascade(true);
        // clear the flag so reloads don't re-run it
        sessionStorage.removeItem('fromCascade');
        // stop cascade after it completes
        setTimeout(() => setShowCascade(false), CASCADE_MS + 80);
      }
    } catch {}

    if (delay > 0) {
      const t = setTimeout(() => setShowGrid(true), delay);
      return () => clearTimeout(t);
    } else {
      // direct land on /
      setShowGrid(true);
    }
  }, []);

  // Orb density control: 5 → 1 → 5 columns (state lives here; ShopGrid can
  // read it via CSS var or prop if you wire it inside ShopGrid too)
  const [cols, setCols] = useState(() => {
    try { return parseInt(localStorage.getItem('shopCols') || '5', 10); } catch { return 5; }
  });
  const bumpCols = () => {
    setCols(c => {
      const next = c > 1 ? c - 1 : 5;
      try { localStorage.setItem('shopCols', String(next)); } catch {}
      return next;
    });
  };

  // Inline style to force exact column count on the grid wrapper (works even if
  // ShopGrid uses its own class)
  const gridStyle = useMemo(
    () => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: '28px' }),
    [cols]
  );

  return (
    <div className="shop-page" style={{ minHeight: '100dvh', background: '#F7F7F2', color: '#111' }}>
      {/* Top-left orb (slightly smaller + synced speed) */}
      <div
        aria-label="orb"
        style={{ position: 'fixed', left: 18, top: 18, width: 32, height: 32, zIndex: 120, cursor: 'pointer' }}
        onClick={bumpCols}
      >
        <BlueOrbCross3D
          height="32px"
          rpm={44}           // matches banned page
          geomScale={0.82}   // tad smaller
          glowOpacity={0.9}
          includeZAxis
        />
      </div>

      {/* Cart button (top-right) */}
      <div style={{ position: 'fixed', right: 18, top: 18, zIndex: 130 }}>
        <CartButton />
      </div>

      {/* Grid mount point */}
      <div className="shop-wrap" style={{ padding: '86px 24px 24px' }}>
        {showGrid ? (
          // If your ShopGrid already outputs a grid, the wrapper's gridStyle
          // will still constrain children evenly into `cols` columns.
          <div style={gridStyle}>
            <ShopGrid products={demoProducts} />
          </div>
        ) : (
          // small placeholder while we hold for the cascade
          <div style={{ height: '42vh' }} />
        )}
      </div>

      {showCascade && <CascadeOverlay duration={2400} />}
    </div>
  );
}
