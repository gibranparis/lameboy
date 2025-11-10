// @ts-check
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

/* ---------------------- layout helpers ---------------------- */
function useShift() {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isPhone = h < 760;
    return {
      vh: isPhone ? 9 : 7,                     // nudge above center
      micro: Math.round(Math.max(2, Math.min(12, h * 0.014))),
      gap: isPhone ? 4 : 6,                    // orb ↔ text tighter
    };
  };
  const [s, setS] = useState(calc);
  useEffect(() => {
    const onR = () => setS(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return s;
}

/* ---------------------- live clock ---------------------- */
function DigitalClock({ className }) {
  const fmt = useRef(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', // Naples, FL
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  );
  const [now, setNow] = useState(() => fmt.current.format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(fmt.current.format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return <div className={className} aria-live="off">{now}</div>;
}

/* ---------------------- cascade overlay ---------------------- */
/**
 * @param {{durationMs?:number, anchorRect?:DOMRect|null}} props
 */
function CascadeOverlay({ durationMs = CASCADE_MS, anchorRect }) {
  const [mounted, setMounted] = useState(true);
  const [p, setP] = useState(0); // 0..1

  useEffect(() => {
    let t0, rafId, doneId;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (t) => {
      if (t0 == null) t0 = t;
      const raw = Math.min(1, (t - t0) / durationMs);
      setP(easeOutCubic(raw));
      if (raw < 1) rafId = requestAnimationFrame(step);
      else doneId = setTimeout(() => setMounted(false), 100);
    };
    rafId = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafId); clearTimeout(doneId); };
  }, [durationMs]);

  if (!mounted) return null;

  const COLOR_VW = 120;
  const whiteTx = (1 - p) * 100;                          // %
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;  // vw
  const onWhite = whiteTx < 98; // if white sheet visible anywhere

  // Fallback to center if we don't have the rect yet
  const midLeft = anchorRect ? (anchorRect.left + anchorRect.right) / 2 : window.innerWidth / 2;
  const midTop  = anchorRect ? (anchorRect.top + anchorRect.bottom) / 2 : window.innerHeight / 2;

  return createPortal(
    <>
      {/* WHITE sheet */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          transform: `translate3d(${whiteTx}%,0,0)`,
          background: '#fff',
          zIndex: 9998,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

      {/* COLOR bands slab */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: `${COLOR_VW}vw`,
          transform: `translate3d(${bandsTx}vw,0,0)`,
          zIndex: 9999, pointerEvents: 'none', willChange: 'transform',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'].map((c, i) => (
            <div key={i} style={{ position: 'relative', background: c }}>
              <span style={{ position: 'absolute', inset: -18, background: c, filter: 'blur(28px)', opacity: .95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* TITLE — exactly over the Florida label; WHITE by default, BLACK on white sheet */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: `${midLeft}px`,
            top: `${midTop}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            style={{
              color: onWhite ? '#000' : '#fff',
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              fontSize: 'clamp(11px,1.3vw,14px)',
              textShadow: onWhite
                ? 'none'
                : '0 0 6px rgba(0,0,0,.35), 0 0 14px rgba(0,0,0,.25)',
            }}
          >
            LAMEBOY, USA
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------------------- component ---------------------- */
export default function BannedLogin({ onProceed }) {
  const { vh, micro, gap } = useShift();

  const [cascade, setCascade] = useState(false);
  const [flipBrand, setFlipBrand] = useState(false);
  const [orbRed, setOrbRed] = useState(false);
  const pressTimer = useRef(null);

  const floridaRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);

  // Keep overlay label perfectly aligned to the Florida line
  const measure = useCallback(() => {
    if (!floridaRef.current) return;
    const r = floridaRef.current.getBoundingClientRect();
    setAnchorRect(r);
  }, []);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (floridaRef.current) ro.observe(floridaRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  const SEAFOAM = '#32ffc7', RED = '#ff001a';

  const runCascade = useCallback(() => {
    if (cascade) return;
    setCascade(true);
    setTimeout(() => { setCascade(false); onProceed?.(); }, CASCADE_MS);
  }, [cascade, onProceed]);

  return (
    <div
      className="page-center"
      style={{
        transform: `translateY(calc(-${vh}vh + ${micro}px))`,
        gap,
        alignItems: 'center',
      }}
    >
      {cascade && (
        <CascadeOverlay
          anchorRect={anchorRect}
          durationMs={CASCADE_MS}
        />
      )}

      {/* ORB */}
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
        style={{ lineHeight: 0, background: 'transparent', border: 0, padding: 0, marginBottom: 0, position: 'relative', zIndex: 10002 }}
        title="Tap: toggle color • Hold/Double-click: enter"
      >
        <BlueOrbCross3D
          rpm={44}
          color={SEAFOAM}
          geomScale={1.14}
          glow
          glowOpacity={orbRed ? 1.0 : 0.92}
          includeZAxis
          height="82px"
          overrideAllColor={orbRed ? RED : null}
          interactive
        />
      </button>

      {/* CLOCK — same style as Florida */}
      <DigitalClock className="florida-link clock" />

      {/* Florida label */}
      <button
        ref={floridaRef}
        type="button"
        className="florida-link"
        onClick={() => { setFlipBrand(true); setTimeout(() => setFlipBrand(false), 900); }}
        title="Click to morph"
        style={{ fontWeight: 800, marginTop: 0, color: '#fff', textShadow: '0 0 6px rgba(0,0,0,.25)' }}
      >
        {flipBrand ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      <style jsx>{`
        .clock{
          margin-top: 2px;
          opacity: .92;
          font-weight: 800;
        }
        :global(:root[data-theme="day"]) .florida-link { color:#111; text-shadow:none; }
        .florida-link{
          display:block; text-align:center; background:transparent; border:0; cursor:pointer;
          letter-spacing:.02em; transition: color .15s ease, text-shadow .15s ease;
        }
        .florida-link:hover, .florida-link:focus-visible{
          color:#ffe600;
          text-shadow:
            0 0 6px rgba(255,230,0,.90),
            0 0 16px rgba(255,230,0,.60),
            0 0 28px rgba(255,230,0,.40);
          outline:0;
        }
      `}</style>
    </div>
  );
}
