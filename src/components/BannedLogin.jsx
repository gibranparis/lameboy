// @ts-check
// src/components/BannedLogin.jsx
'use client';

import nextDynamic from 'next/dynamic';
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import ButterflyChakra from '@/components/ButterflyChakra';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';
import { useRouter } from 'next/navigation';

const CASCADE_MS = 2400;
const HOP_PATH = '/shop';

/** @typedef {'banned'|'login'} ViewState */
/** @typedef {'link'|'bypass'|null} Activation */

/** Wordmark */
function Wordmark({ onClickWordmark, lRef, yRef }) {
  return (
    <span className="lb-word" onClick={onClickWordmark} style={{ cursor:'pointer' }} title="Launch butterfly">
      <span className="lb-white">
        <span ref={lRef}>L</span>amebo<span ref={yRef}>y</span>
        <span className="lb-seafoam">.com</span>
      </span>
      <style jsx>{`
        .lb-word { display:inline; }
        .lb-white {
          color:#fff; font-weight:900; letter-spacing:0; word-spacing:0;
          text-shadow:0 0 8px #fff,0 0 18px #fff,0 0 36px #fff,0 0 70px #fff;
        }
        .lb-seafoam { letter-spacing:0; word-spacing:0; }
      `}</style>
    </span>
  );
}

/** Neon cascade overlay */
function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let start; let id;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / durationMs);
      setP(k);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => { if (id) cancelAnimationFrame(id); };
  }, [durationMs]);

  const whiteTx = (1 - p) * 100;
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden="true" style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>
      <div aria-hidden="true" style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${bandsTx}vw,0,0)`,
        zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div className="lb-cascade">
          <div className="lb-band lb-b1"/><div className="lb-band lb-b2"/><div className="lb-band lb-b3"/>
          <div className="lb-band lb-b4"/><div className="lb-band lb-b5"/><div className="lb-band lb-b6"/><div className="lb-band lb-b7"/>
        </div>
      </div>
      <div className="lb-brand" aria-hidden="true" style={{ zIndex:10001 }}>
        <span className="lb-brand-text">LAMEBOY, USA</span>
      </div>
      <style jsx global>{`
        .lb-cascade{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(7,1fr); }
        .lb-band{ position:relative; width:100%; height:100%; background:var(--c); }
        .lb-band::after{
          content:""; position:absolute; inset:-14px; background:var(--c);
          filter:blur(22px); opacity:.95; pointer-events:none;
        }
        .lb-b1{ --c:#ef4444 } .lb-b2{ --c:#f97316 } .lb-b3{ --c:#facc15 }
        .lb-b4{ --c:#22c55e } .lb-b5{ --c:#3b82f6 } .lb-b6{ --c:#4f46e5 } .lb-b7{ --c:#c084fc }
        .lb-brand{ position:fixed; inset:0; display:grid; place-items:center; pointer-events:none; }
        .lb-brand-text{
          color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
          font-size:clamp(11px,1.3vw,14px); text-shadow:0 0 8px rgba(0,0,0,.25);
        }
      `}</style>
    </>,
    document.body
  );
}

/** @param {{ onProceed?: () => void }} props */
export default function BannedLogin({ onProceed }) {
  const router = useRouter();

  const [view, setView] = useState/** @type {'banned'|'login'} */('banned');
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  const [activated, setActivated] = useState/** @type {'link'|'bypass'|null} */(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef/** @type {import('react').RefObject<HTMLInputElement>} */(null);

  // “hi” ↔ “…レ乃モ”
  const HI = 'hi...';
  const JP = '...レ乃モ';
  const [hiMsg, setHiMsg] = useState(HI);
  useEffect(() => {
    const id = setInterval(() => setHiMsg(v => (v === HI ? JP : HI)), 22000);
    return () => clearInterval(id);
  }, []);

  // orb state
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState/** @type {'chakra'|'red'} */('chakra');
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  const lRef = useRef/** @type {import('react').RefObject<HTMLSpanElement>} */(null);
  const yRef = useRef/** @type {import('react').RefObject<HTMLSpanElement>} */(null);
  const [flyOnce, setFlyOnce] = useState(false);

  useEffect(() => { try { router.prefetch?.(HOP_PATH); } catch {} }, [router]);

  // lock scroll during cascade/whiteout
  useEffect(() => {
    const lock = cascade || whiteout;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cascade, whiteout]);

  /** Run neon cascade and hop */
  const runCascade = useCallback((after?: () => void, { washAway = false } = {}) => {
    setCascade(true); setHideAll(true); setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true);
      after && after();

      if (typeof onProceed === 'function') onProceed();
      else try { router.push(HOP_PATH); } catch {}
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, [onProceed, router]);

  const onLink = useCallback(() => {
    setActivated('link');
    setTimeout(()=>setActivated(null),650);
    runCascade(()=>{}, { washAway:true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass');
    setTimeout(()=>setActivated(null),650);
    runCascade(()=>{}, { washAway:true });
  }, [runCascade]);

  const toggleOrbColor = useCallback(() => {
    setOrbMode(prev => {
      const next = prev === 'red' ? 'chakra' : 'red';
      setOrbGlow(next === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      return next;
    });
  }, []);

  // Long-press
  const pressTimer = useRef/** @type {ReturnType<typeof setTimeout> | null} */(null);
  const clearPressTimer = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  return (
    <div
      className="page-center"
      style={{
        minHeight:'100dvh',
        display:'grid',
        placeItems:'center',
        padding:'2rem',
        position:'relative',
        gridAutoRows:'min-content',
      }}
    >
      {flyOnce && (
        <ButterflyChakra
          startEl={lRef.current}
          endEl={yRef.current}
          durationMs={1600}
          onDone={() => setFlyOnce(false)}
        />
      )}

      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && createPortal(
        <div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>,
        document.body
      )}

      {!hideAll && (
        <div
          className="login-stack"
          style={{ display:'grid', justifyItems:'center', gap:10 }}
        >
          {/* Orb */}
          <div className="orb-row" style={{ marginBottom:-16, display:'grid', placeItems:'center' }}>
            <button
              type="button"
              aria-label="Grid density +1"
              onMouseDown={() => { clearPressTimer(); pressTimer.current = setTimeout(() => runCascade(()=>{}, { washAway:true }), 650); }}
              onMouseUp={clearPressTimer}
              onMouseLeave={clearPressTimer}
              onTouchStart={() => { clearPressTimer(); pressTimer.current = setTimeout(() => runCascade(()=>{}, { washAway:true }), 650); }}
              onTouchEnd={clearPressTimer}
              onClick={() => {
                const detail = { step: 1 };
                try { window.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
                try { document.dispatchEvent(new CustomEvent('lb:zoom', { detail })); } catch {}
              }}
              onDoubleClick={() => runCascade(()=>{}, { washAway:true })}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ lineHeight: 0, background:'transparent', border:0, padding:0 }}
            >
              <BlueOrbCross3D
                key={`${orbMode}-${orbGlow}-${orbVersion}`}
                rpm={44}
                color={SEAFOAM}
                geomScale={1.12}
                glow
                glowOpacity={orbGlow}
                includeZAxis
                height="72px"
                overrideAllColor={orbMode==='red' ? RED : null}
                overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
                interactive
              />
            </button>
          </div>

          {/* Bubble (no animated blue glow) */}
          {!hideBubble && (
            <div
              style={{
                minWidth:260,
                background:'rgba(20,20,26,.9)',
                border:'2px solid rgba(255,255,255,.10)',
                borderRadius:16,
                boxShadow:'0 6px 18px rgba(0,0,0,.28)',
                padding:'6px 8px'
              }}
              role={view==='login' ? 'form' : undefined}
              tabIndex={view==='login' ? 0 : -1}
            >
              {view==='banned' ? (
                <pre className="code-tight" style={{ margin:0 }}>
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <Wordmark onClickWordmark={() => setFlyOnce(true)} lRef={lRef} yRef={yRef} />
                  {'\n'}
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <span className="code-banned">is </span>
                  <span
                    role="button" tabIndex={0}
                    className="code-banned banned-trigger"
                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}}
                    title="Toggle orb color"
                  >
                    banned
                  </span>{'\n'}
                  <span className="code-keyword">const</span>{' '}
                  <span className="code-var">msg</span>{' '}
                  <span className="code-op">=</span>{' '}
                  <span className="nogap">
                    <span
                      role="button" tabIndex={0}
                      className="code-string code-link"
                      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setView('login'); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); setView('login'); }}}
                    >
                      {JSON.stringify(hiMsg)}
                    </span>
                    <span className="code-punc">;</span>
                  </span>
                </pre>
              ) : (
                <form onSubmit={(e)=>e.preventDefault()} style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  <div className="code-row">
                    <span className="lb-seafoam code-comment glow-seafoam">// login</span>
                  </div>

                  <div className="code-row">
                    <span className="code-var neon-violet">email</span>
                    <span className="code-op neon-violet">=</span>
                    <span className="code-string neon-violet">"</span>
                    <input
                      ref={emailRef}
                      className="code-input code-input-violet"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      size={Math.max(1, (email || '').length)}
                      style={{ minWidth: '18ch' }}
                    />
                    <span className="nogap">
                      <span className="code-string neon-violet">"</span>
                      <span className="code-punc neon-violet">;</span>
                    </span>
                  </div>

                  <div className="code-row">
                    <span className="code-var neon-violet">phone</span>
                    <span className="code-op neon-violet">=</span>
                    <span className="code-string neon-violet">"</span>
                    <input
                      className="code-input code-input-violet"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="+1 305 555 0123"
                      inputMode="tel"
                      autoComplete="tel"
                      size={Math.max(1, (phone || '').length)}
                      style={{ minWidth: '16ch' }}
                    />
                    <span className="nogap">
                      <span className="code-string neon-violet">"</span>
                      <span className="code-punc neon-violet">;</span>
                    </span>
                  </div>

                  <div className="row-nowrap" style={{ marginTop:6, gap:8, justifyContent:'center' }}>
                    <button type="button" className={`commit-btn btn-yellow ${activated==='link'?'btn-activated':''}`} onClick={onLink}>Link</button>
                    <button type="button" className={`commit-btn btn-red ${activated==='bypass'?'btn-activated':''}`} onClick={onBypass}>Bypass</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Florida line — centered */}
          <button
            type="button"
            className={['ghost-btn','florida-link', floridaHot?'is-hot':''].join(' ')}
            onClick={()=>{ if(!hideAll){ setFloridaHot(true); setTimeout(()=>setFloridaHot(false),700); setHideBubble(false); setView(v=>v==='banned'?'login':'banned'); }}}
            onMouseEnter={()=>setFloridaHot(true)}
            onMouseLeave={()=>setFloridaHot(false)}
            style={{ marginTop: 8, display:'block', textAlign:'center' }}
          >
            Florida, USA
          </button>
        </div>
      )}
    </div>
  );
}
