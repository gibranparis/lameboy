'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

/* --------- Follows a target element's center (absolute to viewport) --------- */
function FollowTitle({ targetRef, durationMs = CASCADE_MS }) {
  const [pos, setPos] = useState({ x: 0, y: 0, ready: false });
  const [color, setColor] = useState('#fff'); // white over color bands → then black on white
  const rafRef = useRef(0);

  const measure = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2, ready: true });
  }, [targetRef]);

  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  // Color schedule: white first 65% → black for the white sheet
  useEffect(() => {
    setColor('#fff');
    const t = setTimeout(() => setColor('#000'), Math.round(durationMs * 0.65));
    return () => clearTimeout(t);
  }, [durationMs]);

  if (!pos.ready) return null;

  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        pointerEvents: 'none',
        fontWeight: 800,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        fontSize: 'clamp(11px,1.3vw,14px)',
        color,
        textShadow: color === '#fff'
          ? '0 0 10px rgba(255,255,255,.55)'
          : 'none',
      }}
    >
      LAMEBOY, USA
    </span>,
    document.body
  );
}

/* --------- Chakra + white-sheet cascade overlay (from your globals) --------- */
function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDone(true), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);
  if (done) return null;

  return createPortal(
    <>
      {/* 7 bars with glow (uses .chakra-overlay/.chakra-band from globals.css) */}
      <div className="chakra-overlay" aria-hidden="true">
        <div className="chakra-band chakra-root" />
        <div className="chakra-band chakra-sacral" />
        <div className="chakra-band chakra-plexus" />
        <div className="chakra-band chakra-heart" />
        <div className="chakra-band chakra-throat" />
        <div className="chakra-band chakra-thirdeye" />
        <div className="chakra-band chakra-crown" />
      </div>
      {/* white sheet sweeps in from the right (same feel as before) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          translate: '100% 0',            // start offscreen right
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

export default function LandingGate({ onCascadeComplete }) {
  const [cascade, setCascade] = useState(false);
  const [orbRed, setOrbRed] = useState(false);
  const [hot, setHot] = useState(false);          // keeps the yellow glow locked
  const [label, setLabel] = useState('Florida, USA'); // flips to LAMEBOY, USA
  const pressTimer = useRef(null);
  const linkRef = useRef(null);

  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // When cascade triggers, the sticky title will render white→black via FollowTitle.
    const id = setTimeout(() => {
      setCascade(false);
      onCascadeComplete?.();
    }, CASCADE_MS);
    return () => clearTimeout(id);
  }, [cascade, onCascadeComplete]);

  const onFloridaClick = useCallback(() => {
    setHot(true);
    setLabel('LAMEBOY, USA');     // flip and keep neon until cascade begins
    // Kick the cascade after a tiny delay so the hot state paints
    setTimeout(runCascade, 40);
  }, [runCascade]);

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
        gap: 10,
      }}
    >
      {cascade && <CascadeOverlay />}
      {cascade && <FollowTitle targetRef={linkRef} durationMs={CASCADE_MS} />}

      {/* Centered orb */}
      <button
        type="button"
        aria-label="Orb"
        onClick={() => setOrbRed(v => !v)}
        onMouseDown={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 12 }}
        title="Tap: toggle color • Hold/Double-click: enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.12}
          glow
          glowOpacity={orbRed ? 1.0 : 0.9}
          includeZAxis
          height="72px"
          overrideAllColor={orbRed ? RED : null}
          interactive
        />
      </button>

      {/* Florida ↔ LAMEBOY, USA (sticky neon behavior + exact placement for cascade) */}
      <button
        ref={linkRef}
        type="button"
        className={`lb-florida ${hot ? 'is-hot' : ''}`}
        onClick={onFloridaClick}
        title="Enter"
      >
        {label}
      </button>

      <style jsx>{`
        .lb-florida {
          background: transparent;
          border: 0;
          cursor: pointer;
          font-weight: 800;
          letter-spacing: .02em;
          color: #eaeaea; /* base */
          text-shadow: none;
          transition: color .15s ease, text-shadow .15s ease, filter .15s ease;
        }
        /* Hover neon yellow */
        .lb-florida:hover,
        .lb-florida:focus-visible {
          color: #c9a800;
          text-shadow:
            0 0 6px rgba(255,247,0,.55),
            0 0 14px rgba(255,247,0,.35),
            0 0 26px rgba(255,247,0,.25);
        }
        /* Persist neon (after click) until cascade begins */
        .lb-florida.is-hot {
          color: #c9a800 !important;
          text-shadow:
            0 0 6px rgba(255,247,0,.55),
            0 0 14px rgba(255,247,0,.35),
            0 0 26px rgba(255,247,0,.25);
        }
      `}</style>
    </div>
  );
}
