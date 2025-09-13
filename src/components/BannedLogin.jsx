// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/* Rainbow "Lameboy" + seafoam ".com" (clicking resets orb to chakra mode) */
function ChakraWord({ word = 'Lameboy', suffix = '.com', onActivate }) {
  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#a855f7'];
  const handle = (e) => { e.preventDefault(); e.stopPropagation(); onActivate?.(); };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handle}
      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ handle(e); }}}
      onPointerDown={(e)=>e.stopPropagation()}
      onMouseDown={(e)=>e.stopPropagation()}
      className="lb-word clickable"
      title="Reset orb to chakra colors"
    >
      {word.split('').map((ch, i) => (
        <span key={i} className="lb-letter" style={{ color: colors[i % colors.length] }}>{ch}</span>
      ))}
      <span className="lb-seafoam">{suffix}</span>
      <style jsx>{`
        .lb-word { display:inline-flex; letter-spacing:.06em; gap:.02em; }
        .lb-word.clickable { cursor: pointer; }
        .lb-letter {
          font-weight:800; -webkit-text-stroke:.6px currentColor;
          text-shadow:
            0 0 10px currentColor, 0 0 26px currentColor, 0 0 54px currentColor,
            0 0 96px currentColor, 0 0 150px currentColor;
          filter:saturate(1.55) contrast(1.2) brightness(1.06);
          animation: lbGlow 1.6s ease-in-out infinite alternate;
        }
        @keyframes lbGlow {
          from { filter:saturate(1.4) contrast(1.15) brightness(1.04); }
          to   { filter:saturate(1.75) contrast(1.25) brightness(1.08); }
        }
      `}</style>
    </span>
  );
}

/* SOLID vertical cascade with white follower */
function CascadeOverlay({ durationMs = 2400 }) {
  const [p, setP] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    let start;
    const step = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / durationMs);
      setP(k);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [durationMs]);

  const whiteW = (p * 100).toFixed(3);
  const COLOR_VW = 120;
  const tx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div
        aria-hidden="true"
        style={{
          position:'fixed', top:0, right:0, height:'100vh',
          width:`${whiteW}%`,
          background:'#fff',
          zIndex:9998, pointerEvents:'none',
          willChange:'width', transition:'width 16ms linear',
          transform:'translateZ(0)', backfaceVisibility:'hidden'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position:'fixed', top:0, left:0, height:'100vh',
          width:`${COLOR_VW}vw`,
          transform:`translate3d(${tx}vw,0,0)`,
          zIndex:9999, pointerEvents:'none',
          willChange:'transform', backfaceVisibility:'hidden'
        }}
      >
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
      <div className="lb-brand" aria-hidden="true" style={{ zIndex: 10001 }}>
        <span className="lb-brand-text">LAMEBOY, USA</span>
      </div>

      <style jsx global>{`
        .lb-cascade{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(7,1fr); height:100%; width:100%; pointer-events:none; contain:layout paint size style; }
        .lb-band{ width:100%; height:100%; opacity:1; background:var(--c); }
        .lb-b1{ --c:#c084fc; } .lb-b2{ --c:#4f46e5; } .lb-b3{ --c:#3b82f6; }
        .lb-b4{ --c:#22c55e; } .lb-b5{ --c:#facc15; } .lb-b6{ --c:#f97316; } .lb-b7{ --c:#ef4444; }
        .lb-brand{ position:fixed; inset:0; display:grid; place-items:center; pointer-events:none; }
        .lb-brand-text{ color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-size:clamp(11px,1.3vw,14px); text-shadow:0 0 8px rgba(0,0,0,.25); }
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

  /* ORB mode + glow */
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState('chakra'); // 'chakra' | 'red'
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

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

  const onBubbleClick = useCallback(() => {
    setBubblePulse(true); setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  const onFloridaClick = useCallback(() => {
    if (hideAll) return;
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, [hideAll]);

  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  // Orb click == Bypass
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  // "is banned" -> scary red. "Lameboy" -> chakra.
  const setRed = useCallback(() => {
    setOrbMode('red'); setOrbGlow(1.0); setOrbVersion(v => v + 1);
  }, []);
  const setChakra = useCallback(() => {
    setOrbMode('chakra'); setOrbGlow(0.9); setOrbVersion(v => v + 1);
  }, []);

  const onBannedClick = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setRed(); }, [setRed]);
  const onBannedKey = useCallback((e) => {
    if (e.key==='Enter'||e.key===' ') { e.preventDefault(); e.stopPropagation(); setRed(); }
  }, [setRed]);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
      {/* CASCADE */}
      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && (
        createPortal(<div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>, document.body)
      )}

      {/* UI (hidden during cascade) */}
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
              role={view==='banned'?'button':undefined}
              tabIndex={view==='banned'?0:-1}
              onClick={view==='banned'?onBubbleClick:undefined}
              onKeyDown={view==='banned'?(e)=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();onBubbleClick();}}:undefined}
            >
              {view==='banned'?(
                <pre className="code-line" style={{ margin:0 }}>
                  <span className="lb-seafoam">//</span>&nbsp;
                  <ChakraWord word="Lameboy" suffix=".com" onActivate={setChakra} />
                  {'\n'}<span className="lb-seafoam">//</span>&nbsp;
                  <span
                    role="button"
                    tabIndex={0}
                    className="code-banned banned-trigger"
                    onClick={onBannedClick}
                    onPointerDown={(e)=>{e.stopPropagation();}}
                    onMouseDown={(e)=>{e.stopPropagation();}}
                    onKeyDown={onBannedKey}
                  >
                    is banned
                  </span>
                  {'\n'}<span className="code-keyword">const</span>&nbsp;<span className="code-var">msg</span><span className="code-op">=</span><span className="code-string">"hi..."</span><span className="code-punc">;</span>
                </pre>
              ):(
                <form onSubmit={(e)=>e.preventDefault()} style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  <div className="code-line"><span className="lb-seafoam">// login</span></div>

                  {/* EMAIL — no "const"; purple glowing input + purple glowing quotes & semicolon */}
                  <div className="code-line">
                    <span className="code-var">email</span>
                    <span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input
                      ref={emailRef}
                      className="code-input code-input-violet"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                    />
                    <span className="code-string">"</span>
                    <span className="code-string">;</span>
                  </div>

                  {/* PHONE — no "const"; purple glowing input + purple glowing quotes & semicolon */}
                  <div className="code-line">
                    <span className="code-var">phone</span>
                    <span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input
                      className="code-input code-input-violet"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="+1 305 555 0123"
                      inputMode="tel"
                      autoComplete="tel"
                      spellCheck={false}
                    />
                    <span className="code-string">"</span>
                    <span className="code-string">;</span>
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
            onClick={onFloridaClick}
            onMouseEnter={()=>setFloridaHot(true)}
            onMouseLeave={()=>setFloridaHot(false)}
          >
            Florida, USA
          </button>
        </div>
      )}

      {/* Global tweaks (adds purple glow to inputs & string tokens) */}
      <style jsx global>{`
        html,body{ background:#000; }

        /* seafoam markers */
        .lb-seafoam{
          color:#32ffc7; font-weight:800;
          text-shadow:0 0 8px #32ffc7,0 0 20px #32ffc7,0 0 44px #32ffc7,0 0 80px #32ffc7;
          filter:saturate(1.35) brightness(1.06);
        }

        /* Purple "string" tokens (quotes + semicolons) */
        .code-string{
          color:#c084fc;
          text-shadow:0 0 6px #c084fc, 0 0 14px #c084fc, 0 0 26px #c084fc;
          font-weight:700;
        }

        /* Make the typed text match that same glowing purple, including iOS autofill */
        .code-input.code-input-violet{
          color:#c084fc;
          -webkit-text-fill-color:#c084fc;  /* iOS */
          caret-color:#c084fc;
          background:transparent;
          text-shadow:0 0 6px #c084fc, 0 0 14px #c084fc, 0 0 26px #c084fc;
        }
        .code-input.code-input-violet::placeholder{
          color:#c084fcaa;
          text-shadow:none;
        }
        /* iOS autofill overrides */
        input.code-input-violet:-webkit-autofill{
          -webkit-text-fill-color:#c084fc !important;
          transition: background-color 9999s ease-in-out 0s !important;
          box-shadow: 0 0 0px 1000px transparent inset !important;
          background-clip: content-box !important;
        }
        input.code-input-violet:autofill{
          -webkit-text-fill-color:#c084fc !important;
          box-shadow: 0 0 0px 1000px transparent inset !important;
        }

        /* Keep your button look; recolor via filters only */
        .commit-btn.btn-bypass{ will-change: filter, transform; transition: filter .15s ease, transform .12s ease; }
        .btn-yellow{ filter: none; }
        .btn-red{ filter: hue-rotate(-95deg) saturate(1.15); }
        .commit-btn.btn-bypass:hover,
        .commit-btn.btn-bypass.btn-activated,
        .commit-btn.btn-bypass:focus-visible{ transform: translateY(-0.5px); outline: none; }

        .code-banned.banned-trigger{ cursor:pointer; text-decoration:none; }
        .code-banned.banned-trigger:hover,
        .code-banned.banned-trigger:focus-visible{ text-decoration:underline; }

        /* Tame heavy mobile bloom for rainbow + seafoam, but keep inputs glowing */
        @media (hover: none) and (pointer: coarse){
          .lb-letter{ text-shadow:0 0 2px currentColor, 0 0 6px currentColor, 0 0 10px currentColor !important; filter:none !important; }
          .lb-seafoam{ text-shadow:0 0 2px #32ffc7, 0 0 6px #32ffc7, 0 0 12px #32ffc7 !important; filter:none !important; }
        }
      `}</style>

      <style jsx>{`
        .orb-row{ width:100%; contain:layout paint style; isolation:isolate; }
      `}</style>
    </div>
  );
}
