// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/* Rainbow "Lameboy" + seafoam ".com" */
function ChakraWord({ word = 'Lameboy', suffix = '.com' }) {
  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#a855f7'];
  return (
    <span className="lb-word">
      {word.split('').map((ch, i) => (
        <span key={i} className="lb-letter" style={{ color: colors[i % colors.length] }}>{ch}</span>
      ))}
      <span className="lb-seafoam">{suffix}</span>
      <style jsx>{`
        .lb-word { display:inline-flex; letter-spacing:.06em; gap:.02em; }
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

/* Body portal so overlays never get clipped */
function BodyPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* JS-driven cascade with MOVING COLOR WINDOW (vertical bands) ahead of white follower */
function CascadeOverlay({ durationMs = 2400, leadPct = 18 }) {
  const [progress, setProgress] = useState(0); // 0..1 -> white width
  const rafRef = useRef();

  useEffect(() => {
    let start;
    const step = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [durationMs]);

  const whiteW = progress * 100;
  const colorW = Math.min(100, whiteW + leadPct);

  return (
    <BodyPortal>
      {/* WHITE follower (under the colors) */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', top:0, right:0, height:'100vh',
          width:`${whiteW.toFixed(3)}%`,
          background:'#fff',
          zIndex:9998, pointerEvents:'none',
          willChange:'width', transition:'width 16ms linear',
          transform:'translateZ(0)'
        }}
      />
      {/* COLOR WINDOW (rides ahead of white) */}
      <div
        className="lb-color-window"
        aria-hidden="true"
        style={{
          position:'fixed', top:0, right:0, height:'100vh',
          width:`${colorW.toFixed(3)}%`,
          overflow:'hidden',
          zIndex:9999, pointerEvents:'none',
          transform:'translateZ(0)'
        }}
      >
        <div className="lb-cascade" style={{ '--lbDur': `${durationMs}ms` }}>
          <div className="lb-band lb-b1" />
          <div className="lb-band lb-b2" />
          <div className="lb-band lb-b3" />
          <div className="lb-band lb-b4" />
          <div className="lb-band lb-b5" />
          <div className="lb-band lb-b6" />
          <div className="lb-band lb-b7" />
        </div>
      </div>
      {/* BRAND above all during the sweep */}
      <div className="lb-brand" aria-hidden="true" style={{ zIndex: 10001 }}>
        <span className="lb-brand-text">LAMEBOY, USA</span>
      </div>

      {/* GLOBAL styles for portal content */}
      <style jsx global>{`
        .lb-cascade{
          position:absolute; inset:0;
          display:grid; grid-template-columns:repeat(7,1fr); /* vertical bands */
          pointer-events:none; mix-blend-mode:screen;
          height:100%; width:100%;
          contain:layout paint size style;
        }
        .lb-band{
          width:100%; height:100%; opacity:.95; background-size:240% 100%;
          animation:lbSlide var(--lbDur) ease-in-out forwards;
        }
        .lb-b1{background-image:linear-gradient(90deg,rgba(192,132,252,0),rgba(192,132,252,.86),rgba(192,132,252,0))}
        .lb-b2{background-image:linear-gradient(90deg,rgba(79,70,229,0), rgba(79,70,229,.88), rgba(79,70,229,0))}
        .lb-b3{background-image:linear-gradient(90deg,rgba(59,130,246,0), rgba(59,130,246,.90), rgba(59,130,246,0))}
        .lb-b4{background-image:linear-gradient(90deg,rgba(34,197,94,0),  rgba(34,197,94,.90),  rgba(34,197,94,0))}
        .lb-b5{background-image:linear-gradient(90deg,rgba(250,204,21,0), rgba(250,204,21,.92), rgba(250,204,21,0))}
        .lb-b6{background-image:linear-gradient(90deg,rgba(249,115,22,0), rgba(249,115,22,.92), rgba(249,115,22,0))}
        .lb-b7{background-image:linear-gradient(90deg,rgba(239,68,68,0),  rgba(239,68,68,.92),  rgba(239,68,68,0))}
        @keyframes lbSlide{ from{background-position:110% 0} to{background-position:-130% 0} }

        .lb-brand{ position:fixed; inset:0; display:grid; place-items:center; pointer-events:none; }
        .lb-brand-text{
          color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
          font-size:clamp(11px,1.3vw,14px); text-shadow:0 0 8px rgba(0,0,0,.25);
        }
      `}</style>
    </BodyPortal>
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

  /* ORB color: default seafoam; turns red when clicking "is banned" */
  const [orbColor, setOrbColor] = useState('#32ffc7');

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  // Hide UI -> run cascade -> hold white
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

  // Orb click == Bypass (true 3D hit only inside BlueOrbCross3D)
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  // "is banned" click -> turn orb red (without triggering bubble click)
  const onBannedClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOrbColor('#ff2a2a'); // neon red
  }, []);

  // keyboard support for "is banned"
  const onBannedKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setOrbColor('#ff2a2a');
    }
  }, []);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
      {/* CASCADE */}
      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && (
        <BodyPortal>
          <div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>
        </BodyPortal>
      )}

      {/* UI (hidden during cascade) */}
      {!hideAll && (
        <div className="login-stack">
          <div className="orb-row" style={{ marginBottom:-28 }}>
            <BlueOrbCross3D
              key={orbColor}          // force remount so color always updates
              rpm={14.4}
              color={orbColor}
              geomScale={1}
              glow
              glowOpacity={0.85}
              includeZAxis
              height="10vh"
              onActivate={onOrbActivate}
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
                  <span className="lb-seafoam">//</span>&nbsp;<ChakraWord word="Lameboy" suffix=".com" />
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
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;<span className="code-var">email</span><span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input ref={emailRef} className="code-input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" />
                    <span className="code-string">"</span><span className="code-punc">;</span>
                  </div>
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;<span className="code-var">phone</span><span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input className="code-input" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+1 305 555 0123" inputMode="tel" autoComplete="tel" />
                    <span className="code-string">"</span><span className="code-punc">;</span>
                  </div>
                  <div className="row-nowrap" style={{ marginTop:6, gap:8 }}>
                    {/* LINK: exact old BYPASS look (yellow) */}
                    <button
                      type="button"
                      className={`commit-btn btn-bypass btn-link btn-yellow ${activated==='link'?'btn-activated':''}`}
                      onClick={onLink}
                    >
                      Link
                    </button>
                    {/* BYPASS: same style, recolored to red via hue rotate */}
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

      {/* Global touches: base bg + shared seafoam glow + tiny color helpers + banned trigger */}
      <style jsx global>{`
        html,body{ background:#000; }
        .lb-seafoam{
          color:#32ffc7; font-weight:800;
          text-shadow:0 0 8px #32ffc7,0 0 20px #32ffc7,0 0 44px #32ffc7,0 0 80px #32ffc7;
          filter:saturate(1.35) brightness(1.06);
        }

        /* Keep existing button look. Only recolor via filters. */
        .commit-btn.btn-bypass{ will-change: filter, transform; transition: filter .15s ease, transform .12s ease; }
        .btn-yellow{ filter: none; } /* original yellow look (no change) */
        .btn-red{ filter: hue-rotate(-95deg) saturate(1.15); } /* shift yellow style to red */
        .commit-btn.btn-bypass:hover,
        .commit-btn.btn-bypass.btn-activated,
        .commit-btn.btn-bypass:focus-visible{
          transform: translateY(-0.5px);
          outline: none;
        }

        /* "is banned" as a true button: no permanent underline */
        .code-banned.banned-trigger{
          cursor:pointer; text-decoration:none;
        }
        .code-banned.banned-trigger:hover,
        .code-banned.banned-trigger:focus-visible{
          text-decoration:underline;
        }
      `}</style>

      <style jsx>{`.orb-row{ width:100%; }`}</style>
    </div>
  );
}
