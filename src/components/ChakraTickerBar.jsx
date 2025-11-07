// @ts-check
'use client';

import { useMemo } from 'react';

/**
 * Fixed bottom border ticker that continuously runs chakra bands from right → left.
 * - Same 7 colors as your cascade
 * - Safe-area aware
 * - Honors prefers-reduced-motion
 * - Sits above page content, below header/cart FAB
 */
export default function ChakraTickerBar({
  height = 14,      // band height in px
  speedSec = 12,    // lower = faster
  zIndex = 260,     // below header(500)/overlays(420+), above grid
} = {}) {
  const H = Math.max(8, Math.round(height));
  const S = Math.max(4, Math.round(speedSec));
  const uid = useMemo(() => `chakraTicker_${Math.random().toString(36).slice(2)}`, []);

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
        paddingBottom: 'env(safe-area-inset-bottom)',
        pointerEvents: 'none',
      }}
    >
      <div className={`${uid} ticker-shell`}>
        <div className="track">
          {/* two identical runs inside the moving track */}
          <Run colors={colors} />
          <Run colors={colors} />
        </div>
      </div>

      <style jsx>{`
        .${uid}.ticker-shell{
          height: ${H}px;
          overflow: hidden;
          position: relative;
          -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%);
                  mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%);
        }

        .${uid} .track{
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          width: 200%; /* two full runs side by side */
          height: 100%;
          transform: translateX(0);
          animation: ${uid}-scroll ${S}s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid} .track{ animation: none; }
        }

        .${uid} .run{
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          height: 100%;
        }
        .${uid} .band{
          position: relative;
          height: 100%;
        }
        .${uid} .band::after{
          content: "";
          position: absolute;
          inset: -8px 0 -8px 0;
          filter: blur(10px);
          opacity: .55;
          pointer-events: none;
          background: currentColor;
        }

        @keyframes ${uid}-scroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* slide by exactly one run */
        }
      `}</style>
    </div>
  );
}

function Run({ colors }) {
  return (
    <div className="run" aria-hidden>
      {colors.map((c, i) => (
        <div key={i} className="band" style={{ color: c, background: c }} />
      ))}
    </div>
  );
}
