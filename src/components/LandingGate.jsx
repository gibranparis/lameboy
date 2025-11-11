// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400;          // match BannedLogin
const WHITE_HOLD_MS     = 520;           // brief hold before curtain
const SEAFOAM           = '#32ffc7';

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

/** hard-finish to DAY/SHOP on white to avoid any flicker after cascade */
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
/**
 * Color cascade that carries:
 * - a WHITE sheet (slides from right → left)
 * - 7 COLOR bands
 * - a label that inverts on white (mix-blend:difference)
 * - an **Early Black Stack** (orb/time/label) that fades in the instant white covers center.
 */
function CascadeOverlay({ durationMs = CASCADE_MS, labelTransform }) {
  const [mounted, setMounted] = useState(true);
  const [p, setP] = useState(0);

  useEffect(() => {
    let start, rafId, doneId;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (t) => {
      if (start == null) start = t;
      const raw = Math.min(1, (t - start) / durationMs);
      setP(ease(raw));
      if (raw < 1) rafId = requestAnimationFrame(step);
      else doneId = setTimeout(() => setMounted(false), 120);
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); if (doneId) clearTimeout(doneId); };
  }, [durationMs]);

  if (!mounted) return null;

  // White sheet progress: translateX from 100% → 0%
  const COLOR_VW = 120;
  const whiteTx  = (1 - p) * 100;               // %
  const bandsTx  = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // vw

  // As soon as white reaches screen center (whiteTx <= 50), pop in black stack.
  // Tight ramp for a crisp "not a moment later" feel.
  const showBlack   = whiteTx <= 50;
  const blackAlpha  = Math.max(0, Math.min(1, 1 - (whiteTx - 50) / 6)); // 0→1 over ~6% travel

  return createPortal(
    <>
      {/* WHITE underlay (slides in) */}
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

      {/* “LAMEBOY, USA” — white over color, black over white via difference */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10000, pointerEvents:'none' }}>
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

      {/* === Early Black Stack (on top) =================================== */}
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0, zIndex:10002, pointerEvents:'none',
          display:'grid', placeItems:'center',
          opacity: showBlack ? blackAlpha : 0,
          transition: 'opacity .08s linear',  // very snappy
        }}
      >
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          {/* ORB — forced black */}
          <div style={{ lineHeight:0 }}>
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
              color:'#000',
              fontWeight:800,
              letterSpacing:'.06em',
              fontSize:'clamp(12px,1.3vw,14px)',
              lineHeight:1.2,
              fontFamily:'inherit',
            }}
          >
            <ClockNaples />
          </span>

          {/* LAMEBOY, USA — black */}
          <span
            style={{
              color:'#000',
              fontWeight:800,
              letterSpacing:'.06em',
              fontSize:'clamp(12px,1.3vw,14px)',
              lineHeight:1.2,
              fontFamily:'inherit',
              textTransform:'uppercase',
            }}
          >
            LAMEBOY, USA
          </span>
        </div>
      </div>
      {/* ================================================================== */}
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

  // Begin in "gate" mode to prevent background flashes
  useEffect(() => {
    try { document.documentElement.setAttribute('data-mode', 'gate'); } catch {}
    return () => { try { document.documentElement.removeAttribute('data-mode'); } catch {} };
  }, []);

  useCenter(labelRef);

  const runCascade = useCallback(() => {
    if (locked.current) return;
    locked.current = true;

    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // Flip chrome to day/shop right at cascade end; Early Black Stack already visible before this.
    const t1 = setTimeout(() => {
      finishCascadeToDayShop();
      setPhase('curtain');
    }, CASCADE_MS);

    const t2 = setTimeout(() => {
      // curtain will listen for lb:shop-ready or auto-timeout
    }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
        // Hide base stack once animation starts; overlays/curtain handle visuals
        visibility: phase === 'idle' ? 'visible' : 'hidden',
      }}
    >
      {/* CASCADE overlay (now includes Early Black Stack) */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={`translate(-50%, calc(-50% - ${vh}vh + ${micro}px + 24px))`}
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

      {/* ORB — enter (supports click, long-press, and double-click like BannedLogin) */}
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

      {/* TIME — white (clickable) */}
      {phase === 'idle' && (
        <button
          type="button"
          onClick={runCascade}
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
        onClick={runCascade}
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
          color: '#ffffff',
          textShadow: `0 0 8px rgba(255,255,255,.45), 0 0 16px rgba(255,255,255,.30)`,
          marginTop: 0,
        }}
        onMouseEnter={( ) => {}}
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
