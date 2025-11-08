// @ts-check
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

/* ---- helpers ---------------------------------------------------------- */
function useShift() {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isPhone = h < 760;
    return {
      // pull the stack slightly above true center (subtle brand look)
      vh: isPhone ? 10 : 8,                 // viewport-height nudge upward
      micro: Math.round(Math.max(4, Math.min(14, h * 0.018))), // tiny pixel trim
      gap: isPhone ? 6 : 8,                 // tighter vertical spacing
    };
  };
  const [s, setS] = useState(calc);
  useEffect(() => {
    const onR = () => setS(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return s;
}

function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform }) {
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

  const COLOR_VW = 120;
  const whiteTx  = (1 - p) * 100;
  const bandsTx  = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>
      <div aria-hidden style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${bandsTx}vw,0,0)`, zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-18, background:c, filter:'blur(28px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Title that turns white on color → black on white */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none' }}>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform: labelTransform }}>
          <span style={{
            color:'#fff', mixBlendMode:'difference',
            fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
            fontSize:'clamp(11px,1.3vw,14px)'
          }}>
            LAMEBOY, USA
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---- component -------------------------------------------------------- */
export default function BannedLogin({ onProceed }) {
  const { vh, micro, gap } = useShift();

  const [cascade, setCascade]     = useState(false);
  const [flipBrand, setFlipBrand] = useState(false);
  const [orbRed, setOrbRed]       = useState(false);
  const pressTimer = useRef(null);

  const SEAFOAM = '#32ffc7', RED = '#ff001a';

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    setTimeout(() => { setCascade(false); onProceed?.(); }, CASCADE_MS);
  }, [cascade, onProceed]);

  return (
    <div
      className="page-center"
      style={{
        // pull slightly above center + micro trim, then keep the stack compact
        transform:`translateY(calc(-${vh}vh + ${micro}px))`,
        gap,               // <<< tighter vertical spacing
        alignItems:'center',
      }}
    >
      {cascade && (
        <CascadeOverlay
          labelTransform={`translate(-50%, calc(-50% - ${vh}vh + ${micro}px))`}
        />
      )}

      {/* ORB — tiny margin below so it hugs the code block */}
      <button
        type="button"
        aria-label="Orb"
        onClick={() => setOrbRed(v=>!v)}
        onMouseDown={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight:0, background:'transparent', border:0, padding:0, marginBottom:2 }}
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

      {/* Stylized constant message — compact line-height */}
      <pre
        className="code-tight"
        style={{
          margin:0,
          textAlign:'center',
          color:'var(--text)',
          font:'700 14px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <span className="lb-seafoam code-comment">// </span>
        <span className="lb-white neon-black" style={{ fontWeight:900 }}>
          Lamebo<span>y</span><span className="lb-seafoam">.com</span>
        </span>{'\n'}
        <span className="lb-seafoam code-comment">// </span>
        <span className="banned-neon">is banned</span>{'\n'}
        <span className="code-keyword">const</span> <span className="code-var">msg</span> <span className="code-op">=</span> <span className="code-string">"welcome to"</span><span className="code-punc">;</span>
      </pre>

      {/* Florida/LAMEBOY label — kept close to the code block */}
      <button
        type="button"
        className="florida-link"
        onClick={() => { setFlipBrand(true); setTimeout(()=>setFlipBrand(false), 900); }}
        title="Click to morph"
        style={{ fontWeight:800, marginTop:2 }}
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
