// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;    // total cascade duration
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

/* Easing helpers */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuad  = (t) => 1 - (1 - t) * (1 - t);

/* rAF-timed cascade (glow bands + white sheet) */
function CascadeOverlayRAF({
  durationMs = CASCADE_MS,
  bandsLeadMs = 180,             // white starts slightly after bands
  fadeOutStart = 0.85,           // when bands begin to fade
  onWhiteProgress,               // reports 0..1 progress of the white sheet
}) {
  const [p, setP] = useState(0); // 0..1 master progress
  const raf = useRef(0);
  const t0 = useRef(0);
  const cbRef = useRef(onWhiteProgress);
  useEffect(() => { cbRef.current = onWhiteProgress; }, [onWhiteProgress]);

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

  // Bands progress (+100vw -> 0vw)
  const pb = easeOutCubic(Math.min(1, (p * durationMs) / (durationMs - bandsLeadMs)));
  const bandsTx = (1 - pb) * 100;
  const bandsOpacity = p < fadeOutStart ? 1 : Math.max(0, 1 - (p - fadeOutStart) / (1 - fadeOutStart));

  // White sheet progress (+100% -> 0%)
  const pwRaw = Math.max(0, (p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const pw = easeOutQuad(Math.min(1, pwRaw));
  const whiteTx = (1 - pw) * 100;

  // notify parent to flip title color early
  useEffect(() => { cbRef.current?.(pw); }, [pw]);

  return createPortal(
    <>
      {/* bands ABOVE white during sweep */}
      <div
        className="chakra-overlay"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${bandsTx}vw,0,0)`,
          opacity: bandsOpacity,
          zIndex: 10001,              // bands on top during sweep
          pointerEvents: 'none',
          willChange: 'transform,opacity',
        }}
      >
        <div className="chakra-band chakra-root" />
        <div className="chakra-band chakra-sacral" />
        <div className="chakra-band chakra-plexus" />
        <div className="chakra-band chakra-heart" />
        <div className="chakra-band chakra-throat" />
        <div className="chakra-band chakra-thirdeye" />
        <div className="chakra-band chakra-crown" />
      </div>

      {/* white UNDER bands during sweep */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 10000,              // under bands here
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
    </>,
    document.body
  );
}

/* floating title (stays mounted) */
function FloatingTitle({ x, y, text, color, glow = false, z = 10003 }) {
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
        fontSize: 'clamp(12px,1.3vw,14px)',
        fontFamily: 'inherit',
        color,
        textShadow: glow
          ? `0 0 6px rgba(255,255,255,.8),
             0 0 14px rgba(255,255,255,.55),
             0 0 26px rgba(255,255,255,.35)`
          : 'none',
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* white hold above everything except title */
function WhiteHold() {
  return createPortal(
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 10002, pointerEvents: 'none' }}
    />,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → white → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [whiteP, setWhiteP] = useState(0);        // 0..1 white-sheet progress
  const btnRef = useRef(null);
  const labelRef = useRef(null);
  const locked = useRef(false);

  const { x, y } = useCenter(labelRef);
  const SEAFOAM = '#32ffc7';

  const start = useCallback(() => {
    if (locked.current || phase !== 'idle') return;
    locked.current = true;
    setClicked(true);
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    const t1 = setTimeout(() => setPhase('white'), CASCADE_MS);
    const t2 = setTimeout(() => {
      setPhase('done');
      onCascadeComplete?.();
    }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, onCascadeComplete]);

  const labelText = clicked ? 'LAMEBOY, USA' : 'Florida, USA';

  // flip to black as soon as white is ~5% into frame
  const titleColor = whiteP > 0.05 ? '#000' : '#fff';
  const titleGlow  = whiteP <= 0.05; // glow only while still mostly dark

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

      {/* Base label */}
      <button
        ref={labelRef}
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={start}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && start()}
        title="Enter"
        style={{
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          fontWeight: 800,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          fontSize: 'clamp(12px,1.3vw,14px)',
          fontFamily: 'inherit',
          color: hovered ? '#ffe600' : '#ffffff',
          textShadow: hovered
            ? `0 0 6px rgba(255,230,0,.9),
               0 0 14px rgba(255,200,0,.65),
               0 0 32px rgba(255,180,0,.45),
               0 0 52px rgba(255,170,0,.30)`
            : `0 0 8px rgba(255,255,255,.55),
               0 0 18px rgba(255,255,255,.38)`,
        }}
      >
        {labelText}
      </button>

      {/* Overlays */}
      {phase === 'cascade' && (
        <CascadeOverlayRAF
          onWhiteProgress={setWhiteP}   // report white progress to flip title early
          bandsLeadMs={200}             // small head start for bands (tweak 180–260 if needed)
        />
      )}
      {phase === 'white' && <WhiteHold />}

      {/* Title stays above both layers; flips to black as soon as white appears */}
      {phase !== 'idle' && (
        <FloatingTitle
          x={x}
          y={y}
          text="LAMEBOY, USA"
          color={titleColor}
          glow={titleGlow}
          z={10003}
        />
      )}
    </div>
  );
}
