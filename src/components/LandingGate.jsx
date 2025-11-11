// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

/* =============================== Timings ================================ */
const CASCADE_MS     = 1800; // duration of band sweep (faster + smoother)
const BANDS_LEAD_MS  = 280;  // white starts a beat AFTER bands begin
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

/* ====================== CSS-driven CASCADE (smooth) ===================== */
/* Bands animate on the compositor (translate3d + opacity), each with a
   uniform duration and a precise stagger. The white sheet slides in under
   the bands with its own delay (BANDS_LEAD_MS). No RAF jank. */
function CascadeOverlayCSS({ onWhiteStart }) {
  useEffect(() => {
    const t = setTimeout(() => onWhiteStart?.(), BANDS_LEAD_MS);
    return () => clearTimeout(t);
  }, [onWhiteStart]);

  return createPortal(
    <>
      {/* WHITE (under) */}
      <div
        aria-hidden
        className="lb-white-under"
        style={{
          position: 'fixed',
          inset: 0,
          background: '#fff',
          zIndex: 10000, // under bands, over page
          pointerEvents: 'none',
          transform: 'translate3d(100%,0,0)',
          animation: `lbWhiteSlide ${CASCADE_MS}ms cubic-bezier(.22,1,.36,1) ${BANDS_LEAD_MS}ms forwards`,
          willChange: 'transform',
        }}
      />

      {/* BANDS (over) */}
      <div
        className="chakra-overlay"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          zIndex: 10001,
          pointerEvents: 'none',
          contain: 'layout paint',
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
        ].map((cls, i) => (
          <div
            key={cls}
            className={`chakra-band ${cls}`}
            style={{
              transform: 'translate3d(100vw,0,0)',
              opacity: 0.001,
              willChange: 'transform,opacity',
              // equal, precise staggering for perfectly even entrance
              animation:
                `lbBandSlide ${CASCADE_MS}ms cubic-bezier(.22,1,.36,1) ${i * 110}ms forwards,` +
                `lbBandFade  ${CASCADE_MS}ms ease-out ${i * 110}ms forwards`,
            }}
          />
        ))}
      </div>

      {/* OVER-BANDS TITLE (white) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10002, // above bands, below curtain
          pointerEvents: 'none',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            fontFamily: 'inherit',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            textShadow:
              '0 0 8px rgba(255,255,255,.85), 0 0 18px rgba(255,255,255,.55), 0 0 28px rgba(255,255,255,.35)',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>

      <style jsx global>{`
        @keyframes lbBandSlide {
          0%   { transform: translate3d(100vw,0,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes lbBandFade {
          0%   { opacity: .001; }
          80%  { opacity: 1; }
          100% { opacity: .999; }
        }
        @keyframes lbWhiteSlide {
          0%   { transform: translate3d(100%,0,0); }
          100% { transform: translate3d(0,0,0); }
        }
        /* Ensure bands fill full height during gate */
        :root[data-mode="gate"] .chakra-band { min-height: 100svh; }
      `}</style>
    </>,
    document.body
  );
}

/* ============================ White curtain ============================= */
/* Solid white + black ORB + black clock + black LAMEBOY, USA.
   Fades out on lb:shop-ready or after failsafe. */
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
        zIndex: 10003, // over cascade
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity .26s ease',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {/* Centered stack */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
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

/* =============================== Component ============================== */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → hold → curtain → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const labelRef = useRef(null);
  const locked = useRef(false);

  // Begin in "gate" mode to prevent background flashes
  useEffect(() => {
    try { document.documentElement.setAttribute('data-mode', 'gate'); } catch {}
    return () => { try { document.documentElement.removeAttribute('data-mode'); } catch {} };
  }, []);

  useCenter(labelRef);

  const start = useCallback(() => {
    if (locked.current || phase !== 'idle') return;
    locked.current = true;
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // Advance to hold and then curtain with precise timings
    const t1 = setTimeout(() => setPhase('hold'), CASCADE_MS);
    const t2 = setTimeout(() => {
      setPhase('curtain');
      try { document.documentElement.setAttribute('data-mode', 'shop'); } catch {}
    }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  const STACK_GAP = 6;

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
        visibility: phase === 'idle' ? 'visible' : 'hidden', // base stack hidden once animation starts
      }}
    >
      {/* ORB — clickable Enter */}
      <button
        type="button"
        onClick={start}
        title="Enter"
        aria-label="Enter"
        style={{ position: 'relative', zIndex: 10004, lineHeight: 0, padding: 0, margin: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}
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

      {/* TIME — white (clickable) */}
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

      {/* Florida label — white (hover = neon yellow) */}
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
            ? `0 0 8px rgba(255,230,0,.95), 0 0 18px rgba(255,210,0,.70), 0 0 28px rgba(255,200,0,.45)`
            : `0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)`,
          marginTop: 0,
        }}
      >
        Florida, USA
      </button>

      {/* Overlays */}
      {(phase === 'cascade' || phase === 'hold') && (
        <CascadeOverlayCSS
          onWhiteStart={() => {
            // White has just begun sliding; nothing to do yet, but hook is here if needed
          }}
        />
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
    </div>
  );
}

/** Naples clock (America/New_York) */
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
