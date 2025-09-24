// src/components/ButterflyChakra.jsx
'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A tiny "2-bit" butterfly with a 7-chakra trail that flies along a motion path.
 * Give it the DOM nodes for the L and Y letters and it will fly L -> Y,
 * do a small loop mid-air, land, and fade.
 */
export default function ButterflyChakra({ startEl, endEl, onDone, durationMs = 1600 }) {
  const hostRef = useRef(null);
  const [path, setPath] = useState(null);

  useLayoutEffect(() => {
    if (!startEl || !endEl) return;

    const s = startEl.getBoundingClientRect();
    const e = endEl.getBoundingClientRect();

    const sx = s.left + s.width * 0.5;
    const sy = s.top + Math.max(2, s.height * 0.15);
    const ex = e.left + e.width * 0.5;
    const ey = e.top + Math.max(2, e.height * 0.15);

    const midx = (sx + ex) / 2;
    const midy = Math.min(sy, ey) - Math.abs(ex - sx) * 0.35;

    const loopR = Math.max(18, Math.min(40, Math.abs(ex - sx) * 0.12));
    const loopCx = midx + loopR * 0.2;
    const loopCy = midy - loopR * 0.6;

    const d = [
      `M ${sx},${sy}`,
      `Q ${midx},${midy} ${midx + loopR},${midy + 4}`,
      `A ${loopR},${loopR} 0 1 1 ${loopCx - loopR},${loopCy}`,
      `A ${loopR},${loopR} 0 1 1 ${midx + loopR},${midy + 4}`,
      `Q ${(midx + ex) / 2},${(midy + ey) / 2} ${ex},${ey}`,
    ].join(' ');
    setPath(d);
  }, [startEl, endEl]);

  useEffect(() => {
    if (!hostRef.current) return;
    const el = hostRef.current;
    const done = () => onDone?.();
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, [onDone]);

  if (!path) return null;

  return (
    <div ref={hostRef} className="bfly-host" style={{ '--bfly-ms': `${durationMs}ms` }}>
      <svg className="bfly-sizer" width="0" height="0"><path d={path}/></svg>

      {/* 7-chakra trail */}
      <div className="bfly bfly-dot dot-1"/>
      <div className="bfly bfly-dot dot-2"/>
      <div className="bfly bfly-dot dot-3"/>
      <div className="bfly bfly-dot dot-4"/>
      <div className="bfly bfly-dot dot-5"/>
      <div className="bfly bfly-dot dot-6"/>
      <div className="bfly bfly-dot dot-7"/>

      {/* 2-bit butterfly: two chunky pixels + tiny body */}
      <div className="bfly bfly-sprite">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="6" y="5" width="2" height="4" fill="#ffd1f0"/>
          <rect className="wingL" x="3" y="5" width="6" height="6" fill="#ff79c6"/>
          <rect className="wingR" x="5" y="3" width="6" height="6" fill="#8be9fd"/>
        </svg>
      </div>

      <style jsx global>{`
        .bfly-host{ position:fixed; inset:0; pointer-events:none; z-index:10010; }
        .bfly-sizer{ position:absolute; inset:0; }
        .bfly{
          position:fixed;
          offset-path: path("${path.replace(/"/g, '\\"')}");
          offset-rotate: auto;
          animation: bfly-move var(--bfly-ms) ease-in-out forwards;
          will-change: transform, offset-distance, opacity, filter;
        }
        @keyframes bfly-move{
          0%{ offset-distance:0%;   opacity:0;   filter:blur(.2px) }
          5%{                     opacity:1 }
          85%{                    opacity:1 }
          100%{ offset-distance:100%; opacity:0; filter:blur(.4px) }
        }
        .bfly-dot{
          width:8px; height:8px; border-radius:50%;
          box-shadow:0 0 8px currentColor, 0 0 18px currentColor;
        }
        .dot-1{ color:#c084fc; background:currentColor; animation-delay:  40ms }
        .dot-2{ color:#4f46e5; background:currentColor; animation-delay: 100ms }
        .dot-3{ color:#3b82f6; background:currentColor; animation-delay: 160ms }
        .dot-4{ color:#22c55e; background:currentColor; animation-delay: 220ms }
        .dot-5{ color:#facc15; background:currentColor; animation-delay: 280ms }
        .dot-6{ color:#f97316; background:currentColor; animation-delay: 340ms }
        .dot-7{ color:#ef4444; background:currentColor; animation-delay: 400ms }
        .bfly-sprite{ z-index:2; filter: drop-shadow(0 0 8px #fff) drop-shadow(0 0 18px #fff) }
        .bfly-sprite .wingL,.bfly-sprite .wingR{ transform-origin:center; animation:flap 180ms ease-in-out infinite alternate }
        .bfly-sprite .wingR{ animation-delay:80ms }
        @keyframes flap{ from{ transform:scaleY(1) } to{ transform:scaleY(.75) } }
      `}</style>
    </div>
  );
}
