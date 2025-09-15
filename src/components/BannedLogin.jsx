'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

function Wordmark({ word = 'Lameboy', suffix = '.com' }) {
  return (
    <span className="lb-word">
      <span className="lb-white">{word}</span>
      <span className="lb-seafoam">{suffix}</span>
      <style jsx>{`
        .lb-word{display:inline-flex;letter-spacing:.06em;gap:.02em}
        .lb-white{
          color:#fff;font-weight:800;
          text-shadow:0 0 8px #fff,0 0 18px #fff,0 0 36px #fff,0 0 70px #fff;
        }
      `}</style>
    </span>
  );
}

function CascadeOverlay({ durationMs = 2400 }) {
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
    return () => cancelAnimationFrame(id);
  }, [durationMs]);

  const whiteW = (p * 100).toFixed(3);
  const COLOR_VW = 120;
  const tx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden="true" style={{
        position:'fixed', inset:'0 0 0 auto', height:'100vh',
        width:`${whiteW}%`, background:'#fff',
        zIndex:9998, pointerEvents:'none', willChange:'width',
        transition:'width 16ms linear'
      }} />
      <div aria-hidden="true" style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${tx}vw,0,0)`,
        zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div className="lb-cascade">
          <div className="lb-band lb-b1" />
          <div className="lb-band lb-b2" />
          <div className="lb-band lb-b3" />
          <div className="lb-band lb-b4" />
          <div className="lb-band lb-b5" />
          <div className="lb-band lb-b6" />
          <div className="lb-band lb-b7" />
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
        .lb-brand-text{ color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
                        font-size:clamp(11px,1.3vw,14px); text-shadow:0 0 8px rgba(0,0,0,.25); }
      `}</style>
    </>,
    document.body
  );
}

export default function BannedLogin() {
  const [view, setView] = useState('banned');
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [bubblePulse, setBubblePulse] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  const [activated, setActivated] = useState(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState('chakra');
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  // lock body scroll during cascade/whiteout
  useEffect(() => {
    const lock = cascade || whiteout;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cascade, whiteout]);

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    setHideAll(true);
    setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}
    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true);
      after && after();
    }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  const setRed = useCallback(() => {
    setOrbMode('red'); setOrbGlow(1.0); setOrbVersion(v => v + 1);
  }, []);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
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
                view==='banned'?'slide-in-left':'slide-in-right',
                'bubble-button', bubblePulse?'bubble-glow-blue':'',
              ].join(' ')}
              style={{ minWidth:260 }}
              role={view==='login'?'form':undefined}
              tabIndex={view==='login'?0:-1}
            >
              {view==='banned'?(
                <pre className="code-line" style={{ margin:0 }}>
                  <span className="lb-seafoam">//</span>&nbsp;
                  <Wordmark />
                  {'\n'}<span className="lb-seafoam">//</span>&nbsp;
                  <span
                    role="button" tabIndex={0}
                    className="code-banned banned-trigger"
                    onClick={(e)=>{e.preventDefault();e.stopPropagation();setRed();}}
                    onPointerDown={(e)=>e.stopPropagation()}
                    onMouseDown={(e)=>e.stopPropagation()}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); setRed(); }}}
                  >
                    is banned
                  </span>
                  {'\n'}
                  <span className="code-keyword">const</span>&nbsp;<span className="code-var">msg</span>
                  <span className="code-op">=</span>
                  <span
                    role="button" tabIndex={0}
                    className="code-string code-link"
                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); goLogin(); }}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); goLogin(); }}}
                  >
                    "hi..."
                  </span>
                  <span className="code-punc">;</span>
                </pre>
              ):(
                <form onSubmit={(e)=>e.preventDefault()} style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  <div className="code-line"><span className="lb-seafoam">// login</span></div>

                  <div className="code-line">
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
                      size={24}
                    />
                    <span className="code-string neon-violet">"</span>
                    <span className="code-punc neon-violet">;</span>
                  </div>

                  <div className="code-line">
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
                      size={18}
                    />
                    <span className="code-string neon-violet">"</span>
                    <span className="code-punc neon-violet">;</span>
                  </div>

                  <div className="row-nowrap" style={{ marginTop:6, gap:8 }}>
                    <button
                      type="button"
                      className={`commit-btn btn-bypass btn-link btn-yellow ${activated==='link'?'btn-activated':''}`}
                      onClick={onLink}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className={`commit-btn btn-bypass btn-red ${activated==='bypass'?'btn-activated':''}`}
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

      <style jsx global>{`
        html,body{ background:#000; }

        .lb-seafoam{
          color:#32ffc7; font-weight:800;
          text-shadow:0 0 8px #32ffc7,0 0 20px #32ffc7,0 0 44px #32ffc7,0 0 80px #32ffc7;
          filter:saturate(1.35) brightness(1.06);
        }
        .neon-violet{
          color:#a78bfa;
          text-shadow:0 0 6px #a78bfa, 0 0 14px #a78bfa, 0 0 26px #a78bfa;
          filter:saturate(1.25);
        }
        .code-link{ cursor:pointer; text-decoration:none; }
        .code-link:hover, .code-link:focus-visible{ text-decoration:underline; outline:none; }
        .code-input-violet{
          color:#a78bfa; -webkit-text-fill-color:#a78bfa !important; caret-color:#a78bfa;
          background:transparent; border:0; outline:0; font:inherit;
          text-shadow:0 0 4px #a78bfa, 0 0 10px #a78bfa, 0 0 18px #a78bfa; filter:saturate(1.15);
          padding:0; margin:0; width:auto;
        }
        .code-input-violet::placeholder{ color:#9a8aec; opacity:.9;
          text-shadow:0 0 3px #9a8aec, 0 0 8px #9a8aec; }
        .code-input-violet::selection{ background: rgba(167,139,250,.25); }

        .commit-btn.btn-bypass{ will-change: filter, transform; transition: filter .15s ease, transform .12s ease; }
        .btn-yellow{ filter:none; } .btn-red{ filter:hue-rotate(-95deg) saturate(1.15); }
        .code-banned.banned-trigger{ cursor:pointer; text-decoration:none; }
        .code-banned.banned-trigger:hover, .code-banned.banned-trigger:focus-visible{ text-decoration:underline; }

        @media (hover:none) and (pointer:coarse){
          .lb-white{ text-shadow:0 0 6px #fff,0 0 12px #fff,0 0 22px #fff !important; }
          .lb-seafoam{ text-shadow:0 0 4px #32ffc7,0 0 10px #32ffc7,0 0 16px #32ffc7 !important; }
          .neon-violet{ text-shadow:0 0 4px #a78bfa,0 0 10px #a78bfa,0 0 16px #a78bfa !important; }
        }
      `}</style>

      <style jsx>{`.orb-row{ width:100%; contain:layout paint style; isolation:isolate; }`}</style>
    </div>
  );
}
