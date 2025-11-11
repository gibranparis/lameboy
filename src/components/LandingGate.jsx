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
  const measure = useCallback(() => { void ref?.current; }, [ref]);
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
  try { document.dispatchEvent(new CustomEvent('lb:cascade:done', { detail:{ to:'shop-day' } })); } catch {}
}

/* ====================== BannedLogin-style CASCADE ======================= */
/**
 * We switch from WHITE label (mix-blend:difference) → BLACK stack (orb/time/label)
 * exactly when the moving WHITE sheet covers the screen center (50vw) AND
 * the COLOR pack’s right edge has already passed that same 50vw line.
 *
 * Math (in vw / %):
 *  - WHITE sheet: full-screen div with translateX(whiteTx%), where whiteTx% = (1-p)*100 (100 → 0).
 *    The sheet’s left edge is at whiteTx vw. The center (50vw) is WHITE when whiteTx <= 50.
 *  - COLOR pack: width = COLOR_VW; translateX(bandsTx vw) where bandsTx = (1-p)*(100+COLOR_VW) - COLOR_VW.
 *    The pack’s right edge is rightEdge = bandsTx + COLOR_VW. The center is CLEAR of color when rightEdge <= 50.
 *
 * We open a tiny ramp (rampVW) right at that center line so the trade is crisp but not harsh.
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

  // Geometry
  const COLOR_VW = 120;                // width of color pack container (vw)
  const whiteTx  = (1 - p) * 100;      // %/vw: white sheet translate (left edge at whiteTx vw)
  const bandsTx  = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // vw: color pack translate
  const rightEdge = bandsTx + COLOR_VW; // vw: color pack right edge
  const CENTER = 50;                   // vw: screen center where orb/text sit
  const rampVW = 1.6;                  // smoothing ramp around the exact center handoff (tight)

  // Coverage tests at the CENTER line
  const whiteCoversCenter   = whiteTx <= CENTER;     // white has reached center
  const colorClearedCenter  = rightEdge <= CENTER;   // color has moved past center

  // Progress toward crossfade at center:
  // sWhite grows as whiteTx moves left past CENTER; sColor grows as rightEdge moves left past CENTER.
  const sWhite = Math.max(0, Math.min(1, (CENTER - whiteTx) / rampVW));
  const sColor = Math.max(0, Math.min(1, (CENTER - rightEdge) / rampVW));

  // We only commit the trade when BOTH are true; take the min to ensure the handoff happens
  // exactly as white reveals the center AND color has washed past it.
  const s = Math.min(whiteCoversCenter ? sWhite : 0, colorClearedCenter ? sColor : 0); // 0 → 1
  const blackAlpha = s;
  const whiteAlpha = 1 - s;

  // Translate values for visuals
  const COLOR_VW_CONTAINER = 120;
  const whiteTxPct  = whiteTx; // same units
  const bandsTxVW   = bandsTx;

  return createPortal(
    <>
      {/* WHITE underlay (slides in from right) */}
      <div aria-hidden style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTxPct}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>

      {/* COLOR band pack */}
      <div aria-hidden style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW_CONTAINER}vw`,
        transform:`translate3d(${bandsTxVW}vw,0,0)`, zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'].map((c,i)=>(
            <div key={i} style={{ position:'relative', background:c }}>
              <span style={{ position:'absolute', inset:-18, background:c, filter:'blur(28px)', opacity:.95 }} />
            </div>
          ))}
        </div>
      </div>

      {/* White label (difference) holds visually white until the center trade */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10000, pointerEvents:'none', opacity:whiteAlpha, transition:'opacity .06s linear' }}>
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

      {/* Early Black Stack appears exactly as the center is revealed WHITE and color has washed past */}
      <div
        aria-hidden
        style={{
          position:'fixed', inset:0, zIndex:10002, pointerEvents:'none',
          display:'grid', placeItems:'center',
          opacity: blackAlpha,
          transition: 'opacity .06s linear',
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
    </>,
    document.body
  );
}

/* ============================ White curtain ============================= */
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
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
  const labelRef = useRef(null);
  const locked = useRef(false);
  const pressTimer = useRef(null);
  const { vh, micro } = useShift();

  // HARD GATE: hide shop UI to prevent grid/header flash until we're fully done.
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-mode', 'gate');
    r.setAttribute('data-gate-hardblock', '1');
    return () => {
      r.removeAttribute('data-mode');
      r.removeAttribute('data-gate-hardblock');
    };
  }, []);

  useCenter(labelRef);

  const runCascade = useCallback(() => {
    if (locked.current) return;
    locked.current = true;

    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // After cascade, flip chrome to day/shop; curtain then manages fade into shop
    const t1 = setTimeout(() => {
      finishCascadeToDayShop();
      setPhase('curtain');
    }, CASCADE_MS);

    const t2 = setTimeout(() => { /* curtain listens to lb:shop-ready or auto-timeouts */ }, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="page-center"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '1.5rem',
        position: 'relative',
        // Hide base stack once animation starts; overlays/curtain handle visuals
        visibility: phase === 'idle' ? 'visible' : 'hidden',
      }}
    >
      {/* CASCADE overlay (center-locked handoff) */}
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
            // Release hardblock only when truly done
            try { document.documentElement.removeAttribute('data-gate-hardblock'); } catch {}
          }}
        />
      )}

      {/* ORB — enter */}
      {phase === 'idle' && (
        <>
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

          {/* TIME */}
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

          {/* Florida label */}
          <button
            ref={labelRef}
            type="button"
            onClick={runCascade}
            title="Enter"
            style={{
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
          >
            Florida, USA
          </button>
        </>
      )}

      {/* Safety styles */}
      <style jsx>{`
        :global(:root[data-mode="gate"]) .chakra-band { min-height: 100%; }
        /* Hard-block shop UI while in gate to prevent grid/header flash */
        :global(:root[data-gate-hardblock]) [data-shop-root] { visibility: hidden !important; }
        :global(:root[data-gate-hardblock]) header[role="banner"] { visibility: hidden !important; }
      `}</style>
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
