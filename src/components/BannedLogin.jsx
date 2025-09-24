// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import ButterflyChakra from '@/components/ButterflyChakra';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/** Brand: glue ".com" to "Lameboy" (no spacing glitches). Click to launch butterfly. */
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
          color:#fff; font-weight:800; letter-spacing:0; word-spacing:0;
          text-shadow:0 0 8px #fff,0 0 18px #fff,0 0 36px #fff,0 0 70px #fff;
        }
        .lb-seafoam { letter-spacing:0; word-spacing:0; }
      `}</style>
    </span>
  );
}

/* Cascade overlay */
function CascadeOverlay({ durationMs = 2400 }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let start; let id;
    const step = (t) => { if (start == null) start = t; const k=Math.min(1,(t-start)/durationMs); setP(k); if(k<1) id=requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [durationMs]);

  const whiteW = (p * 100).toFixed(3);
  const COLOR_VW = 120;
  const tx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden="true" style={{
        position:'fixed', top:0, right:0, height:'100vh',
        width:`${whiteW}%`, background:'#fff',
        zIndex:9998, pointerEvents:'none', willChange:'width',
        transition:'width 16ms linear'
      }}/>
      <div aria-hidden="true" style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${tx}vw,0,0)`,
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
        .lb-band{ width:100%; height:100%; background:var(--c); }
        .lb-b1{ --c:#c084fc } .lb-b2{ --c:#4f46e5 } .lb-b3{ --c:#3b82f6 }
        .lb-b4{ --c:#22c55e } .lb-b5{ --c:#facc15 } .lb-b6{ --c:#f97316 } .lb-b7{ --c:#ef4444 }
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

export default function BannedLogin() {
  const [view, setView] = useState('banned'); // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  const [activated, setActivated] = useState(null); // 'link' | 'bypass' | null

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  // orb state
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState('chakra'); // 'chakra' | 'red'
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  // butterfly state + letter refs
  const lRef = useRef(null);
  const yRef = useRef(null);
  const [flyOnce, setFlyOnce] = useState(false);

  useEffect(() => {
    const lock = cascade || whiteout;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cascade, whiteout]);

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 200);
  }, []);

  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true); setHideAll(true); setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}
    const t = setTimeout(() => { setCascade(false); if (washAway) setHideBubble(true); setWhiteout(true); after && after(); }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  const onLink   = useCallback(() => { setActivated('link');   setTimeout(()=>setActivated(null),650);   runCascade(()=>{}, { washAway:true }); }, [runCascade]);
  const onBypass = useCallback(() => { setActivated('bypass'); setTimeout(()=>setActivated(null),650); runCascade(()=>{}, { washAway:true }); }, [runCascade]);
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  /** Toggle orb color via “is banned” */
  const toggleOrbColor = useCallback(() => {
    setOrbMode(prev => {
      const next = prev === 'red' ? 'chakra' : 'red';
      setOrbGlow(next === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      return next;
    });
  }, []);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
      {/* Butterfly overlay (mounted for a single flight) */}
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
        <div className="login-stack">
          <div className="orb-row" style={{ marginBottom:-28 }}>
            <BlueOrbCross3D
              key={`${orbMode}-${orbGlow}-${orbVersion}`}
              rpm={44}
              color={SEAFOAM}
              geomScale={1}
              glow
              glowOpacity={orbGlow}
              includeZAxis
              height="10vh"
              onActivate={onOrbActivate}
              overrideAllColor={orbMode==='red' ? RED : null}
              overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
            />
          </div>

          {!hideBubble && (
            <div
              className={[
                'vscode-card','card-ultra-tight','login-card',
                view==='banned' ? 'slide-in-left' : 'slide-in-right',
                'bubble-button'
              ].join(' ')}
              style={{ minWidth:260 }}
              role={view==='login' ? 'form' : undefined}
              tabIndex={view==='login' ? 0 : -1}
            >
              {view==='banned' ? (
                <pre className="code-tight" style={{ margin:0 }}>
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <Wordmark
                    onClickWordmark={() => setFlyOnce(true)}
                    lRef={lRef}
                    yRef={yRef}
                  />
                  {'\n'}
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <span
                    role="button" tabIndex={0}
                    className="code-banned banned-trigger"
                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}}
                    title="Toggle orb color"
                  >
                    is banned
                  </span>{'\n'}
                  <span className="code-keyword">const</span>{' '}
                  <span className="code-var">msg</span>{' '}
                  <span className="code-op">=</span>{' '}
                  <span className="nogap">
                    <span
                      role="button" tabIndex={0}
                      className="code-string code-link"
                      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); goLogin(); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); goLogin(); }}}
                    >
                      "hi..."
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

                  <div className="row-nowrap" style={{ marginTop:6, gap:8 }}>
                    <button
                      type="button"
                      className={`commit-btn btn-yellow ${activated==='link'?'btn-activated':''}`}
                      onClick={onLink}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className={`commit-btn btn-red ${activated==='bypass'?'btn-activated':''}`}
                      onClick={onBypass}
                    >
                      Bypass
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <button
            type="button"
            className={['ghost-btn','florida-link','florida-inline', floridaHot?'is-hot':''].join(' ')}
            onClick={()=>{ if(!hideAll){ setFloridaHot(true); setTimeout(()=>setFloridaHot(false),700); setHideBubble(false); setView(v=>v==='banned'?'login':'banned'); }}}
            onMouseEnter={()=>setFloridaHot(true)}
            onMouseLeave={()=>setFloridaHot(false)}
          >
            Florida, USA
          </button>
        </div>
      )}

      {/* Local CSS (scoped to login bubble) */}
      <style jsx global>{`
        :root { --lb-seafoam:#32ffc7; }

        .login-card pre.code-tight{
          letter-spacing:0;
          word-spacing:-0.10ch;
          white-space:pre;
          line-height:1.35;
        }
        .code-row{ display:flex; align-items:baseline; gap:.35ch; line-height:1.35; }
        .nogap{ display:inline-flex; gap:0; }

        .login-card .lb-seafoam,
        .login-card .code-comment{
          color:var(--lb-seafoam) !important;
          text-shadow:0 0 6px var(--lb-seafoam), 0 0 14px var(--lb-seafoam);
          letter-spacing:0; word-spacing:normal;
        }

        .login-card .code-keyword,
        .login-card .code-var,
        .login-card .code-op,
        .login-card .code-string,
        .login-card .code-punc,
        .login-card .lb-white {
          text-shadow:0 0 6px currentColor, 0 0 14px currentColor;
        }

        /* ===== Buttons ===== */
        .login-card .commit-btn{
          border:none; border-radius:10px; padding:6px 10px; font-weight:700;
          line-height:1; cursor:pointer; transition:color .15s ease, box-shadow .15s ease, filter .15s ease;
        }
        .login-card .btn-yellow{
          background:linear-gradient(#ffd84a,#f7b400);
          color:#2a2000;
          box-shadow:0 0 14px rgba(255,214,64,.35), 0 0 28px rgba(255,214,64,.18);
        }
        .login-card .btn-red{
          background:linear-gradient(#ff4b66,#d90f1c);
          color:#330004;
          box-shadow:0 0 14px rgba(255,76,97,.40), 0 0 28px rgba(255,76,97,.22);
        }
        .login-card .commit-btn.btn-activated,
        .login-card .commit-btn:active{
          color:#fff !important;
          text-shadow:0 0 6px #fff, 0 0 14px #fff, 0 0 26px #fff;
          filter:saturate(1.15) brightness(1.15);
        }
        .login-card .commit-btn:focus-visible{
          outline:2px solid rgba(255,255,255,.65);
          outline-offset:2px;
        }

        /* Inputs */
        .code-input-violet{
          color:#a78bfa; -webkit-text-fill-color:#a78bfa !important; caret-color:#a78bfa;
          background:transparent; border:0; outline:0; font:inherit; padding:0; margin:0; width:auto;
          text-shadow:0 0 6px #a78bfa, 0 0 14px #a78bfa; filter:saturate(1.15);
        }
        .code-input-violet::placeholder{
          color:#9a8aec; opacity:.95; text-shadow:0 0 4px #9a8aec, 0 0 10px #9a8aec;
        }

        .code-link{ cursor:pointer; text-decoration:none; }
        .code-link:hover, .code-link:focus-visible{ text-decoration:underline; outline:none; }
        .code-banned.banned-trigger{ cursor:pointer; text-decoration:none; }
        .code-banned.banned-trigger:hover, .code-banned.banned-trigger:focus-visible{ text-decoration:underline; }
      `}</style>

      <style jsx>{`.orb-row{ width:100%; contain:layout paint style; isolation:isolate; }`}</style>
    </div>
  );
}
