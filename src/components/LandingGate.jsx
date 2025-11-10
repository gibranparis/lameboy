// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS    = 2400;
const WHITE_HOLD_MS = 520;
const SEAFOAM       = '#32ffc7';

/* -------- clock (Naples FL, 12-hr monospace) -------- */
function ClockNaples({ hidden }) {
  const [now, setNow] = useState('');
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }).format(new Date())
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      aria-hidden={hidden}
      style={{
        visibility: hidden ? 'hidden' : 'visible',
        font: '800 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        letterSpacing: '.06em',
        marginTop: 2,
      }}
    >
      {now}
    </div>
  );
}

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

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ---------- RAF-driven CASCADE (white under, bands over) ---------- */
function CascadeOverlayRAF({
  durationMs = CASCADE_MS,
  bandsLeadMs = 200,
  onWhiteProgress,
}) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const t0  = useRef(0);
  const cb  = useRef(onWhiteProgress);
  useEffect(() => { cb.current = onWhiteProgress; }, [onWhiteProgress]);

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

  const STAGGERS = [0.00, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
  const FADE_LOCAL = 0.78;

  // white sheet progress
  const whiteRaw = clamp01((p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const whiteP   = easeOutCubic(whiteRaw);
  const whiteTx  = (1 - whiteP) * 100;
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  return createPortal(
    <>
      {/* white sheet under */}
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
      {/* colored bands over */}
      <div
        className="chakra-overlay"
        data-js-cascade="raf"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          gridTemplateColumns: 'repeat(7, 1fr)',
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
          const offset  = STAGGERS[i];
          const local   = clamp01((p - offset) / (1 - offset));
          const move    = easeOutCubic(local);
          const tx      = (1 - move) * 100;
          const opacity = local < FADE_LOCAL ? 1 : clamp01(1 - (local - FADE_LOCAL) / (1 - FADE_LOCAL));
          return (
            <div
              key={cls}
              className={`chakra-band ${cls}`}
              style={{ transform: `translate3d(${tx}vw,0,0)`, opacity, willChange: 'transform,opacity' }}
            />
          );
        })}
      </div>
    </>,
    document.body
  );
}

/* Floating title pinned to the label’s center; inverts on white */
function FloatingTitle({ x, y, text, whiteProgress }) {
  const color = whiteProgress > 0.05 ? '#000' : '#fff';
  const glow  = whiteProgress <= 0.05;
  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10003,
        pointerEvents: 'none',
        fontWeight: 700,
        letterSpacing: '.06em',
        fontSize: 'clamp(12px,1.3vw,14px)',
        color,
        textShadow: glow
          ? `0 0 6px rgba(255,255,255,.8),
             0 0 14px rgba(255,255,255,.55),
             0 0 24px rgba(255,255,255,.35)`
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
    <div aria-hidden style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 10002, pointerEvents: 'none' }} />,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → white → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [whiteP, setWhiteP] = useState(0);
  const [clicked, setClicked] = useState(false);
  const labelRef = useRef(null);
  const locked = useRef(false);

  const { x, y } = useCenter(labelRef);

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

  const idleText  = 'Florida, USA';
  const finalText = 'LAMEBOY, USA';

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,               // tighter: orb ↔ clock ↔ label
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* ORB — always visible */}
      <div aria-hidden style={{ position: 'relative', zIndex: 10004, lineHeight: 0 }}>
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.95}
          includeZAxis
          height="96px"
          interactive={false}
        />
      </div>

      {/* CLOCK — visible ONLY on the landing (idle) */}
      <ClockNaples hidden={phase !== 'idle'} />

      {/* Clickable label under orb (only visible before cascade) */}
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
          fontWeight: 700,
          letterSpacing: '.06em',
          fontSize: 'clamp(12px,1.3vw,14px)',
          color: hovered ? '#ffe600' : '#ffffff',
          textShadow: hovered
            ? `0 0 8px rgba(255,230,0,.95),
               0 0 18px rgba(255,210,0,.70),
               0 0 28px rgba(255,200,0,.45)`
            : `0 0 8px rgba(255,255,255,.45),
               0 0 16px rgba(255,255,255,.30)`,
          marginTop: -2,
        }}
      >
        {idleText}
      </button>

      {/* Overlays */}
      {phase === 'cascade' && <CascadeOverlayRAF bandsLeadMs={200} onWhiteProgress={setWhiteP} />}
      {phase === 'white' && <WhiteHold />}

      {/* Floating title (white ↔ black) pinned to label center */}
      {phase !== 'idle' && (
        <FloatingTitle
          x={x}
          y={y}
          text={clicked ? finalText : idleText}
          whiteProgress={whiteP}
        />
      )}

      <style jsx>{`
        :global(:root[data-mode="gate"]) .chakra-band { min-height: 100%; }
      `}</style>
    </div>
  );
}
