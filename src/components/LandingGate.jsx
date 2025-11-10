// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

/* =================== Timings =================== */
const CASCADE_MS    = 2400; // total cascade duration
const WHITE_HOLD_MS = 520;  // white screen hold after sweep

/* Vertical nudge so the orb sits where your middle text block is.
   Increase to push the orb LOWER, decrease to raise it. */
const ORB_SHIFT_VH = 8;

/* =================== Helpers =================== */
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

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01      = (v) => Math.max(0, Math.min(1, v));

/* ---------- RAF cascade (bands over white) ---------- */
function CascadeOverlayRAF({
  durationMs = CASCADE_MS,
  bandsLeadMs = 200,            // white begins slightly after bands start moving
  onWhiteProgress,
}) {
  const [p, setP] = useState(0); // 0..1 master
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

  // white underlay progress
  const whiteRaw = clamp01((p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const whiteP   = easeOutCubic(whiteRaw);
  const whiteTx  = (1 - whiteP) * 100; // +100% -> 0%
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  // band staggers (root→crown)
  const STAGGERS = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
  const FADE_START_LOCAL = 0.78;

  return createPortal(
    <>
      {/* WHITE (under bands while sweeping) */}
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

      {/* BANDS (above white) */}
      <div
        className="chakra-overlay"
        aria-hidden
        data-js-cascade="raf"
        style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}
      >
        {[
          'chakra-root','chakra-sacral','chakra-plexus',
          'chakra-heart','chakra-throat','chakra-thirdeye','chakra-crown',
        ].map((cls, i) => {
          const off   = STAGGERS[i];
          const local = clamp01((p - off) / (1 - off));       // each band’s 0..1
          const move  = easeOutCubic(local);
          const tx    = (1 - move) * 100;                     // +100vw -> 0
          const opacity = local < FADE_START_LOCAL
            ? 1
            : clamp01(1 - (local - FADE_START_LOCAL) / (1 - FADE_START_LOCAL));
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

/* Floating title (stays mounted through overlays) */
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
        fontSize: 'clamp(12px,1.6vw,16px)',
        color,
        textShadow: glow
          ? `0 0 4px rgba(0,0,0,.50), 0 0 10px rgba(0,0,0,.40)`
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

/* =================== Main =================== */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → white → done
  const [phase,   setPhase]   = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [whiteP,  setWhiteP]  = useState(0);
  const btnRef   = useRef(null);
  const labelRef = useRef(null);
  const locked   = useRef(false);

  const { x, y } = useCenter(labelRef);
  const SEAFOAM  = '#32ffc7';

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

  const labelText  = clicked ? 'LAMEBOY, USA' : 'Florida, USA';
  const titleColor = whiteP > 0.05 ? '#000' : '#fff';
  const titleGlow  = whiteP > 0.05; // black glow on white hold

  return (
    <div
      className="lb-screen"
      style={{
        display:'grid',
        placeItems:'center',
        position:'relative',
      }}
    >
      {/* Stack orb + label; orb nudged down to align with your central code block */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', transform:`translateY(${ORB_SHIFT_VH}vh)` }}>
        {/* ORB */}
        <button
          ref={btnRef}
          type="button"
          aria-label="Orb"
          onClick={(e) => e.preventDefault()}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 10 }}
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

        {/* LABEL: bold, highly legible; true yellow glow on hover/active */}
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
            fontWeight: 900,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontSize: 'clamp(13px,1.8vw,17px)',
            color: hovered ? '#ffff00' : '#111',               // more legible at rest on day; night gets shadow
            textShadow: hovered
              ? `
                 0 0 8px rgba(255,255,0, .85),
                 0 0 18px rgba(255,255,0, .55),
                 0 0 34px rgba(255,255,0, .35)
                `
              : `
                 0 0 8px rgba(255,255,255,.30),
                 0 0 18px rgba(255,255,255,.18)
                `,
            padding:'2px 6px',
            borderRadius: 6,
          }}
        >
          {labelText}
        </button>
      </div>

      {/* Overlays */}
      {phase === 'cascade' && (
        <>
          {/* Keep orb visible as a loading cue ABOVE bands/white */}
          <div
            aria-hidden
            style={{
              position:'fixed', left:'50%', top:`calc(50% + ${ORB_SHIFT_VH}vh)`,
              transform:'translate(-50%, -50%)',
              zIndex:10004, pointerEvents:'none', lineHeight:0
            }}
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
          </div>

          <CascadeOverlayRAF onWhiteProgress={setWhiteP} />
        </>
      )}
      {phase === 'white' && (
        <>
          {/* Keep orb visible during white hold */}
          <div
            aria-hidden
            style={{
              position:'fixed', left:'50%', top:`calc(50% + ${ORB_SHIFT_VH}vh)`,
              transform:'translate(-50%, -50%)',
              zIndex:10004, pointerEvents:'none', lineHeight:0
            }}
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
          </div>

          <WhiteHold />
          {/* LAMEBOY, USA in black with a subtle black glow on white */}
          <FloatingTitle x={x} y={y} text="LAMEBOY, USA" color={titleColor} glow={titleGlow} z={10005} />
        </>
      )}

      {/* During cascade (before white > 5%), we show the floating title as white. */}
      {phase === 'cascade' && whiteP <= 0.05 && (
        <FloatingTitle x={x} y={y} text="LAMEBOY, USA" color="#fff" glow={false} z={10003} />
      )}
    </div>
  );
}
