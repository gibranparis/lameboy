// @ts-check
// src/components/BannedLogin.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });
const CASCADE_MS = 2400;

/* ——— wordmark ——— */
function Wordmark() {
  return (
    <span className="lb-white neon-black" style={{ fontWeight:900 }}>
      Lamebo<span>y</span><span className="lb-seafoam">.com</span>
    </span>
  );
}

/* ——— simple neon cascade (keeps your glow) ——— */
function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let t0, id;
    const step = (t) => { if (!t0) t0 = t; const k = Math.min(1, (t - t0)/durationMs); setP(k); if (k<1) id=requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [durationMs]);

  const whiteTx = (1 - p) * 100;
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden style={{ position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`, background:'#fff', zIndex:9998, pointerEvents:'none' }}/>
      <div aria-hidden style={{ position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`, transform:`translate3d(${bandsTx}vw,0,0)`, zIndex:9999, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-14, background:c, filter:'blur(24px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function BannedLogin({ onProceed }) {
  const [cascade, setCascade] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  // Florida ↔ LAMEBOY, USA flip state
  const [flipBrand, setFlipBrand] = useState(false);

  const SEAFOAM = '#32ffc7', RED = '#ff001a';
  const [orbMode, setOrbMode] = useState/** @type {'chakra'|'red'} */('chakra');
  const [orbGlow, setOrbGlow]   = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  useEffect(() => { try { document.documentElement.setAttribute('data-mode','gate'); } catch {} }, []);

  const runCascade = useCallback(() => {
    setCascade(true);
    const id = setTimeout(() => {
      setCascade(false);
      setWhiteout(true);
      onProceed?.();
    }, CASCADE_MS);
    return () => clearTimeout(id);
  }, [onProceed]);

  const toggleOrbColor = useCallback(() => {
    setOrbMode(m => {
      const n = m === 'red' ? 'chakra' : 'red';
      setOrbGlow(n === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      return n;
    });
  }, []);

  // center column
  return (
    <div className="page-center" style={{ gap:14 }}>
      {cascade && <CascadeOverlay />}
      {whiteout && createPortal(<div aria-hidden style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002 }} />, document.body)}

      {/* ORB */}
      <button
        type="button"
        onClick={() => {
          const detail = { step:1 };
          try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
          try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
        }}
        onDoubleClick={toggleOrbColor}
        onContextMenu={(e)=>{ e.preventDefault(); runCascade(); }}
        title="Tap to zoom grid • Double-tap to toggle color • Hold-click to enter"
        style={{ lineHeight:0, background:'transparent', border:0, padding:0 }}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <BlueOrbCross3D
          key={`${orbMode}-${orbGlow}-${orbVersion}`}
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={orbGlow}
          includeZAxis
          height="72px"
          overrideAllColor={orbMode==='red' ? RED : null}
          overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
          interactive
        />
      </button>

      {/* WORDS — centered */}
      <pre
        className="code-tight"
        style={{
          margin:0,
          textAlign:'center',
          color:'var(--text)',
          font:'700 14px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <span className="lb-seafoam code-comment">// </span><Wordmark />{'\n'}
        <span className="lb-seafoam code-comment">// </span>
        <span className="banned-neon">is banned</span>{'\n'}
        <span className="code-keyword">const</span> <span className="code-var">msg</span> <span className="code-op">=</span> <span className="code-string">"welcome to"</span><span className="code-punc">;</span>
      </pre>

      {/* Florida ↔ LAMEBOY, USA on the same spot */}
      <button
        type="button"
        className="florida-link"
        onClick={() => { setFlipBrand(true); setTimeout(()=>setFlipBrand(false), 900); }}
        title="Click to morph"
        style={{ fontWeight:800 }}
      >
        {flipBrand ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>
    </div>
  );
}
