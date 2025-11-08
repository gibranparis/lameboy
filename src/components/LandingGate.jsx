// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;         // colored bands duration
const WHITE_HOLD_MS = 520;       // how long to hold the white screen with black text

/* ---------- Utility: track the center of the trigger button ---------- */
function useCenterPoint(ref) {
  const [pt, setPt] = useState({ x: 0, y: 0, ready: false });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPt({ x: r.left + r.width / 2, y: r.top + r.height / 2, ready: true });
  }, [ref]);

  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    const id = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [measure]);

  return pt;
}

/* ---------- Bands + white sweep overlay ---------- */
function CascadeOverlay({ durationMs = CASCADE_MS }) {
  return createPortal(
    <>
      {/* 7 chakra bars — uses global .chakra-* glow */}
      <div className="chakra-overlay" aria-hidden="true">
        <div className="chakra-band chakra-root" />
        <div className="chakra-band chakra-sacral" />
        <div className="chakra-band chakra-plexus" />
        <div className="chakra-band chakra-heart" />
        <div className="chakra-band chakra-throat" />
        <div className="chakra-band chakra-thirdeye" />
        <div className="chakra-band chakra-crown" />
      </div>

      {/* white sheet sweeps in from right */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          translate: '100% 0',
          animation: `lb-white-sweep ${durationMs}ms ease-out forwards`,
          background: '#fff',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />
      <style jsx>{`
        @keyframes lb-white-sweep {
          0%   { transform: translateX(100%); }
          40%  { transform: translateX(30%); }
          70%  { transform: translateX(10%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </>,
    document.body
  );
}

/* ---------- Floating title that follows the trigger position ---------- */
function FloatingTitle({ x, y, color, text }) {
  if (!x && !y) return null;
  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        pointerEvents: 'none',
        fontWeight: 800,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        fontSize: 'clamp(11px,1.3vw,14px)',
        color,
        textShadow:
          color === '#fff'
            ? '0 0 6px rgba(255,255,255,.7), 0 0 14px rgba(255,255,255,.45), 0 0 26px rgba(255,255,255,.3)'
            : 'none',
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* ---------- White hold with black title centered at same point ---------- */
function WhiteHold({ x, y, text, ms = WHITE_HOLD_MS }) {
  return createPortal(
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: '#fff',
          zIndex: 10002,
          pointerEvents: 'none',
        }}
      />
      <FloatingTitle x={x} y={y} color="#000" text={text} />
    </>,
    document.body
  );
}

export default function LandingGate({ onCascadeComplete }) {
  // Visual states
  const [hovered, setHovered] = useState(false);       // hover flips Florida → LAMEBOY (yellow)
  const [phase, setPhase] = useState('idle');          // 'idle' | 'cascade' | 'white' | 'done'
  // idle: Florida white (hover shows LAMEBOY yellow)
  // cascade: LAMEBOY white over color bands
  // white: white screen with LAMEBOY black, then reveal

  const linkRef = useRef(null);
  const { x, y, ready } = useCenterPoint(linkRef);

  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';

  // Start the full sequence
  const triggerCascade = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // After colored bands, hold a white screen with black title
    setTimeout(() => setPhase('white'), CASCADE_MS);
    // Then reveal shop
    setTimeout(() => {
      setPhase('done');
      onCascadeComplete?.();
    }, CASCADE_MS + WHITE_HOLD_MS);
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
        padding: '1.5rem',
        position: 'relative',
        gap: 12,
      }}
    >
      {/* ORB — 30% larger than before (≈ 94px high) */}
      <button
        type="button"
        aria-label="Orb"
        onClick={(e) => e.preventDefault()}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 12 }}
        title="Hold/click label below to enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.95}
          includeZAxis
          height="94px"
          overrideAllColor={null /* stays chakra here */}
          interactive={false}
        />
      </button>

      {/* Florida ↔ LAMEBOY label */}
      <button
        ref={linkRef}
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={triggerCascade}
        title="Enter"
        style={{
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          fontWeight: 800,
          letterSpacing: '.02em',
          // hide the base text while overlays are painting to avoid overlap
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          color:
            hovered && phase === 'idle'
              ? '#c9a800'
              : '#ffffff',
          textShadow:
            hovered && phase === 'idle'
              ? '0 0 6px rgba(255,247,0,.55), 0 0 14px rgba(255,247,0,.35), 0 0 26px rgba(255,247,0,.25)'
              : '0 0 8px rgba(255,255,255,.55), 0 0 18px rgba(255,255,255,.38)',
        }}
      >
        {hovered && phase === 'idle' ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      {/* Overlays according to phase */}
      {phase === 'cascade' && (
        <>
          {ready && <FloatingTitle x={x} y={y} color="#fff" text="LAMEBOY, USA" />}
          <CascadeOverlay />
        </>
      )}

      {phase === 'white' && ready && <WhiteHold x={x} y={y} text="LAMEBOY, USA" />}
    </div>
  );
}
