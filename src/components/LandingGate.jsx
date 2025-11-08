'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;
const SHIFT_VH   = 5;   // slightly above perfect center (branding look)

/* Center helper: lets us nudge by viewport height and compensate per device */
function useBrandShiftPx(extraVh = SHIFT_VH){
  const calc = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    // + small device-based micro shift
    const micro = Math.round(Math.max(6, Math.min(16, vh * 0.02)));
    return { micro, vhShift: extraVh };
  };
  const [s, setS] = useState(calc);
  useEffect(() => {
    const onR = () => setS(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return s;
}

/* Chakra cascade with neon glow; title blends white on color → black on white */
function CascadeOverlay({ durationMs = CASCADE_MS, brandShift }) {
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
      {/* white veil (slides in from left) */}
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0,
          transform:`translate3d(${whiteTx}%,0,0)`,
          background:'#fff', zIndex:9998, pointerEvents:'none',
          willChange:'transform', contain:'layout style paint',
        }}
      />
      {/* neon bands with heavy blur glow */}
      <div
        aria-hidden
        style={{
          position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
          transform:`translate3d(${bandsTx}vw,0,0)`,
          zIndex:9999, pointerEvents:'none',
          willChange:'transform', contain:'layout style paint',
        }}
      >
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-18, background:c, filter:'blur(28px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Title pinned near center; mix-blend makes it white on color → black on white */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none' }}>
        <div style={{
          position:'absolute',
          left:'50%', top:'50%',
          transform:`translate(-50%, calc(-50% - ${brandShift.vhShift}vh + ${brandShift.micro}px))`,
        }}>
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

export default function LandingGate({ onCascadeComplete }) {
  const brandShift = useBrandShiftPx(SHIFT_VH);

  const [cascade, setCascade] = useState(false);
  const [orbRed, setOrbRed]   = useState(false);

  // brand label beneath orb; start as Florida, switch to LAMEBOY on click
  const [brand, setBrand]     = useState('florida');  // 'florida' | 'lameboy'
  const pressTimer = useRef(null);

  const SEAFOAM = '#32ffc7';
  const RED     = '#ff001a';

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setTimeout(() => { setCascade(false); onCascadeComplete?.(); }, CASCADE_MS);
  }, [cascade, onCascadeComplete]);

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        // nudge slightly above center
        transform:`translateY(calc(-${brandShift.vhShift}vh + ${brandShift.micro}px))`,
        gap: 10,
      }}
    >
      {cascade && <CascadeOverlay brandShift={brandShift} />}

      {/* Centered orb (tap toggles red; hold/double-click enters) */}
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
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 6 }}
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

      {/* Single label element (no overlap). Hover glow in day mode. */}
      <button
        type="button"
        onClick={() => setBrand('lameboy')}
        className="florida-link"
        title={brand === 'florida' ? 'Enter' : 'Ready'}
        style={{
          fontWeight: 800,
          letterSpacing: '.02em',
          color: brand === 'florida' ? '#eaeaea' : '#ffffff',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'color .15s ease, text-shadow .15s ease, opacity .15s ease',
        }}
      >
        {brand === 'florida' ? 'Florida, USA' : 'LAMEBOY, USA'}
      </button>

      <style jsx>{`
        .florida-link:hover,
        .florida-link:focus-visible{
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
