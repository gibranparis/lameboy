// @ts-check
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;
const COLOR_VW = 120;

/* --- tiny center offset so orb/title sit near true middle on all screens --- */
function useBrandShiftPx() {
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

/* --- simple rAF cascade with neon glow and title that flips color correctly --- */
function CascadeOverlay({ durationMs = CASCADE_MS, brandShiftPx = 12 }) {
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
      {/* white veil */}
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0,
          transform:`translate3d(${whiteTx}%,0,0)`,
          background:'#fff', zIndex:9998, pointerEvents:'none',
          willChange:'transform', contain:'layout style paint',
        }}
      />
      {/* chakra stack with neon bloom */}
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

      {/* title stays centered; mix-blend flips white→black over the veil */}
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
 * Banned/Login modal content.
 * Props:
 *  - startView: 'banned' | 'login'
 *  - onProceed: () => void   // called to close the modal / continue
 */
export default function BannedLogin({ startView = 'banned', onProceed }) {
  const brandShiftPx = useBrandShiftPx();

  const [view, setView] = useState(startView);  // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [labelFlip, setLabelFlip] = useState(false);
  const [orbRed, setOrbRed] = useState(false);

  // do NOT touch data-mode here (prevents day→night flip)
  // center orb controls
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const pressTimer = useRef(null);

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    setTimeout(() => {
      setCascade(false);
      onProceed?.(); // enter shop after cascade
    }, CASCADE_MS);
  }, [cascade, onProceed]);

  /* ---------- shared header: centered orb ---------- */
  const Orb = (
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
  );

  /* ---------- banned view ---------- */
  const BannedView = (
    <>
      {Orb}
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
        <span className="code-keyword">const</span> <span className="code-var">msg</span>{' '}
        <span className="code-op">=</span> <span className="code-string">"welcome to"</span>
        <span className="code-punc">;</span>
      </pre>

      {/* Florida ↔ LAMEBOY, USA under the orb, no overlap */}
      <button
        type="button"
        className="lb-florida"
        onClick={() => { setLabelFlip(true); setTimeout(()=>setLabelFlip(false), 900); }}
        title="Click to morph"
        style={{ fontWeight:800 }}
      >
        {labelFlip ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      {/* link to login view */}
      <button
        type="button"
        onClick={() => setView('login')}
        className="pill"
        style={{ marginTop:12 }}
        title="Sign in"
      >
        Sign in
      </button>

      <style jsx>{`
        .lb-florida{
          display:block; text-align:center; background:transparent; border:0; cursor:pointer;
          letter-spacing:.02em; color:#eaeaea; transition:color .15s ease, text-shadow .15s ease;
        }
        .lb-florida:hover, .lb-florida:focus-visible{
          color:#fff8c2;
          text-shadow:0 0 6px rgba(250,204,21,.55), 0 0 14px rgba(250,204,21,.38), 0 0 26px rgba(250,204,21,.22);
          outline:0;
        }
      `}</style>
    </>
  );

  /* ---------- login view ---------- */
  const LoginView = (
    <>
      {Orb}
      <div
        className="vscode-card"
        style={{
          width:'min(92vw,420px)',
          padding:'14px 16px',
          borderRadius:14,
          textAlign:'left',
          background:'var(--panel)',
        }}
      >
        <div style={{ fontWeight:900, letterSpacing:'.04em', marginBottom:8 }}>LAMEBOY ACCOUNT</div>

        <label style={{ display:'block', fontSize:12, opacity:.8, marginBottom:6 }}>Email</label>
        <input
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          style={{
            width:'100%', height:36, borderRadius:10, padding:'0 10px',
            border:'1px solid rgba(0,0,0,.14)', background:'#fff', color:'#111',
            boxShadow:'inset 0 0 0 1px rgba(255,255,255,.6)',
          }}
        />

        <div className="row-nowrap" style={{ justifyContent:'space-between', marginTop:10 }}>
          <button type="button" className="pill" onClick={() => setView('banned')}>Back</button>
          <button
            type="button"
            className="pill"
            onClick={() => onProceed?.()}
            style={{ background:'var(--hover-green)', color:'#000', borderColor:'rgba(0,0,0,.45)' }}
            title="Enter"
          >
            Enter
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="page-center" style={{ gap:10 }}>
      {cascade && <CascadeOverlay brandShiftPx={brandShiftPx} />}

      {/* keep vertical alignment right near the middle */}
      <div style={{ transform:`translateY(${brandShiftPx}px)` }}>
        {view === 'login' ? LoginView : BannedView}
      </div>
    </div>
  );
}
