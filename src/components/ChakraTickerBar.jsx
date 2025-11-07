// @ts-check
'use client';

import { useEffect, useMemo } from 'react';

/**
 * Fixed bottom border that continuously runs chakra bands from right → left.
 * - Same 7 colors as your cascade
 * - Safe-area aware
 * - Honors prefers-reduced-motion
 * - Sits above page content, below FAB/modals
 */
export default function ChakraTickerBar({
  height = 14,              // band height in px (not counting safe-area)
  speedSec = 12,            // lower = faster
  zIndex = 260,             // below header (500) & FAB (520), above grid
}) {
  const H = Math.max(8, Math.round(height));
  const S = Math.max(4, Math.round(speedSec));
  const id = useMemo(() => `chakraTicker_${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    // noop — component is pure render, CSS-in-JSX below
  }, []);

  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'];

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        // create a little cushion for iOS home bar while keeping visual height stable
        paddingBottom: 'env(safe-area-inset-bottom)',
        pointerEvents: 'none',
      }}
    >
      <div
        className={id}
        style={{
          height: H,
          // mask the very edges for a subtle fade-in/out
          WebkitMaskImage:
            'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%)',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {/* Track (two copies for seamless loop) */}
        <div className="lb-track" style={{ height: '100%' }}>
          <div className="lb-run" />
          <div className="lb-run" />
        </div>
      </div>

      <style jsx>{`
        .${id} .lb-track{
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          width: 200%;           /* two runs side-by-side */
          transform: translateX(0);
          animation: ${id}-scroll ${S}s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .${id} .lb-track{ animation: none; }
        }

        .${id} .lb-run{
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          height: 100%;
        }

        .${id} .lb-run :global(.band){
          height: 100%;
          position: relative;
        }

        /* soft glow echo (very subtle, not a full-screen wash) */
        .${id} .lb-run :global(.band::after){
          content: "";
          position: absolute;
          inset: -8px 0 -8px 0;
          filter: blur(10px);
          opacity: .55;
          pointer-events: none;
          background: currentColor;
        }

        @keyframes ${id}-scroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* move exactly one run width */
        }
      `}</style>

      {/* Render the two identical runs (the actual bands) */}
      <style jsx>{`
        .${id} .lb-run:nth-child(1) { }
        .${id} .lb-run:nth-child(2) { }

      `}</style>

      {/* Inline the band markup twice so we can map colors cleanly */}
      <BarRun colors={colors} />
      <BarRun colors={colors} />
    </div>
  );
}

/** Helper: prints one 7-band run (consumed by the CSS grid above). */
function BarRun({ colors }) {
  return (
    <div className="lb-run" aria-hidden>
      {colors.map((c, i) => (
        <div key={i} className="band" style={{ color: c, background: c }} />
      ))}
    </div>
  );
}
