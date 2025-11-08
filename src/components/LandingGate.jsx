'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;
const CASCADE_PAD_MS = 120;   // unmount buffer to prevent end-frame flicker
const COLOR_VW = 120;         // width of color stack
const BRAND_SHIFT_PX = 48;    // vertical offset from viewport center to “Florida, USA”

function CascadeOverlay({ durationMs = CASCADE_MS, brandShiftPx = BRAND_SHIFT_PX }) {
  const [mounted, setMounted] = useState(true);
  const [p, setP] = useState(0); // 0..1 progress

  useEffect(() => {
    let start, rafId, doneId;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const step = (t) => {
      if (start == null) start = t;
      const raw = Math.min(1, (t - start) / durationMs);
      setP(ease(raw));
      if (raw < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        doneId = setTimeout(() => setMounted(false), CASCADE_PAD_MS);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (doneId) clearTimeout(doneId);
    };
  }, [durationMs]);

  if (!mounted) return null;

  const whiteTx = (1 - p) * 100;                       // veil 100% → 0%
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // offscreen → flush

  return createPortal(
    <>
      {/* WHITE VEIL */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 9998,
          pointerEvents: 'none',
          willChange: 'transform',
          contain: 'layout style paint',
          transformOrigin: 'left center',
        }}
      />

      {/* COLOR STACK + glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: `${COLOR_VW}vw`,
          transform: `translate3d(${bandsTx}vw,0,0)`,
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
          contain: 'layout style paint',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
          }}
        >
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span
                style={{
                  position:'absolute',
                  inset:-16,
                  background:c,
                  filter:'blur(26px)',
                  opacity:.95,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* TITLE — same Y as “Florida, USA”; auto-flips color on white via difference */}
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

export default function LandingGate({ onCascadeComplete }) {
  const [cascade, setCascade] = useState(false);
  const [orbRed, setOrbRed] = useState(false);
  const pressTimer = useRef(null);

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setTimeout(() => {
      setCascade(false);
      onCascadeComplete?.();
    }, CASCADE_MS);
  }, [cascade, onCascadeComplete]);

  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';

  return (
    <div
      className="page-center"
      style={{
        minHeight:'100dvh',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:'1.5rem',
        position:'relative'
      }}
    >
      {cascade && <CascadeOverlay brandShiftPx={BRAND_SHIFT_PX} />}

      {/* Centered orb */}
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
        style={{ lineHeight: 0, background:'transparent', border:0, padding:0, marginBottom: 10 }}
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

      {/* Florida, USA — sits exactly where the cascade title appears */}
      <button
        type="button"
        className="florida-link"
        onClick={runCascade}
        style={{
          display:'block',
          textAlign:'center',
          color:'#eaeaea',
          fontWeight:700,
          letterSpacing:'.02em',
          background:'transparent',
          border:'none',
          cursor:'pointer'
        }}
        title="Enter"
      >
        Florida, USA
      </button>

      <style jsx>{`
        .florida-link {
          text-shadow: none;
          transition: text-shadow .15s ease, color .15s ease;
        }
        .florida-link:hover,
        .florida-link:focus-visible {
          color: #fff8c2;
          text-shadow:
            0 0 6px rgba(250,204,21,.55),
            0 0 14px rgba(250,204,21,.38),
            0 0 26px rgba(250,204,21,.22);
        }
      `}</style>
    </div>
  );
}
