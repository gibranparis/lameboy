// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400;                    // visual travel time for the band pack
const WHITE_HOLD_MS     = 520;                     // minimal hold; curtain will fade away on shop-ready
const SEAFOAM           = '#32ffc7';

/* === shared stack geometry so all labels align perfectly === */
const ORB_PX     = 88;   // matches --orb-px
const STACK_GAP  = 6;
const LABEL_SHIFT_PX = Math.round(ORB_PX / 2 + STACK_GAP + 8); // baseline-align to “Florida, USA”

/* The exact moment the last (violet) band’s right edge crosses center (50vw)
   Pack width = 120vw. It translates from +100vw to -120vw.
   Crossing condition: bandsRight = bandsTx + 120 <= 50  => bandsTx <= -70
   bandsTx = (1-p)*(100+120) - 120 = (1-p)*220 - 120
   Solve (1-p)*220 - 120 <= -70  => (1-p)*220 <= 50  => p >= 0.772727...
*/
const P_SWITCH = 0.77273;

/* ---------------- helpers ---------------- */
function useShift() {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isPhone = h < 760;
    return {
      vh: isPhone ? 4 : 3.5,
      micro: Math.round(Math.max(2, Math.min(10, h * 0.012))),
      gap: 6,
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

function useCenter(ref) {
  const measure = useCallback(() => {
    void ref?.current;
  }, [ref]);
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
}

/** hard-finish to DAY/SHOP on white */
function finishCascadeToDayShop(){
  const r = document.documentElement;
  r.setAttribute('data-theme','day');
  r.setAttribute('data-mode','shop');
  r.style.background = '#fff';
  try {
    const evt = new CustomEvent('lb:cascade:done', { detail:{ to:'shop-day' } });
    document.dispatchEvent(evt);
  } catch {}
}

/* ====================== BannedLogin-style CASCADE ======================= */
function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform, onProgress }) {
  const [mounted, setMounted] = useState(true);
  const [p, setP] = useState(0);

  useEffect(() => {
    let start, rafId, doneId;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (t) => {
      if (start == null) start = t;
      const raw = Math.min(1, (t - start) / durationMs);
      const eased = ease(raw);
      setP(eased);
      onProgress?.(eased);
      if (raw < 1) rafId = requestAnimationFrame(step);
      else doneId = setTimeout(() => setMounted(false), 120);
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); if (doneId) clearTimeout(doneId); };
  }, [durationMs, onProgress]);

  if (!mounted) return null;

  const COLOR_VW = 120;
  const whiteTx  = (1 - p) * 100;
  const bandsTx  = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      {/* Solid black floor so no white flicker behind bands */}
      <div aria-hidden style={{ position:'fixed', inset:0, background:'#000', zIndex:9997 }} />

      {/* WHITE underlay that travels slightly ahead */}
      <div aria-hidden style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>

      {/* COLOR band pack */}
      <div aria-hidden style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${bandsTx}vw,0,0)`, zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-18, background:c, filter:'blur(28px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* “LAMEBOY, USA” — white over color, black over white via mix-blend */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none' }}>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform: labelTransform }}>
          <span style={{
            color:'#fff',
            mixBlendMode:'difference',
            fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
            fontSize:'clamp(11px,1.3vw,14px)'
          }}>
            LAMEBOY, USA
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ============================ White curtain ============================= */
/* Solid white + black ORB + black clock + black LAMEBOY, USA.
   Visibility is controlled by phase; we don't delay—phase flips at p>=P_SWITCH. */
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
        zIndex: 10003,
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
  // phases: idle → cascade → curtain → done
  const [phase, setPhase] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const labelRef = useRef(null);
  const locked = useRef(false);
  const pressTimer = useRef(null);
  const { vh, micro } = useShift();

  // Begin in "gate" mode and mark cascade-guard states
  useEffect(() => {
    try { document.documentElement.setAttribute('data-mode', 'gate'); } catch {}
    return () => { try { document.documentElement.removeAttribute('data-mode'); } catch {} };
  }, []);

  useCenter(labelRef);

  const runCascade = useCallback(() => {
    if (locked.current) return;
    locked.current = true;

    // prevent any shop/grid visibility until we explicitly flip
    try { document.documentElement.setAttribute('data-cascade-active','1'); } catch {}

    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}
  }, []);

  // curtain -> done handoff
  const onCurtainDone = () => {
    setPhase('done');
    try { document.documentElement.removeAttribute('data-cascade-active'); } catch {}
    try { onCascadeComplete?.(); } catch {}
  };

  // When the last violet band washes past the center stack, flip immediately
  const onCascadeProgress = useCallback((p) => {
    if (p >= P_SWITCH && phase === 'cascade') {
      // set page chrome to day/shop and show curtain immediately
      finishCascadeToDayShop();
      setPhase('curtain');
      // small optional hold before we allow shop to fade in (curtain manages exit)
      window.setTimeout(() => {
        try {
          const evt = new CustomEvent('lb:shop-ready');
          window.dispatchEvent(evt);
          document.dispatchEvent(evt);
        } catch {}
      }, WHITE_HOLD_MS);
    }
  }, [phase]);

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
      {/* CASCADE overlay */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          // WHITE “LAMEBOY, USA” aligned to Florida baseline
          labelTransform={`translate(-50%, calc(-50% + ${LABEL_SHIFT_PX}px))`}
          onProgress={onCascadeProgress}
        />
      )}

      {/* CURTAIN — white bg + black orb/time/label */}
      {phase === 'curtain' && (
        <WhiteCurtain onDone={onCurtainDone} />
      )}

      {/* ORB — enter (tap/press/dblclick) */}
      <button
        type="button"
        onClick={runCascade}
        onMouseDown={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onMouseUp={() => clearTimeout(pressTimer.current)}
        onMouseLeave={() => clearTimeout(pressTimer.current)}
        onTouchStart={() => { clearTimeout(pressTimer.current); pressTimer.current = setTimeout(runCascade, 650); }}
        onTouchEnd={() => clearTimeout(pressTimer.current)}
        onDoubleClick={runCascade}
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

      {/* TIME — white (clickable in gate) */}
      {phase === 'idle' && (
        <button
          type="button"
          onClick={runCascade}
          title="Enter"
          aria-label="Enter"
          className="gate-white"
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
        className="gate-white"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={runCascade}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && runCascade()}
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
