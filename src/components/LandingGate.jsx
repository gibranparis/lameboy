// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS    = 2400;
const SEAFOAM       = '#32ffc7';

/* ---------------- tiny Naples clock (idle only) ---------------- */
function ClockNaples({ color = '#fff' }) {
  const [now, setNow] = useState('');
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric', minute: '2-digit', second: '2-digit',
          hour12: true, timeZone: 'America/New_York',
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
        color,
        textShadow: '0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)',
        userSelect: 'none',
      }}
    >
      {now}
    </div>
  );
}

/* ---------------- geometry helpers ---------------- */
function useCenter(ref) {
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const measure = useCallback(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, []);
  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    const id = requestAnimationFrame(measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); };
  }, [measure]);
  return pt;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ---------- RAF-driven cascade (white UNDER, bands OVER) ---------- */
function CascadeOverlayRAF({ durationMs = CASCADE_MS, bandsLeadMs = 180, onWhiteProgress }) {
  const [p, setP] = useState(0);
  const raf = useRef(0), t0 = useRef(0), cb = useRef(onWhiteProgress);
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

  // 7 bands with gentle staggers
  const STAGGERS = [0.00, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36];
  const FADE_LOCAL = 0.78;

  // White sheet progress (under bands) — stays OFFSCREEN until cascade begins
  const whiteRaw = clamp01((p * durationMs - bandsLeadMs) / (durationMs - bandsLeadMs));
  const whiteP   = easeOutCubic(whiteRaw);
  const whiteTx  = (1 - whiteP) * 100; // +100% → 0%
  useEffect(() => { cb.current?.(whiteP); }, [whiteP]);

  return createPortal(
    <>
      {/* WHITE sheet (UNDER bands). Starts fully off-screen; mounts only during cascade */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 10000,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {/* BANDS (ABOVE white) */}
      <div
        className="chakra-overlay"
        data-js-cascade="raf"
        aria-hidden
        style={{ position:'fixed', inset:0, zIndex:10001, gridTemplateColumns:'repeat(7,1fr)', pointerEvents:'none' }}
      >
        {[
          'chakra-root','chakra-sacral','chakra-plexus','chakra-heart',
          'chakra-throat','chakra-thirdeye','chakra-crown',
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
              style={{ transform:`translate3d(${tx}vw,0,0)`, opacity, willChange:'transform,opacity' }}
            />
          );
        })}
      </div>
    </>,
    document.body
  );
}

/* Floating title that sticks to label center when cascading */
function FloatingTitle({ x, y, text, mode /* 'glow-white' | 'solid-black' */, z = 10003 }) {
  const styles =
    mode === 'glow-white'
      ? {
          color: '#fff',
          textShadow:
            '0 0 6px rgba(255,255,255,.9), 0 0 14px rgba(255,255,255,.6), 0 0 24px rgba(255,255,255,.4)',
        }
      : { color: '#000', textShadow: 'none' };

  return createPortal(
    <span
      aria-hidden
      style={{
        position: 'fixed', left: x, top: y, transform: 'translate(-50%, -50%)',
        zIndex: z, pointerEvents: 'none',
        fontWeight: 700, letterSpacing: '.06em', fontSize: 'clamp(12px,1.3vw,14px)', fontFamily: 'inherit',
        ...styles,
      }}
    >
      {text}
    </span>,
    document.body
  );
}

/* Post-cascade WHITE curtain that fades out when ready */
function RevealCurtain({ show, onFadeDone, titleBelowOrb = 'LAMEBOY, USA' }) {
  const [visible, setVisible] = useState(show);
  const [fade, setFade] = useState(false);

  useEffect(() => setVisible(show), [show]);

  useEffect(() => {
    if (!visible) return;
    const onReady = () => { setFade(true); setTimeout(() => { setVisible(false); onFadeDone?.(); }, 360); };
    window.addEventListener('lb:shop-ready', onReady);
    // Fallback in case no event comes
    const fallback = setTimeout(onReady, 800);
    return () => { window.removeEventListener('lb:shop-ready', onReady); clearTimeout(fallback); };
  }, [visible, onFadeDone]);

  if (!visible) return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position:'fixed', inset:0, background:'#fff',
        zIndex: 10002, pointerEvents:'none',
        opacity: fade ? 0 : 1, transition:'opacity .36s ease',
        display:'grid', placeItems:'center',
      }}
    >
      <div style={{ display:'grid', justifyItems:'center', gap:6 }}>
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
        <div
          style={{
            fontWeight:700, letterSpacing:'.06em', fontSize:'clamp(12px,1.3vw,14px)',
            color:'#000', userSelect:'none',
          }}
        >
          {titleBelowOrb}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- main ---------------- */
export default function LandingGate({ onCascadeComplete }) {
  // phases: idle → cascade → curtain → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const [whiteP, setWhiteP] = useState(0); // 0..1 during cascade
  const labelRef = useRef(null);
  const locked = useRef(false);

  const { x, y } = useCenter(labelRef);

  const start = useCallback(() => {
    if (locked.current || phase !== 'idle') return;
    locked.current = true;
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // After cascade bands finish, enter the white curtain (kept until shop signals ready)
    setTimeout(() => setPhase('curtain'), CASCADE_MS);
  }, [phase]);

  // When the curtain fully fades, inform parent (optional)
  const handleCurtainGone = useCallback(() => {
    setPhase('done');
    onCascadeComplete?.();
  }, [onCascadeComplete]);

  const idleText  = 'Florida, USA';
  const finalText = 'LAMEBOY, USA';

  // Title mode while cascading:
  // - While bands are visible (whiteP ~ 0) → glow white
  // - Once white sheet is in (whiteP > ~0.02) → solid black
  const titleMode = whiteP > 0.02 ? 'solid-black' : 'glow-white';

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '1.5rem', position: 'relative',
      }}
    >
      {/* ORB — always visible in gate */}
      <div aria-hidden style={{ position:'relative', zIndex:10004, lineHeight:0 }}>
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

      {/* CLOCK (idle only) with tight spacing */}
      {phase === 'idle' && (
        <div style={{ position:'relative', zIndex:10004, marginTop:-6, marginBottom:-2 }}>
          <ClockNaples color="#fff" />
        </div>
      )}

      {/* Clickable label (idle only) */}
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
          background: 'transparent', border: 0, cursor: 'pointer',
          fontWeight: 700, letterSpacing: '.06em', fontSize:'clamp(12px,1.3vw,14px)', fontFamily:'inherit',
          color: hovered ? '#ffe600' : '#ffffff',
          textShadow: hovered
            ? '0 0 8px rgba(255,230,0,.95), 0 0 18px rgba(255,210,0,.70), 0 0 28px rgba(255,200,0,.45)'
            : '0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)',
          marginTop: -2,
        }}
      >
        {idleText}
      </button>

      {/* ===== Overlays (mount ONLY when needed) ===== */}
      {phase === 'cascade' && (
        <>
          <CascadeOverlayRAF bandsLeadMs={200} onWhiteProgress={setWhiteP} />
          {/* Floating title follows label center during cascade.
              Glowing white → solid black as white sheet arrives. */}
          <FloatingTitle
            x={x} y={y}
            text={finalText}
            mode={titleMode}
            z={10003}
          />
        </>
      )}

      {/* Post-cascade curtain (white screen with orb + “LAMEBOY, USA”), fades out on ready */}
      <RevealCurtain
        show={phase === 'curtain'}
        onFadeDone={handleCurtainGone}
        titleBelowOrb={finalText}
      />

      <style jsx>{`
        :global(:root[data-mode="gate"]) .chakra-band { min-height: 100%; }
      `}</style>
    </div>
  );
}
