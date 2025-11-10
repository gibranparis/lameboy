// @ts-check
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

const CASCADE_MS = 2400;

/* ---------------------- layout helpers ---------------------- */
function useShift() {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isPhone = h < 760;
    return {
      // stack sits a touch above center
      vh: isPhone ? 9 : 7,
      micro: Math.round(Math.max(2, Math.min(12, h * 0.014))),
      gap: isPhone ? 4 : 6, // orb ↔ text tighter
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

/* ---------------------- cascade overlay ---------------------- */
function CascadeOverlay({ durationMs = CASCADE_MS, anchorTransform }) {
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

  // white sheet + color bar sweep from right→left
  const COLOR_VW = 120;
  const whiteTx = (1 - p) * 100;                       // %
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // vw

  // when the white sheet is present (> ~2%), show black label glow
  const onWhite = whiteTx < 98;

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

      {/* TITLE anchored to the stack center. Mix-blend handles white/colour swap.
          We also add a subtle black neon when the white sheet is visible. */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: anchorTransform }}>
          <span
            style={{
              color: '#fff',
              mixBlendMode: 'difference',
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              fontSize: 'clamp(11px,1.3vw,14px)',
              textShadow: onWhite
                ? '0 0 6px rgba(0,0,0,.45), 0 0 14px rgba(0,0,0,.35), 0 0 26px rgba(0,0,0,.25)'
                : 'none',
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
          anchorTransform={`translate(-50%, calc(-50% - ${vh}vh + ${micro}px))`}
        />
      )}

      {/* ORB — sits above the white sheet so it feels attached to it */}
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

      {/* Code block — compact */}
      <pre
        className="code-tight"
        style={{
          margin: 0,
          textAlign: 'center',
          color: 'var(--text)',
          font: '700 14px/1.42 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <span className="lb-seafoam code-comment">// </span>
        <span className="lb-white neon-black" style={{ fontWeight: 900 }}>
          Lamebo<span>y</span><span className="lb-seafoam">.com</span>
        </span>{'\n'}
        <span className="lb-seafoam code-comment">// </span>
        <span className="banned-neon">is banned</span>{'\n'}
        <span className="code-keyword">const</span> <span className="code-var">msg</span> <span className="code-op">=</span> <span className="code-string">"welcome to"</span><span className="code-punc">;</span>
      </pre>

      {/* Florida / brand toggle — closer to code; true yellow glow */}
      <button
        type="button"
        className="florida-link"
        onClick={() => { setFlipBrand(true); setTimeout(() => setFlipBrand(false), 900); }}
        title="Click to morph"
        style={{
          fontWeight: 800,
          marginTop: 0,
          color: '#fff', // legible at night
          textShadow: '0 0 6px rgba(0,0,0,.25)',
        }}
      >
        {flipBrand ? 'LAMEBOY, USA' : 'Florida, USA'}
      </button>

      <style jsx>{`
        :global(:root[data-theme="day"]) .florida-link { color:#111; text-shadow:none; }
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
