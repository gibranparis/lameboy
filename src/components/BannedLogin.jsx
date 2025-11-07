// @ts-check
// src/components/BannedLogin.jsx  (v4.5 – emits lb:orb-mode for runner sync)
'use client';

import nextDynamic from 'next/dynamic';
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import ButterflyChakra from '@/components/ButterflyChakra';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/* ----------------------------- Wordmark ----------------------------- */
function Wordmark({ onClickWordmark, lRef, yRef }) {
  return (
    <span className="lb-word neon-glow" onClick={onClickWordmark} style={{ cursor:'pointer' }} title="Launch butterfly">
      <span className="lb-white neon-glow">
        <span ref={lRef}>L</span>amebo<span ref={yRef}>y</span>
        <span className="lb-seafoam neon-glow">.com</span>
      </span>
      <style jsx>{`
        .lb-word { display:inline; }
        .lb-white { color:#fff; font-weight:900; letter-spacing:0; word-spacing:0; }
        .lb-seafoam { letter-spacing:0; word-spacing:0; }
      `}</style>
    </span>
  );
}

/* ----------------------- Neon cascade overlay ----------------------- */
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
        <span className="lb-brand-text neon-glow">LAMEBOY, USA</span>
      </div>

      <style jsx global>{`
        .lb-cascade{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(7,1fr); }
        .lb-band{ position:relative; width:100%; height:100%; background:var(--c); }
        .lb-band::after{ content:""; position:absolute; inset:-14px; background:var(--c); filter:blur(22px); opacity:.95; pointer-events:none; }
        .lb-b1{ --c:#ef4444 } .lb-b2{ --c:#f97316 } .lb-b3{ --c:#facc15 }
        .lb-b4{ --c:#22c55e } .lb-b5{ --c:#3b82f6 } .lb-b6{ --c:#4f46e5 } .lb-b7{ --c:#c084fc }
        .lb-brand{ position:fixed; inset:0; display:grid; place-items:center; pointer-events:none; }
        .lb-brand-text{ color:#fff; font-weight:800; letter-spacing:.08em; text-transform:uppercase; font-size:clamp(11px,1.3vw,14px); }
      `}</style>
    </>,
    document.body
  );
}

/* --------------- ConsoleTyper -------------------------------------- */
/** @param {{messages:string[], cps:number, jitter:number, punctDelayMs:number, lineHoldMs:number, lineBeatMs:number, loop:boolean}} p */
function ConsoleTyper({ messages, cps, jitter, punctDelayMs, lineHoldMs, lineBeatMs, loop }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState(/** @type {'typing'|'hold'|'beat'} */('typing'));
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const line = messages[i] ?? '';
  const visible = reduceMotion ? line : line.slice(0, n);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase !== 'typing') return;
    if (n >= line.length) { setPhase('hold'); return; }

    const baseMs = 1000 / Math.max(1, cps);
    const r = (Math.random() * 2 - 1) * jitter;
    let delay = baseMs * (1 + r);
    const ch = line[n];
    if (/[.,;:!?]/.test(ch)) delay += punctDelayMs;
    if (ch === ' ') delay += baseMs * 0.15;

    const id = setTimeout(() => setN(x => x + 1), Math.max(8, delay));
    return () => clearTimeout(id);
  }, [n, line, cps, jitter, punctDelayMs, phase, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || phase !== 'hold') return;
    const id = setTimeout(() => setPhase('beat'), Math.max(0, lineHoldMs));
    return () => clearTimeout(id);
  }, [phase, lineHoldMs, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || phase !== 'beat') return;
    const id = setTimeout(() => {
      const next = i + 1;
      if (next < messages.length) { setI(next); setN(0); setPhase('typing'); }
      else if (loop && messages.length) { setI(0); setN(0); setPhase('typing'); }
    }, Math.max(0, lineBeatMs));
    return () => clearTimeout(id);
  }, [phase, i, messages.length, lineBeatMs, loop, reduceMotion]);

  const onClick = useCallback(() => {
    if (reduceMotion) return;
    if (phase === 'typing') { setN(line.length); setPhase('hold'); }
    else if (phase === 'hold') { setPhase('beat'); }
    else {
      const next = i + 1;
      if (next < messages.length) { setI(next); setN(0); setPhase('typing'); }
      else if (loop) { setI(0); setN(0); setPhase('typing'); }
    }
  }, [phase, line.length, i, messages, loop, reduceMotion]);

  return (
    <span onClick={onClick} className={`console-bare neon-glow ${phase==='beat' ? 'msg-dim' : 'msg-clear'}`}>
      <span className="txt">{visible}</span>
      {!reduceMotion && <span className="caret" aria-hidden="true">█</span>}
      <style jsx>{`
        .console-bare{
          display:inline;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-weight:700; color:#ccfff3; letter-spacing:.02em;
          white-space: pre-wrap; word-break: break-word;
          cursor:pointer;
        }
        .msg-dim{ opacity:.15; transition:opacity .14s ease; }
        .msg-clear{ opacity:1; transition:opacity .14s ease; }
        .caret{ margin-left:2px; animation: blink 1.05s steps(2) infinite; }
        @keyframes blink { 50% { opacity:0; } }
        @media (prefers-reduced-motion: reduce){ .caret{ display:none; } }
      `}</style>
    </span>
  );
}

/* ============================== Component ============================== */
export default function BannedLogin({
  onProceed,
  sysMessages,
  cps = 13,
  jitter = 0.25,
  punctDelayMs = 220,
  lineHoldMs = 900,
  lineBeatMs = 180,
  loop = true
}) {
  /** @type {'banned'|'login'} */ const [view, setView] = useState('banned');
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  /** @type {'link'|'bypass'|null} */ const [activated, setActivated] = useState(null);

  const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const emailRef = useRef(/** @type {HTMLInputElement|null} */(null));

  // lock scroll during cascade/whiteout
  useEffect(() => {
    const lock = cascade || whiteout;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cascade, whiteout]);

  /** Run neon cascade and enter shop (single-page) */
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true); setHideAll(true); setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true);
      after && after();
      if (typeof onProceed === 'function') onProceed();
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, [onProceed]);

  const onLink = useCallback(() => { setActivated('link'); setTimeout(()=>setActivated(null),650); runCascade(()=>{}, { washAway:true }); }, [runCascade]);
  const onBypass = useCallback(() => { setActivated('bypass'); setTimeout(()=>setActivated(null),650); runCascade(()=>{}, { washAway:true }); }, [runCascade]);

  // Orb color toggle (tap word "banned")
  const SEAFOAM = '#32ffc7'; const RED = '#ff001a';
  /** @type {'chakra'|'red'} */ const [orbMode, setOrbMode] = useState('chakra');
  const [orbGlow, setOrbGlow] = useState(0.9); const [orbVersion, setOrbVersion] = useState(0);

  // ✅ broadcast helper
  const broadcastOrbMode = useCallback((m) => {
    try {
      const evt = new CustomEvent('lb:orb-mode', { detail: { mode: m } });
      window.dispatchEvent(evt);
      document.dispatchEvent(evt);
    } catch {}
  }, []);

  // initial broadcast: start as chakra
  useEffect(() => { broadcastOrbMode('chakra'); }, [broadcastOrbMode]);

  const toggleOrbColor = useCallback(() => {
    setOrbMode(prev => {
      const next = prev === 'red' ? 'chakra' : 'red';
      setOrbGlow(next === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      // ✅ announce to the world (ChakraBottomRunner listens)
      broadcastOrbMode(next);
      return next;
    });
  }, [broadcastOrbMode]);

  // Long-press (press to cascade)
  const pressTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */(null));
  const clearPressTimer = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  // Butterfly wordmark refs
  const lRef = useRef(/** @type {HTMLSpanElement|null} */(null));
  const yRef = useRef(/** @type {HTMLSpanElement|null} */(null));
  const [flyOnce, setFlyOnce] = useState(false);

  /* ======= Default computer-typed messages (no extra lines) ======= */
  const DEFAULT_SYS = useMemo(() => ([
    'hi',
    'welcome to',
    'lameboy.com',
    'Greetings!',
    'from',
    'レ乃モ'
  ]), []);
  const MESSAGES = useMemo(
    () => (Array.isArray(sysMessages) && sysMessages.length ? sysMessages : DEFAULT_SYS),
    [sysMessages, DEFAULT_SYS]
  );

  return (
    <div
      className="page-center"
      data-test="gate-v3"
      style={{
        minHeight:'100dvh',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:'1.5rem',
        position:'relative'
      }}
    >
      {flyOnce && <ButterflyChakra startEl={lRef.current} endEl={yRef.current} durationMs={1600} onDone={() => setFlyOnce(false)} />}

      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && createPortal(<div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>, document.body)}

      {!hideAll && (
        <div className="login-stack" style={{ display:'grid', justifyItems:'center', gap:10 }}>
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
              title="Tap to zoom grid, press & hold to enter"
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

          {/* Bubble */}
          {!hideBubble && (
            <div
              style={{
                width: 'min(90vw, 300px)',
                background: 'rgba(18,18,22,0.92)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                backdropFilter: 'blur(14px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              role={view==='login' ? 'form' : undefined}
              tabIndex={view==='login' ? 0 : -1}
            >
              {view==='banned' ? (
                <pre className="code-tight" style={{ margin:0 }}>
                  <span className="lb-seafoam code-comment neon-glow">//</span>{' '}
                  <Wordmark onClickWordmark={() => setFlyOnce(true)} lRef={lRef} yRef={yRef} />
                  {'\n'}
                  <span className="lb-seafoam code-comment neon-glow">//</span>{' '}
                  <span className="code-banned neon-red">is </span>
                  <span
                    role="button" tabIndex={0}
                    className="code-banned neon-red banned-trigger"
                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}}
                    title="Toggle orb color"
                  >
                    banned
                  </span>{'\n'}
                  <span className="code-keyword neon-glow">const</span>{' '}
                  <span className="code-var neon-glow">msg</span>{' '}
                  <span className="code-op neon-glow">=</span>{' '}
                  <span className="code-string neon-glow">
                    "<ConsoleTyper
                      messages={MESSAGES}
                      cps={cps}
                      jitter={jitter}
                      punctDelayMs={punctDelayMs}
                      lineHoldMs={lineHoldMs}
                      lineBeatMs={lineBeatMs}
                      loop={loop}
                    />"
                  </span>
                  <span className="code-punc neon-glow">;</span>
                </pre>
              ) : (
                <form onSubmit={(e)=>e.preventDefault()} style={{ display:'flex',flexDirection:'column',gap:6, width:'100%' }}>
                  <div className="code-row"><span className="lb-seafoam code-comment neon-glow">// login</span></div>

                  <div className="code-row" style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span className="code-var neon-glow">email</span>
                    <span className="code-op neon-glow">=</span>
                    <span className="code-string neon-glow">"</span>
                    <input
                      ref={emailRef} className="code-input" value={email} onChange={(e)=>setEmail(e.target.value)}
                      placeholder="you@example.com" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off"
                      size={Math.max(1, (email || '').length)}
                      style={{ flex:'1 1 auto', minWidth:'12ch', background:'transparent', border:'0', outline:'0', color:'#eaeaea', fontFamily:'inherit', fontSize:'inherit' }}
                    />
                    <span className="nogap"><span className="code-string neon-glow">"</span><span className="code-punc neon-glow">;</span></span>
                  </div>

                  <div className="code-row" style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span className="code-var neon-glow">phone</span>
                    <span className="code-op neon-glow">=</span>
                    <span className="code-string neon-glow">"</span>
                    <input
                      className="code-input" value={phone} onChange={(e)=>setPhone(e.target.value)}
                      placeholder="+1 305 555 0123" inputMode="tel" autoComplete="tel"
                      size={Math.max(1, (phone || '').length)}
                      style={{ flex:'1 1 auto', minWidth:'10ch', background:'transparent', border:'0', outline:'0', color:'#eaeaea', fontFamily:'inherit', fontSize:'inherit' }}
                    />
                    <span className="nogap"><span className="code-string neon-glow">"</span><span className="code-punc neon-glow">;</span></span>
                  </div>

                  <div className="row-nowrap" style={{ marginTop:8, gap:10, justifyContent:'center' }}>
                    <button type="button" className="pill neon" aria-label="Link" onClick={onLink} style={{ filter: activated==='link' ? 'brightness(1.25)' : undefined }}>
                      <span className="neon-glow">Link</span>
                    </button>
                    <button type="button" className="pill neon" aria-label="Bypass" onClick={onBypass} style={{ filter: activated==='bypass' ? 'brightness(1.25)' : undefined }}>
                      <span className="neon-glow">Bypass</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Florida */}
          <button
            type="button"
            className={['ghost-btn','florida-link','neon-glow', floridaHot?'is-hot':''].join(' ')}
            onClick={()=>{ if(!hideAll){ setFloridaHot(true); setTimeout(()=>setFloridaHot(false),700); setHideBubble(false); setView(v=>v==='banned'?'login':'banned'); }}}
            onMouseEnter={()=>setFloridaHot(true)}
            onMouseLeave={()=>setFloridaHot(false)}
            style={{ marginTop: 10, display:'block', textAlign:'center' }}
          >
            Florida, USA
          </button>
        </div>
      )}

      {/* ---- Global neon + code cosmetics ---- */}
      <style jsx global>{`
        .neon-glow {
          text-shadow:
            0 0 6px rgba(50,255,199,.55),
            0 0 14px rgba(50,255,199,.38),
            0 0 26px rgba(50,255,199,.22);
        }
        .neon-red {
          text-shadow:
            0 0 6px rgba(255,50,50,.55),
            0 0 14px rgba(255,50,50,.38),
            0 0 26px rgba(255,50,50,.22);
        }
        .pill{
          display:inline-flex; align-items:center; justify-content:center;
          height:28px; min-width:28px; padding:0 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff;
          font-weight:700; letter-spacing:.02em;
          transition:transform .12s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
          box-shadow:0 0 0 0 rgba(50,255,199,0);
        }
        .pill.neon{ box-shadow: 0 0 8px rgba(50,255,199,.45), inset 0 0 0 1px rgba(50,255,199,.25); border-color:rgba(50,255,199,.55); }

        .code-tight{ color:#eaeaea; font: 600 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
        .code-comment{ color:#ccfff3; opacity:.85; }
        .code-keyword, .code-var, .code-op, .code-punc{ color:#ccfff3; }
        .code-string{ color:#ccfff3; }
        .banned-trigger{ cursor:pointer; }
      `}</style>
    </div>
  );
}
