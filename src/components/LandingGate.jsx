// @ts-check
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import nextDynamic from 'next/dynamic';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let start; let raf;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / durationMs);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  const whiteTx = (1 - p) * 100;
  const VW = 120;
  const bandsTx = (1 - p) * (100 + VW) - VW;

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`, background:'#fff', zIndex:9998, pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:0, left:0, height:'100vh', width:`${VW}vw`, transform:`translate3d(${bandsTx}vw,0,0)`, zIndex:9999, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:'-14px', background:c, filter:'blur(22px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:'fixed', inset:0, display:'grid', placeItems:'center', zIndex:10001, pointerEvents:'none' }}>
        <span style={{ color:'#fff', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', fontSize:'clamp(11px,1.3vw,14px)', textShadow:'0 0 16px rgba(255,255,255,.35)' }}>
          LAMEBOY, USA
        </span>
      </div>
    </>,
    document.body
  );
}

export default function LandingGate({ onCascadeComplete }) {
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState/** @type {'chakra'|'red'} */('chakra');
  const [glow, setGlow] = useState(0.9);
  const [ver, setVer] = useState(0);

  const [cascade, setCascade] = useState(false);

  const toggleOrb = useCallback(() => {
    setOrbMode(m => {
      const next = m === 'red' ? 'chakra' : 'red';
      setGlow(next === 'red' ? 1.0 : 0.9);
      setVer(v => v + 1);
      return next;
    });
  }, []);

  const runCascade = useCallback(() => {
    try { sessionStorage.setItem('fromCascade','1'); } catch {}
    try { playChakraSequenceRTL(); } catch {}
    setCascade(true);
    setTimeout(() => {
      setCascade(false);
      onCascadeComplete?.();
    }, CASCADE_MS);
  }, [onCascadeComplete]);

  return (
    <div className="page-center" style={{ minHeight:'100dvh', display:'grid', placeItems:'center', gap:14 }}>
      {cascade && <CascadeOverlay />}

      {/* Orb */}
      <button
        type="button"
        className="rounded-full"
        aria-label="Toggle orb color"
        onClick={toggleOrb}
        style={{ lineHeight:0, background:'transparent', border:0, padding:0 }}
        title="Click: toggle color (tap & hold not required here)"
      >
        <BlueOrbCross3D
          key={`${orbMode}-${glow}-${ver}`}
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={glow}
          includeZAxis
          height="72px"
          overrideAllColor={orbMode==='red' ? RED : null}
          overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
          interactive
        />
      </button>

      {/* Florida, USA (glows yellow on press, triggers cascade) */}
      <button
        type="button"
        onClick={runCascade}
        className="neon-yellow"
        style={{
          background:'transparent', border:0, color:'#fff', fontWeight:800,
          letterSpacing:'.06em', textTransform:'uppercase', cursor:'pointer'
        }}
        onMouseDown={e => e.currentTarget.style.filter='drop-shadow(0 0 12px rgba(250, 204, 21, .9))'}
        onMouseUp={e => e.currentTarget.style.filter=''}
        onMouseLeave={e => e.currentTarget.style.filter=''}
      >
        Florida, USA
      </button>

      {/* LAMEBOY (also triggers cascade) */}
      <button
        type="button"
        onClick={runCascade}
        style={{ background:'transparent', border:0, color:'#fff', fontWeight:900, letterSpacing:'.02em', cursor:'pointer' }}
      >
        LAMEBOY
      </button>

      <style jsx>{`
        .neon-yellow{ text-shadow:
          0 0 6px rgba(250,204,21,.55),
          0 0 14px rgba(250,204,21,.38),
          0 0 26px rgba(250,204,21,.22);
        }
      `}</style>
    </div>
  );
}
