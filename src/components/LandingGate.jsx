// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS    = 2400; // total cascade duration
const BANDS_LEAD_MS = 200;  // white sheet starts AFTER bands lead
const WHITE_HOLD_MS = 520;  // extra hold before curtain takes over
const SEAFOAM       = '#32ffc7';

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
  bandsLeadMs = BANDS_LEAD_MS,
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

  // Staggers for 7 bands
  const STAGGERS = [0.00, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
  const FADE_LOCAL = 0.78;

  // White sheet progress (starts only AFTER bandsLeadMs)
  const whiteRaw = clamp01((p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const whiteP   = easeOutCubic(whiteRaw);
  const whiteTx  = (1 - whiteP) * 100; // +100% -> 0%
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  return createPortal(
    <>
      {/* WHITE sheet UNDER the bands—offscreen until whiteRaw > 0 */}
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
          visibility: whiteRaw <= 0 ? 'hidden' : 'visible', // <-- never flashes early
        }}
      />
      {/* BANDS ABOVE white */}
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
          const tx      = (1 - move) * 100; // +100vw → 0
          const opacity = local < FADE_LOCAL ? 1 : clamp01(1 - (local - FADE_LOCAL) / (1 - FADE_LOCAL));
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

/* Floating title that sticks to the label’s center */
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
        fontWeight: 700,
        letterSpacing: '.06em',
        fontSize: 'clamp(12px,1.3vw,14px)',
        fontFamily: 'inherit',
        color,
        textShadow: glow
          ? `0 0 8px rgba(255,255,255,.95),
             0 0 18px rgba(255,255,255,.65),
             0 0 28px rgba(255,255,255,.35)`
          : '0 0 0 transparent',
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* White curtain that holds until shop is ready, then fades out */
function WhiteCurtain({ x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setVisible(false);
      setTimeout(() => onDone?.(), 280); // give fade time
    };

    const onReady = () => finish();
    window.addEventListener('lb:shop-ready', onReady, { once: true });

    // safety timeout in case ready never comes
    const failSafe = setTimeout(finish, 2200);

    return () => { clearTimeout(failSafe); window.removeEventListener('lb:shop-ready', onReady); };
  }, [onDone]);

  if (!visible) return null;

  return createPortal(
    <>
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0, background:'#fff', zIndex:10002,
          transition:'opacity .28s ease',
          opacity: 1,
          pointerEvents:'none',
        }}
      />
      <FloatingTitle x={x} y={y} text="LAMEBOY, USA" color="#000" glow={false} z={10003} />
    </>,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → hold → curtain → done
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

    const t1 = setTimeout(() => setPhase('hold'), CASCADE_MS);
    const t2 = setTimeout(() => setPhase('curtain'), CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Title behavior
  const idleText   = 'Florida, USA';
  const finalText  = 'LAMEBOY, USA';

  // During cascade: keep title GLOWING WHITE; flip to black only when the white sheet is well in.
  const WHITE_FLIP_THRESHOLD = 0.68; // <-- tune: later = flips later
  const titleColor = whiteP >= WHITE_FLIP_THRESHOLD ? '#000' : '#fff';
  const titleGlow  = whiteP < WHITE_FLIP_THRESHOLD;    // glow only before flip

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,                         // tight stack: orb ↔ time ↔ label
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* ORB — always visible; sits *above* white & bands */}
      <div
        aria-hidden
        style={{
          position: 'relative',
          zIndex: 10004, // above white + bands + title
          lineHeight: 0,
          marginBottom: 2,
        }}
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={0.95}
          includeZAxis
          height="88px"
          interactive={false}
        />
      </div>

      {/* Time (Naples) — centered, tighter spacing to the label */}
      <ClockNaples />

      {/* Clickable label under time (only visible before cascade) */}
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
          fontFamily: 'inherit',
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
      {phase === 'cascade' && (
        <CascadeOverlayRAF bandsLeadMs={BANDS_LEAD_MS} onWhiteProgress={setWhiteP} />
      )}

      {/* Floating title attached to label center during cascade/hold */}
      {(phase === 'cascade' || phase === 'hold') && (
        <FloatingTitle
          x={x}
          y={y}
          text={clicked ? finalText : idleText}
          color={titleColor}
          glow={titleGlow}
          z={10003}
        />
      )}

      {/* After the band pass, hold a pure white curtain until shop says “ready” */}
      {phase === 'curtain' && (
        <WhiteCurtain
          x={x}
          y={y}
          onDone={() => {
            setPhase('done');
            // signal parent to mount the shop if needed
            try { onCascadeComplete?.(); } catch {}
          }}
        />
      )}
    </div>
  );
}

/** Naples clock (America/New_York) — monospace like “Florida, USA” */
function ClockNaples() {
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
      style={{
        font: '800 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        letterSpacing: '.06em',
      }}
    >
      {now}
    </div>
  );
}
