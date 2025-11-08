// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;    // color bands + white sweep duration
const WHITE_HOLD_MS = 520;  // white screen hold

/* ---------------- helpers ---------------- */
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
    window.addEventListener('resize', onResize);
    const id = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);
  return pt;
}

/* rAF-timed cascade (glow bands + white sheet) */
function CascadeOverlayRAF({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0); // 0..1
  const raf = useRef(0);
  const t0 = useRef(0);

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

  // white translates from +100% → 0
  const whiteTx = (1 - p) * 100;

  // color bands slide in a bit earlier than white, then fade
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;
  const bandsOpacity = p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);

  return createPortal(
    <>
      {/* bands */}
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

      {/* white sheet */}
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

/* floating title portal (used during overlays) */
function FloatingTitle({ x, y, text, color, glow = false, z = 10001 }) {
  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: z,
        pointerEvents: 'none',
        fontWeight: 800,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        fontSize: 'clamp(11px,1.3vw,14px)',
        color,
        textShadow: glow
          ? `
            0 0 6px   rgba(255,255,255,0.80),
            0 0 14px  rgba(255,255,255,0.55),
            0 0 26px  rgba(255,255,255,0.35)
          `
          : 'none',
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* white hold layer */
function WhiteHold({ x, y, text }) {
  return createPortal(
    <>
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 10002, pointerEvents: 'none' }}
      />
      <FloatingTitle x={x} y={y} text={text} color="#000" glow={false} z={10003} />
    </>,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → white → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);
  const labelRef = useRef(null);
  const locked = useRef(false); // prevents double starts

  const { x, y } = useCenter(labelRef);

  const SEAFOAM = '#32ffc7';

  const start = useCallback(() => {
    if (locked.current || phase !== 'idle') return;
    locked.current = true;
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // move to white hold, then reveal
    const t1 = setTimeout(() => setPhase('white'), CASCADE_MS);
    const t2 = setTimeout(() => {
      setPhase('done');
      onCascadeComplete?.();
    }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, onCascadeComplete]);

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* ORB — 30% bigger */}
      <button
        ref={btnRef}
        type="button"
        aria-label="Orb"
        onClick={(e) => e.preventDefault()}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 12 }}
        title="Click the label below to enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.95}
          includeZAxis
          height="94px"
          interactive={false}
        />
      </button>

      {/* Base label (hidden during overlays to avoid overlaps) */}
      <button
        ref={labelRef}
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={start}
        title="Enter"
        style={{
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          fontWeight: 800,
          letterSpacing: '.02em',
          // Arcade-neon yellow when hovered
          color: hovered ? '#ffe600' : '#ffffff',
          textShadow: hovered
            ? `
              0 0 6px   rgba(255,230,0,0.90),
              0 0 14px  rgba(255,200,0,0.65),
              0 0 32px  rgba(255,180,0,0.45),
              0 0 52px  rgba(255,170,0,0.30)
            `
            : `
              0 0 8px rgba(255,255,255,.55),
              0 0 18px rgba(255,255,255,.38)
            `,
        }}
      >
        {hovered ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      {/* Overlays */}
      {phase === 'cascade' && (
        <>
          <FloatingTitle x={x} y={y} text="LAMEBOY, USA" color="#fff" glow />
          <CascadeOverlayRAF />
        </>
      )}
      {phase === 'white' && <WhiteHold x={x} y={y} text="LAMEBOY, USA" />}
    </div>
  );
}
