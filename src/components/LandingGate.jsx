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
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ---------- STAGGERED CASCADE OVERLAY ---------- */
function CascadeOverlayRAF({
  durationMs = CASCADE_MS,
  bandsLeadMs = 180,               // white begins after this delay
  onWhiteProgress,                 // callback with 0..1 progress of white sheet
}) {
  const [p, setP] = useState(0);   // master 0..1
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

  // Per-band stagger (root → crown)
  // Offsets in "progress" units; tune spacing to taste.
  const STAGGERS = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
  const FADE_START_LOCAL = 0.78; // each band fades near the end of its own path

  // --- White sheet (UNDER bands during sweep) ---
  const whiteRaw = clamp01((p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const whiteP = easeOutCubic(whiteRaw);
  const whiteTx = (1 - whiteP) * 100; // +100% -> 0%
  useEffect(() => { cbRef.current?.(whiteP); }, [whiteP]);

  return createPortal(
    <>
      {/* WHITE under bands while sweeping */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 10000,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

      {/* BANDS above white; each with its own offset */}
      <div
        className="chakra-overlay"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          pointerEvents: 'none',
        }}
      >
        {[
          'chakra-root',
          'chakra-sacral',
          'chakra-plexus',
          'chakra-heart',
          'chakra-throat',
          'chakra-thirdeye',
          'chakra-crown',
        ].map((cls, i) => {
          const offset = STAGGERS[i];
          const local = clamp01((p - offset) / (1 - offset));       // band’s own 0..1
          const move = easeOutCubic(local);
          const tx = (1 - move) * 100;                               // +100vw -> 0
          const opacity =
            local < FADE_START_LOCAL
              ? 1
              : clamp01(1 - (local - FADE_START_LOCAL) / (1 - FADE_START_LOCAL));
          return (
            <div
              key={cls}
              className={`chakra-band ${cls}`}
              style={{
                transform: `translate3d(${tx}vw,0,0)`,
                opacity,
                willChange: 'transform,opacity',
              }}
            />
          );
        })}
      </div>
    </>,
    document.body
  );
}

/* floating title (stays mounted; we flip color early) */
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
  const [whiteP, setWhiteP] = useState(0);
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

  // Flip title to black as soon as white shows a little bit
  const titleColor = whiteP > 0.05 ? '#000' : '#fff';
  const titleGlow  = whiteP <= 0.05;

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,                      // tighter vertical spacing
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* ORB — slightly closer to label */}
      <button
        ref={btnRef}
        type="button"
        aria-label="Orb"
        onClick={(e) => e.preventDefault()}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 4 }}
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

      {/* Base label — raised closer to the orb */}
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
          marginTop: -2,            // nudge upward
        }}
      >
        {labelText}
      </button>

      {/* Overlays */}
      {phase === 'cascade' && (
        <CascadeOverlayRAF
          bandsLeadMs={200}         // small head-start for bands
          onWhiteProgress={setWhiteP}
        />
      )}
      {phase === 'white' && <WhiteHold />}

      {/* Persistent title (raised with the label center point) */}
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
