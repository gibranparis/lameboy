'use client';

export default function RotatingFlagCSS({ height = '44vh', speedSec = 16 }) {
  return (
    <section className="hero" aria-label="World Government emblem">
      <div className="stage" aria-hidden="true">
        <img className="flag front" src="/World_Government_flag.svg" alt="" decoding="async" fetchPriority="high" />
        <img className="flag back"  src="/World_Government_flag.svg" alt="" decoding="async" />
        <div className="edge" />
      </div>
      <style jsx>{`
        .hero { min-height: ${height}; display:grid; place-items:center; background:transparent;
                margin:0 0 clamp(12px,4vh,28px); pointer-events:none; }
        .stage { position:relative; perspective:1200px; width:min(72vw,720px); aspect-ratio:16/10; }
        .flag { position:absolute; inset:0; object-fit:contain; transform-style:preserve-3d;
                backface-visibility:hidden; filter:drop-shadow(0 20px 60px rgba(0,0,0,0.45)); will-change:transform; }
        .front { transform:translateZ(10px); animation:spin ${speedSec}s linear infinite; }
        .back  { transform:rotateY(180deg) translateZ(10px); animation:spin ${speedSec}s linear infinite; }
        .edge  { position:absolute; inset:0; border-radius:6px;
                 background:conic-gradient(from 90deg,#444 0 25%,#777 0 50%,#444 0 75%,#777 0 100%);
                 transform:translateZ(0); filter:blur(0.4px) brightness(0.9);
                 animation:edge-roll ${speedSec}s linear infinite;
                 mask:radial-gradient(closest-side,transparent 96%, black 98%); }
        @keyframes spin { from { transform:rotateY(0deg) translateZ(10px);} to { transform:rotateY(360deg) translateZ(10px);} }
        @keyframes edge-roll { from { transform:rotateY(0deg);} to { transform:rotateY(360deg);} }
        @media (prefers-reduced-motion: reduce) { .front,.back,.edge { animation:none; } }
      `}</style>
    </section>
  );
}
