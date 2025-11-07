// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

function CascadeOverlay() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let start; let id;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / CASCADE_MS);
      setP(k);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, []);

  const whiteTx = (1 - p) * 100;
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>
      <div aria-hidden style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${bandsTx}vw,0,0)`,
        zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-14, background:c, filter:'blur(22px)', opacity:.95, pointerEvents:'none' }}/>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden style={{ position:'fixed', inset:0, display:'grid', placeItems:'center', pointerEvents:'none', zIndex:10001 }}>
        <span style={{ color:'#fff', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', fontSize:'clamp(11px,1.3vw,14px)', textShadow:'0 0 12px rgba(255,255,255,.45)' }}>
          LAMEBOY, USA
        </span>
      </div>
    </>,
    document.body
  );
}

export default function LandingGate({ onCascadeComplete }) {
  const [orbMode, setOrbMode] = useState('chakra'); // 'chakra' | 'red'
  const SEAFOAM = '#32ffc7'; const RED = '#ff001a';
  const [doCascade, setDoCascade] = useState(false);

  // clicking the orb: toggle red (for future re-use across the site)
  const onOrbClick = () => {
    setOrbMode(m => (m === 'red' ? 'chakra' : 'red'));
  };

  const runCascade = useCallback(() => {
    setDoCascade(true);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setTimeout(() => {
      setDoCascade(false);
      onCascadeComplete?.();
    }, CASCADE_MS);
  }, [onCascadeComplete]);

  // Florida click → glow yellow (via class) → cascade
  const [flHot, setFlHot] = useState(false);
  const onFlorida = () => {
    setFlHot(true);
    setTimeout(() => setFlHot(false), 700);
    runCascade();
  };

  // Lameboy click → cascade
  const onLameboy = () => runCascade();

  // center stack
  return (
    <div className="page-center" style={{ minHeight:'100dvh', display:'grid', placeItems:'center', gap:12 }}>
      {doCascade && <CascadeOverlay />}

      {/* Orb */}
      <button
        type="button"
        onClick={onOrbClick}
        aria-label="Orb"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight:0, background:'transparent', border:0, padding:0 }}
        title="Toggle orb color"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={orbMode==='red' ? 1.0 : 0.9}
          includeZAxis
          height="72px"
          overrideAllColor={orbMode==='red' ? RED : null}
          overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
          interactive
        />
      </button>

      {/* LAMEBOY (tap to cascade) */}
      <button
        type="button"
        onClick={onLameboy}
        className="neon-glow"
        style={{
          background:'transparent', border:0, padding:0, color:'#fff',
          fontWeight:900, letterSpacing:0, fontSize:'clamp(18px,3.5vw,28px)', cursor:'pointer'
        }}
        title="Enter"
      >
        Lameboy
      </button>

      {/* Florida (glows yellow → cascade) */}
      <button
        type="button"
        onClick={onFlorida}
        className={`neon-glow ${flHot?'fl-glow':''}`}
        style={{
          background:'transparent', border:0, padding:0,
          color:'#eaeaea', cursor:'pointer', fontWeight:800
        }}
      >
        Florida, USA
      </button>

      <style jsx global>{`
        .neon-glow {
          text-shadow:
            0 0 6px rgba(50,255,199,.55),
            0 0 14px rgba(50,255,199,.38),
            0 0 26px rgba(50,255,199,.22);
        }
        .fl-glow {
          color: #fff7ae !important;
          text-shadow:
            0 0 6px rgba(255,240,120,.75),
            0 0 16px rgba(255,220,80,.55),
            0 0 28px rgba(255,200,60,.45) !important;
          transition: color .14s ease, text-shadow .14s ease;
        }
      `}</style>
    </div>
  );
}
