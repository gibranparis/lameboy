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

/* Vertical nudge to align orb/text with your central code block */
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

/* ---------- RAF cascade with a "white carriage" ---------- */
/* The carriage is a layer we translate with the white sheet so
   the orb + black title feel physically attached to it.        */
function CascadeOverlayRAF({
  durationMs = CASCADE_MS,
  bandsLeadMs = 120,           // bands get a small head-start
  onWhiteProgress,             // (0..1)
  renderWhiteCarriage,         // fn({whiteTxVW})
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
  const whiteTx  = (1 - whiteP) * 100; // +100vw -> 0vw
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  // band staggers (root→crown); evenly spaced to avoid accordion look
  const STAGGERS = [0.00, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
  const FADE_START_LOCAL = 0.80;

  return createPortal(
    <>
      {/* WHITE sheeting layer */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          transform: `translate3d(${whiteTx}vw,0,0)`,
          background: '#fff',
          zIndex: 10000,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {/* Anything returned by renderWhiteCarriage rides WITH the white */}
        {renderWhiteCarriage?.({ whiteTxVW: whiteTx })}
      </div>

      {/* COLOR BANDS (balanced motion) */}
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
        textTransform: 'none',                  // exact casing: Florida, USA
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
  const labelRef  = useRef(null);
  const locked    = useRef(false);

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

  const idleText   = 'Florida, USA'; // exact casing per request
  const activeText = 'LAMEBOY, USA';

  return (
    <div
      className="lb-screen"
      style={{ display:'grid', placeItems:'center', position:'relative' }}
    >
      {/* Center stack (orb over label) */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', transform:`translateY(${ORB_SHIFT_VH}vh)` }}>
        <div
          aria-hidden
          style={{ lineHeight:0, marginBottom:10 }}
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
        </div>

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
            textTransform: 'none', // Florida, USA
            fontSize: 'clamp(13px,1.8vw,17px)',
            color: hovered ? '#ffff00' : '#111',
            textShadow: hovered
              ? `0 0 8px rgba(255,255,0,.85), 0 0 18px rgba(255,255,0,.55), 0 0 34px rgba(255,255,0,.35)`
              : `0 0 8px rgba(255,255,255,.30), 0 0 18px rgba(255,255,255,.18)`,
            padding:'2px 6px',
            borderRadius: 6,
          }}
        >
          {clicked ? activeText : idleText}
        </button>
      </div>

      {/* Cascade phase */}
      {phase === 'cascade' && (
        <CascadeOverlayRAF
          onWhiteProgress={setWhiteP}
          renderWhiteCarriage={({ whiteTxVW }) => (
            // This group is *attached* to the white sheet.
            <div
              aria-hidden
              style={{
                position:'fixed',
                left:'50%',
                top:`calc(50% + ${ORB_SHIFT_VH}vh)`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10004, // above the white, below the floating white title
                pointerEvents:'none',
                lineHeight:0,
              }}
            >
              {/* Orb riding on white */}
              <div style={{ display:'grid', placeItems:'center', marginBottom:10 }}>
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
              {/* Black title riding on white */}
              <div
                style={{
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  textTransform: 'none',
                  fontSize: 'clamp(12px,1.6vw,16px)',
                  color: '#000',
                  textShadow: `0 0 4px rgba(0,0,0,.45), 0 0 10px rgba(0,0,0,.35)`,
                }}
              >
                {activeText}
              </div>
            </div>
          )}
        />
      )}

      {/* White floating title PRIOR to white arrival (over bands) */}
      {phase === 'cascade' && whiteP <= 0.05 && (
        <FloatingTitle x={x} y={y} text={idleText} color="#ffffff" glow={false} z={10002} />
      )}

      {/* White hold */}
      {phase === 'white' && (
        <>
          <WhiteHold />
          {/* Keep the orb + black title centered on the white hold */}
          <div
            aria-hidden
            style={{
              position:'fixed',
              left:'50%',
              top:`calc(50% + ${ORB_SHIFT_VH}vh)`,
              transform:'translate(-50%, -50%)',
              zIndex:10005,
              pointerEvents:'none',
              lineHeight:0,
            }}
          >
            <div style={{ display:'grid', placeItems:'center', marginBottom:10 }}>
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
            <div
              style={{
                fontWeight: 800,
                letterSpacing: '.08em',
                textTransform: 'none',
                fontSize: 'clamp(12px,1.6vw,16px)',
                color:'#000',
                textShadow:`0 0 4px rgba(0,0,0,.45), 0 0 10px rgba(0,0,0,.35)`,
              }}
            >
              {activeText}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
