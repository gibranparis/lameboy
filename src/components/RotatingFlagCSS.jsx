// src/components/RotatingFlagCSS.jsx
'use client';

export default function RotatingFlagCSS({
  src = '/World_Government_flag.svg',
  height = '44vh',
  speedSec = 16,
  depth = 10,               // px the faces sit off the edge “rim”
  radius = 6,               // px corner radius of the rim
  perspective = 1200,       // px perspective distance
  label = 'World Government emblem',
}) {
  return (
    <section
      className="flag-hero"
      aria-label={label}
      style={{ '--speed': `${speedSec}s`, '--depth': `${depth}px`, '--radius': `${radius}px`, '--persp': `${perspective}px`, minHeight: height }}
    >
      <div className="flag-stage" aria-hidden="true">
        {/* Two faces (front/back), mirrored for clean 3D spin */}
        <img className="flag face front" src={src} alt="" decoding="async" fetchPriority="high" draggable={false} />
        <img className="flag face back"  src={src} alt="" decoding="async" draggable={false} />
        {/* Metallic-ish edge ring */}
        <div className="flag-edge" />
      </div>

      <style jsx>{`
        .flag-hero{
          display:grid; place-items:center;
          background:transparent; margin:0 0 clamp(12px,4vh,28px);
          pointer-events:none; /* purely decorative */
        }
        .flag-stage{
          position:relative;
          width:min(72vw, 720px);
          aspect-ratio:16/10;
          perspective: var(--persp);
        }
        .flag{
          position:absolute; inset:0;
          object-fit:contain;
          transform-style:preserve-3d;
          backface-visibility:hidden;
          will-change:transform;
          filter:drop-shadow(0 20px 60px rgba(0,0,0,.45));
        }
        .front{ transform: translateZ(var(--depth)); animation: spin var(--speed) linear infinite; }
        .back { transform: rotateY(180deg) translateZ(var(--depth)); animation: spin var(--speed) linear infinite; }

        .flag-edge{
          position:absolute; inset:0;
          border-radius: var(--radius);
          background:
            conic-gradient(from 90deg, #444 0 25%, #777 0 50%, #444 0 75%, #777 0 100%);
          transform: translateZ(0);
          filter: blur(.4px) brightness(.9);
          animation: edge-roll var(--speed) linear infinite;
          /* cut out the inside so the faces show cleanly */
          -webkit-mask: radial-gradient(closest-side, transparent 96%, black 98%);
                  mask: radial-gradient(closest-side, transparent 96%, black 98%);
        }

        @keyframes spin {
          from { transform: rotateY(0deg) translateZ(var(--depth)); }
          to   { transform: rotateY(360deg) translateZ(var(--depth)); }
        }
        @keyframes edge-roll {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }

        @media (prefers-reduced-motion: reduce){
          .front,.back,.flag-edge{ animation:none !important; }
        }
      `}</style>
    </section>
  );
}
