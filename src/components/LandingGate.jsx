// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS    = 2400; // bands + white sweep
const WHITE_HOLD_MS = 520;

/* ---------------- utilities ---------------- */
function useCenter(ref) {
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, []);
  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize, { passive: true });
    const id = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);
  return pt;
}

/* rAF cascade: chakra bands + white sheet */
function CascadeOverlayRAF({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const t0  = useRef(0);

  useEffect(() => {
    const step = (t) => {
      if (!t0.current) t0.current = t;
      const k = Math.min(1, (t - t0.current) / durationMs);
      setP(k);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [durationMs]);

  const whiteTx = (1 - p) * 100;                        // % of viewport width
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // vw
  const bandsOpacity = p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);

  return createPortal(
    <>
      {/* Chakra bands with neon bloom */}
      <div
        className="chakra-overlay"
        aria-hidden
        style={{ transform: `translate3d(${bandsTx}vw,0,0)`, opacity: bandsOpacity }}
      >
        <div className="chakra-band chakra-root" />
        <div className="chakra-band chakra-sacral" />
        <div className="chakra-band chakra-plexus" />
        <div className="chakra-band chakra-heart" />
        <div className="chakra-band chakra-throat" />
        <div className="chakra-band chakra-thirdeye" />
        <div className="chakra-band chakra-crown" />
      </div>

      {/* White sheet pass */}
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
        }}
      />
    </>,
    document.body
  );
}

/* Floating title portal (for overlays) */
function FloatingTitle({ x, y, text, color, neon = false, z = 10001 }) {
  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed',
        left: x, top: y,
        transform: 'translate(-50%,-50%)',
        zIndex: z, pointerEvents: 'none',
        fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
        fontSize: 'clamp(11px,1.3vw,14px)',
        color,
        textShadow: neon
          ? `
            0 0 8px rgba(255,255,255,.95),
            0 0 18px rgba(255,255,255,.85),
            0 0 42px rgba(255,255,255,.75)`
          : 'none',
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* White hold layer with black title */
function WhiteHold({ x, y, text }) {
  return createPortal(
    <>
      <div aria-hidden style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }} />
      <FloatingTitle x={x} y={y} text={text} color="#000" neon={false} z={10003} />
    </>,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascading → white → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [armed, setArmed]     = useState(false); // after click, lock wording to LAMEBOY, USA
  const labelRef = useRef(null);
  const { x, y } = useCenter(labelRef);
  const SEAFOAM = '#32ffc7';
  const rootRef = useRef(null);

  // reflect phase on <html> for optional global styling hooks
  useEffect(() => {
    try { document.documentElement.dataset.cascade = phase === 'cascading' ? 'true' : 'false'; } catch {}
    return () => { try { delete document.documentElement.dataset.cascade; } catch {} };
  }, [phase]);

  const startCascade = useCallback(() => {
    if (phase !== 'idle') return;
    setArmed(true);           // switch label to LAMEBOY, USA immediately
    setPhase('cascading');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade','1'); } catch {}

    const t1 = setTimeout(() => setPhase('white'), CASCADE_MS);
    const t2 = setTimeout(() => {
      setPhase('done');
      onCascadeComplete?.();
    }, CASCADE_MS + WHITE_HOLD_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, onCascadeComplete]);

  return (
    <div
      ref={rootRef}
      className="page-center"
      style={{
        minHeight:'100dvh',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:14, padding:'1.5rem', position:'relative',
        touchAction:'manipulation',
      }}
    >
      {/* ORB — 30% larger */}
      <button
        type="button"
        aria-label="Orb"
        onClick={(e) => e.preventDefault()}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight:0, background:'transparent', border:0, padding:0, marginBottom:12 }}
        title="Click the label below to enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.96}
          includeZAxis
          height="94px"
          interactive={false}
        />
      </button>

      {/* Base label (hidden during overlay phases) */}
      <button
        ref={labelRef}
        type="button"
        disabled={phase !== 'idle'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={startCascade}
        title="Enter"
        className={`lb-landing-label ${hovered || armed ? 'is-neon' : ''}`}
        style={{
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          background:'transparent', border:0, cursor:'pointer',
          fontWeight:800, letterSpacing:'.08em',
        }}
      >
        {hovered || armed ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      {/* Overlays */}
      {phase === 'cascading' && (
        <>
          <FloatingTitle x={x} y={y} text="LAMEBOY, USA" color="#fff" neon />
          <CascadeOverlayRAF />
        </>
      )}
      {phase === 'white' && <WhiteHold x={x} y={y} text="LAMEBOY, USA" />}

      {/* Local neon styles */}
      <style jsx>{`
        .lb-landing-label {
          color: #ffffff;
          text-shadow:
            0 0 10px rgba(255,255,255,.50),
            0 0 22px rgba(255,255,255,.35);
          transition: color .22s ease, text-shadow .22s ease, transform .22s ease;
        }
        .lb-landing-label.is-neon {
          /* Arcade neon yellow (bright core + strong halo) */
          color: #fffdb4;
          text-shadow:
            0 0 6px rgba(255, 255, 140, 0.95),
            0 0 14px rgba(255, 255, 120, 0.85),
            0 0 28px rgba(255, 255, 90, 1),
            0 0 48px rgba(255, 245, 120, 0.85);
          transform: scale(1.04);
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-landing-label, .lb-landing-label.is-neon { transform:none; }
        }

        /* Chakra overlay shell (neon bloom like your cascade) */
        :global(.chakra-overlay) {
          position: fixed;
          top: 0; left: 0;
          height: 100vh; width: 120vw; /* matches COLOR_VW */
          z-index: 9999; pointer-events: none;
          will-change: transform, opacity;
        }
        :global(.chakra-overlay) > :global(.chakra-band) {
          position: absolute; top: 0; bottom: 0;
          width: calc(120vw / 7);
        }
        :global(.chakra-root)    { left: calc(0  * (120vw/7)); background:#ef4444; }
        :global(.chakra-sacral)  { left: calc(1  * (120vw/7)); background:#f97316; }
        :global(.chakra-plexus)  { left: calc(2  * (120vw/7)); background:#facc15; }
        :global(.chakra-heart)   { left: calc(3  * (120vw/7)); background:#22c55e; }
        :global(.chakra-throat)  { left: calc(4  * (120vw/7)); background:#3b82f6; }
        :global(.chakra-thirdeye){ left: calc(5  * (120vw/7)); background:#4f46e5; }
        :global(.chakra-crown)   { left: calc(6  * (120vw/7)); background:#c084fc; }

        /* Neon blur bloom for the bands */
        :global(.chakra-overlay) > :global(.chakra-band)::after {
          content:'';
          position:absolute; inset:-16px;
          filter: blur(28px);
          background: inherit;
          opacity: .95;
        }
      `}</style>
    </div>
  );
}
