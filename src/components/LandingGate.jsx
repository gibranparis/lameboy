// src/components/LandingGate.jsx
'use client';

import nextDynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

/* =============================== Timings ================================ */
export const CASCADE_MS = 2400;
const WHITE_HOLD_MS     = 520;     // brief hold before curtain
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

/** hard-finish to DAY/SHOP on white to avoid flicker after cascade */
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
 * We render:
 * 1) Moving WHITE underlay
 * 2) COLOR band pack
 * 3) Overlaid label that is white over color, then flips to black EXACTLY when
 *    the white reaches the orb/label position (not when violet leaves the screen).
 *    We compute that moment from the white panel’s translateX, relative to the
 *    measured label center Y offset so the visual doesn’t jump.
 */
function CascadeOverlay({ durationMs, labelTransform, onCrossCenter }) {
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

  const COLOR_VW = 120;
  const whiteTxPct = (1 - p) * 100;                             // 100% → 0%
  const bandsTxVW  = (1 - p) * (100 + COLOR_VW) - COLOR_VW;     // 100vw → -120vw

  // Reveal black **as soon as the center is on white** (left edge of white ≤ 50%)
  const blackReveal = whiteTxPct <= 50;

  // notify once at the crossing moment (for debugging/tuning if needed)
  useEffect(() => {
    if (blackReveal) onCrossCenter?.();
  }, [blackReveal, onCrossCenter]);

  return createPortal(
    <>
      {/* WHITE underlay */}
      <div aria-hidden style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTxPct}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>

      {/* COLOR band pack */}
      <div aria-hidden style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
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

      {/* Center label — stays WHITE over color, flips to BLACK when white reaches center */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none' }}>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform: labelTransform }}>
          <span style={{
            color: blackReveal ? '#000' : '#fff',
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
function WhiteCurtain({ onDone, labelTransform }) {
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
      {/* Centered stack: black ORB / time / LAMEBOY, USA — aligned to Florida label */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6, pointerEvents:'none' }}>
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

        <div style={{ position:'absolute', left:'50%', top:'50%', transform: labelTransform }}>
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
  const pressTimer = useRef(null);
  const { vh, micro } = useShift();

  const [labelDeltaY, setLabelDeltaY] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const el = labelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const vy = (typeof window !== 'undefined' ? window.innerHeight : 0) / 2;
      setLabelDeltaY(Math.round(cy - vy)); // px delta from viewport center
    };
    measure();
    window.addEventListener('resize', measure);
    const id = requestAnimationFrame(measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, []);

  // Begin in "gate" mode to prevent background flashes
  useEffect(() => {
    try { document.documentElement.setAttribute('data-mode', 'gate'); } catch {}
    return () => { try { document.documentElement.removeAttribute('data-mode'); } catch {} };
  }, []);

  const runCascade = useCallback(() => {
    setPhase('cascade');
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    // after cascade passes, flip page chrome to day/shop and show curtain
    const t1 = setTimeout(() => {
      finishCascadeToDayShop();
      // guard grid flash for auto-open: hide grid for ~600ms or until overlay opens
      document.documentElement.setAttribute('data-entering-shop','1');
      const endGuard = () => document.documentElement.removeAttribute('data-entering-shop');
      const onOverlay = () => { endGuard(); window.removeEventListener('lb:overlay-open', onOverlay); };
      window.addEventListener('lb:overlay-open', onOverlay, { once:true });
      setTimeout(endGuard, 900);

      setPhase('curtain');
    }, CASCADE_MS);

    // small hold; curtain then fades out on lb:shop-ready or timeout
    const t2 = setTimeout(() => {}, CASCADE_MS + WHITE_HOLD_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const labelTransform = `translate(-50%, calc(-50% + ${labelDeltaY}px))`;

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
        visibility: phase === 'idle' ? 'visible' : 'hidden', // overlays own the visuals after start
      }}
    >
      {/* CASCADE overlay */}
      {phase === 'cascade' && (
        <CascadeOverlay
          durationMs={CASCADE_MS}
          labelTransform={labelTransform}
          onCrossCenter={() => {}}
        />
      )}

      {/* CURTAIN — white bg + black orb/time/label (aligned) */}
      {phase === 'curtain' && (
        <WhiteCurtain
          labelTransform={labelTransform}
          onDone={() => {
            setPhase('done');
            try { onCascadeComplete?.(); } catch {}
          }}
        />
      )}

      {/* ORB — enter */}
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
        style={{ position:'relative', zIndex: 10004, lineHeight: 0, padding:0, margin:0, background:'transparent', border:'none', cursor:'pointer' }}
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

      {/* TIME — white */}
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

      <style jsx>{`
        :global(:root[data-mode="gate"]) .chakra-band { min-height: 100%; }
      `}</style>
    </div>
  );
}

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
