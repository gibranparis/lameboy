// @ts-check
// src/components/BannedLogin.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;
const COLOR_VW = 120;

/* tiny center offset so orb/title sit near true middle */
function useBrandShiftPx(){
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Math.round(Math.max(8, Math.min(18, h * 0.02)));
  };
  const [px, setPx] = useState(calc);
  useEffect(() => {
    const onR = () => setPx(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return px;
}

/* Neon cascade with rAF and title that flips white→black over veil */
function CascadeOverlay({ durationMs = CASCADE_MS, brandShiftPx = 12 }){
  const [mounted, setMounted] = useState(true);
  const [p, setP] = useState(0);

  useEffect(() => {
    let start, rafId, doneId;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (t) => {
      if (start == null) start = t;
      const raw = Math.min(1, (t - start) / durationMs);
      setP(ease(raw));
      if (raw < 1) rafId = requestAnimationFrame(step);
      else doneId = setTimeout(() => setMounted(false), 120);
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); if (doneId) clearTimeout(doneId); };
  }, [durationMs]);

  if (!mounted) return null;

  const whiteTx = (1 - p) * 100;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0,
          transform:`translate3d(${whiteTx}%,0,0)`,
          background:'#fff', zIndex:9998, pointerEvents:'none',
          willChange:'transform', contain:'layout style paint',
        }}
      />
      <div
        aria-hidden
        style={{
          position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
          transform:`translate3d(${bandsTx}vw,0,0)`,
          zIndex:9999, pointerEvents:'none', willChange:'transform', contain:'layout style paint',
        }}
      >
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-16, background:c, filter:'blur(26px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Title locked near center; mix-blend handles white→black */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none' }}>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:`translate(-50%, calc(-50% + ${brandShiftPx}px))` }}>
          <span
            style={{
              color:'#fff',
              mixBlendMode:'difference',
              fontWeight:800,
              letterSpacing:'.08em',
              textTransform:'uppercase',
              fontSize:'clamp(11px,1.3vw,14px)',
              textShadow:'0 0 10px rgba(255,255,255,.55)',
            }}
          >
            LAMEBOY, USA
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}

/**
 * OG banned modal (no email form).
 * - Center orb (tap toggles color; hold/double-click runs cascade)
 * - Console text with neon "is banned"
 * - Florida, USA ↔ LAMEBOY, USA flip button beneath
 */
export default function BannedLogin({ onProceed }){
  const brandShiftPx = useBrandShiftPx();
  const [cascade, setCascade] = useState(false);
  const [flipBrand, setFlipBrand] = useState(false);
  const [orbRed, setOrbRed] = useState(false);
  const pressTimer = useRef(null);

  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    setTimeout(() => { setCascade(false); onProceed?.(); }, CASCADE_MS);
  }, [cascade, onProceed]);

  return (
    <div className="page-center" style={{ gap:10, transform:`translateY(${brandShiftPx}px)` }}>
      {cascade && <CascadeOverlay brandShiftPx={brandShiftPx} />}

      {/* ORB */}
      <button
        type="button"
        aria-label="Orb"
        onClick={() => setOrbRed(v => !v)}
        onMouseDown={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight:0, background:'transparent', border:0, padding:0, marginBottom:8 }}
        title="Tap: toggle color • Hold/Double-click: enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={orbRed ? 1.0 : 0.9}
          includeZAxis
          height="72px"
          overrideAllColor={orbRed ? RED : null}
          interactive
        />
      </button>

      {/* Console text */}
      <pre
        className="code-tight"
        style={{
          margin:0,
          textAlign:'center',
          color:'var(--text)',
          font:'700 14px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <span className="lb-seafoam code-comment">// </span>
        <span className="lb-white neon-black" style={{ fontWeight:900 }}>
          Lamebo<span>y</span><span className="lb-seafoam">.com</span>
        </span>
        {'\n'}
        <span className="lb-seafoam code-comment">// </span>
        <span className="banned-neon">is banned</span>{'\n'}
        <span className="code-keyword">const</span> <span className="code-var">msg</span> <span className="code-op">=</span> <span className="code-string">"welcome to"</span><span className="code-punc">;</span>
      </pre>

      {/* Florida ↔ LAMEBOY flip */}
      <button
        type="button"
        className="florida-link"
        onClick={() => { setFlipBrand(true); setTimeout(()=>setFlipBrand(false), 900); }}
        title="Click to morph"
        style={{ fontWeight:800 }}
      >
        {flipBrand ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      <style jsx>{`
        .florida-link{
          display:block; text-align:center; background:transparent; border:0; cursor:pointer;
          letter-spacing:.02em; color:#eaeaea; transition: color .15s ease, text-shadow .15s ease;
        }
        .florida-link:hover, .florida-link:focus-visible{
          color:#fff8c2;
          text-shadow:
            0 0 6px rgba(250,204,21,.55),
            0 0 14px rgba(250,204,21,.38),
            0 0 26px rgba(250,204,21,.22);
          outline:0;
        }
      `}</style>
    </div>
  );
}
