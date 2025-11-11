// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS     = 2400; // total band pass
const BANDS_LEAD_MS  = 320;  // white starts later so bands clearly lead
const WHITE_HOLD_MS  = 520;  // brief hold before curtain
const SEAFOAM        = '#32ffc7';

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

  const STAGGERS = [0.00, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
  const FADE_LOCAL = 0.80;

  // White sheet progress (begins only after bandsLeadMs)
  const rawWhite = (p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs);
  const whiteRaw = clamp01(rawWhite);
  const whiteP   = easeOutCubic(whiteRaw);
  const whiteTx  = (1 - whiteP) * 100; // +100% -> 0%
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  // Absolutely hide white until it meaningfully exists
  const whiteVisible = whiteRaw > 0.06;

  return createPortal(
    <>
      {/* WHITE under-bands — fully hidden until it actually starts */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 10000,               // under bands, over page
          pointerEvents: 'none',
          willChange: 'transform',
          visibility: whiteVisible ? 'visible' : 'hidden',
        }}
      />
      {/* BANDS above white */}
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

/* Floating title that locks to label center (always above bands/white) */
function FloatingTitle({ x, y, text, color, glow = false, z = 10002 }) {
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

/* White curtain phase:
   - Solid white background
   - Centered stack: black ORB (overrideAllColor='#000'), black TIME, black "LAMEBOY, USA"
   - Fades out when grid signals ready (lb:shop-ready) or after failsafe */
function WhiteCurtain({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setVisible(false);
      setTimeout(() => onDone?.(), 260);
    };

    const onReady = () => finish();
    window.addEventListener('lb:shop-ready', onReady, { once: true });

    // failsafe if grid never signals ready
    const t = setTimeout(finish, 2400);

    return () => { clearTimeout(t); window.removeEventListener('lb:shop-ready', onReady); };
  }, [onDone]);

  if (!visible) return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fff',
        zIndex: 10002,
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity .26s ease',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {/* Centered stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        {/* ORB — black override */}
        <div style={{ lineHeight: 0 }}>
          <BlueOrbCross3D
            rpm={44}
            color={SEAFOAM}
            geomScale={1.12}
            glow
            glowOpacity={1.0}
            includeZAxis
            height="88px"
            interactive={false}
            overrideAllColor="#000000"
          />
        </div>

        {/* TIME — black */}
        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            fontFamily: 'inherit',
            lineHeight: 1.2,
          }}
        >
          <ClockNaples />
        </span>

        {/* LAMEBOY, USA — black */}
        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            fontFamily: 'inherit',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → hold → curtain → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [whiteP, setWhiteP] = useState(0); // reserved for future behavior
  const labelRef = useRef(null);
  const locked = useRef(false);

  // Begin in "gate" mode to prevent background flashes
  useEffect(() => {
    try { document.documentElement.setAttribute('data-mode', 'gate'); } catch {}
    return () => { try { document.documentElement.removeAttribute('data-mode'); } catch {} };
  }, []);

  // Measure label center once
  useCenter(labelRef); // (x,y) not needed anymore for curtain since we render a centered stack

  const start = useCallback(() => {
    if (locked.current || phase !== 'idle') return;
    locked.current = true;
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    const t1 = setTimeout(() => setPhase('hold'), CASCADE_MS);
    const t2 = setTimeout(() => {
      // Enter curtain → also flip mode to shop so globals adopt shop palette
      setPhase('curtain');
      try { document.documentElement.setAttribute('data-mode', 'shop'); } catch {}
    }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Spacing: (orb ↔ time) == (time ↔ Florida)
  const STACK_GAP = 6; // px

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: STACK_GAP,
        padding: '1.5rem',
        position: 'relative',
        // Hide base stack once animation starts; overlays/curtain handle visuals
        visibility: phase === 'idle' ? 'visible' : 'hidden',
      }}
    >
      {/* ORB — clickable Enter */}
      <button
        type="button"
        onClick={start}
        title="Enter"
        aria-label="Enter"
        style={{
          position: 'relative',
          zIndex: 10004,
          lineHeight: 0,
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
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
      </button>

      {/* Timer — same font/size as Florida; white; also clickable Enter */}
      {phase !== 'curtain' && phase !== 'done' && (
        <button
          type="button"
          onClick={start}
          title="Enter"
          aria-label="Enter"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            fontFamily: 'inherit',
            lineHeight: 1.2,
          }}
        >
          <ClockNaples />
        </button>
      )}

      {/* Florida label — clickable Enter, matches timer sizing */}
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
          marginTop: 0,
        }}
      >
        Florida, USA
      </button>

      {/* Overlays */}
      {(phase === 'cascade' || phase === 'hold') && (
        <CascadeOverlayRAF bandsLeadMs={BANDS_LEAD_MS} onWhiteProgress={setWhiteP} />
      )}

      {/* CURTAIN — white bg + black orb/time/label */}
      {phase === 'curtain' && (
        <WhiteCurtain
          onDone={() => {
            setPhase('done');
            try { onCascadeComplete?.(); } catch {}
          }}
        />
      )}

      {/* Safety: ensure bands fill height in gate mode */}
      <style jsx>{`
        :global(:root[data-mode="gate"]) .chakra-band { min-height: 100%; }
      `}</style>
    </div>
  );
}

/** Naples clock (America/New_York) — text only; parent/curtain control rendering */
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
  return <span>{now}</span>;
}
