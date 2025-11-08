// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDone(true), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  if (done) return null;

  return createPortal(
    <>
      {/* Chakra color bands (use global CSS for glow/animation) */}
      <div className="chakra-overlay" aria-hidden="true">
        <div className="chakra-band chakra-root" />
        <div className="chakra-band chakra-sacral" />
        <div className="chakra-band chakra-plexus" />
        <div className="chakra-band chakra-heart" />
        <div className="chakra-band chakra-throat" />
        <div className="chakra-band chakra-thirdeye" />
        <div className="chakra-band chakra-crown" />
      </div>

      {/* Title overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          zIndex: 10001,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontSize: 'clamp(11px,1.3vw,14px)',
            textShadow: '0 0 10px rgba(255,255,255,.55)',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </>,
    document.body
  );
}

export default function LandingGate({ onCascadeComplete }) {
  const [cascade, setCascade] = useState(false);
  const [orbRed, setOrbRed] = useState(false);
  const pressTimer = useRef(null);

  // run cascade and then enter shop
  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
    setTimeout(() => {
      setCascade(false);
      onCascadeComplete?.();
    }, CASCADE_MS);
  }, [cascade, onCascadeComplete]);

  // orb behavior: single click toggles red, long-press enters
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';

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
      }}
    >
      {cascade && <CascadeOverlay />}

      {/* Centered orb */}
      <button
        type="button"
        aria-label="Orb"
        onClick={() => setOrbRed((v) => !v)}
        onMouseDown={() => {
          clearTimeout(pressTimer.current);
          pressTimer.current = setTimeout(runCascade, 650);
        }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => {
          clearTimeout(pressTimer.current);
          pressTimer.current = setTimeout(runCascade, 650);
        }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 10 }}
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

      {/* Florida, USA — hover neon yellow, click triggers cascade */}
      <button
        type="button"
        className="florida-link"
        onClick={runCascade}
        style={{
          display: 'block',
          textAlign: 'center',
          color: '#eaeaea',
          fontWeight: 700,
          letterSpacing: '.02em',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        title="Enter"
      >
        Florida, USA
      </button>

      <style jsx>{`
        .florida-link {
          text-shadow: none;
          transition: text-shadow 0.15s ease, color 0.15s ease;
        }
        .florida-link:hover,
        .florida-link:focus-visible {
          color: #fff8c2;
          text-shadow:
            0 0 6px rgba(250, 204, 21, 0.55),
            0 0 14px rgba(250, 204, 21, 0.38),
            0 0 26px rgba(250, 204, 21, 0.22);
        }
      `}</style>
    </div>
  );
}
