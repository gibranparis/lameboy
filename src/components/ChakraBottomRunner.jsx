// ChakraBottomRunner.jsx
// Bottom border rainbow (right → left), lightweight & CSS-only
export default function ChakraBottomRunner({ height = 12, speedSec = 14 }) {
  const h = Math.max(6, Math.min(32, height)); // sane bounds

  return (
    <div className="lb-chakra-runner" aria-hidden>
      {/* 200% track with two identical strips for seamless loop */}
      <div className="track">
        <div className="strip">
          <div className="b b1" /><div className="b b2" /><div className="b b3" />
          <div className="b b4" /><div className="b b5" /><div className="b b6" /><div className="b b7" />
        </div>
        <div className="strip">
          <div className="b b1" /><div className="b b2" /><div className="b b3" />
          <div className="b b4" /><div className="b b5" /><div className="b b6" /><div className="b b7" />
        </div>
      </div>

      <style jsx>{`
        .lb-chakra-runner{
          position: fixed; left: 0; right: 0; bottom: 0;
          height: ${h}px;
          z-index: 200;            /* below header(500), above page bg */
          pointer-events: none;
          overflow: hidden;
        }

        .track{
          width: 200%;
          height: 100%;
          display: flex;
          animation: slideLeft ${speedSec}s linear infinite;
          will-change: transform;
        }

        .strip{
          width: 50%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .b{ position: relative; height: 100%; }

        /* Same colors as your cascade */
        .b1{ --c:#ef4444; background: var(--c); }
        .b2{ --c:#f97316; background: var(--c); }
        .b3{ --c:#facc15; background: var(--c); }
        .b4{ --c:#22c55e; background: var(--c); }
        .b5{ --c:#3b82f6; background: var(--c); }
        .b6{ --c:#4f46e5; background: var(--c); }
        .b7{ --c:#c084fc; background: var(--c); }

        /* soft glow like the cascade (subtle so it stays a border) */
        .b::after{
          content:"";
          position:absolute; inset:-8px 0 -18px 0; /* light upward glow */
          background: var(--c);
          filter: blur(12px);
          opacity: .55;
        }

        @keyframes slideLeft {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* one strip width */
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce){
          .track{ animation: none; }
        }
      `}</style>
    </div>
  );
}
