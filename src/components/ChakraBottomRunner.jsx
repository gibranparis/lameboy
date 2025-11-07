// @ts-check
'use client';

import { useMemo } from 'react';

/**
 * Chakra bottom runner — continuous right→left ticker strip.
 * Same 7 chakra bands, subtle glow, safe-area padding, reduced-motion safe.
 */
export default function ChakraBottomRunner({
  height = 14,      // visual height
  speedSec = 12,    // lower = faster
  zIndex = 260,     // sits above grid, below modals/header
} = {}) {
  const H = Math.max(8, Math.round(height));
  const S = Math.max(4, Math.round(speedSec));
  const uid = useMemo(() => `chakraRunner_${Math.random().toString(36).slice(2)}`, []);

  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#facc15', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#4f46e5', // indigo
    '#c084fc', // violet
  ];

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex,
        pointerEvents: 'none',
      }}
    >
      <div className={`${uid}-shell`}>
        <div className="track">
          <Run colors={colors} />
          <Run colors={colors} />
        </div>
      </div>

      <style jsx>{`
        .${uid}-shell {
          height: ${H}px;
          overflow: hidden;
          position: relative;
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
        }

        .${uid}-shell .track {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          width: 200%;
          height: 100%;
          animation: ${uid}-scroll ${S}s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}-shell .track { animation: none; }
        }

        .${uid}-shell .run {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          height: 100%;
        }

        .${uid}-shell .band {
          height: 100%;
          position: relative;
        }
        .${uid}-shell .band::after {
          content: "";
          position: absolute;
          inset: -8px 0 -8px 0;
          background: currentColor;
          filter: blur(10px);
          opacity: .55;
          pointer-events: none;
        }

        @keyframes ${uid}-scroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function Run({ colors }) {
  return (
    <div className="run" aria-hidden>
      {colors.map((c, i) => (
        <div key={i} className="band" style={{ background: c, color: c }} />
      ))}
    </div>
  );
}
