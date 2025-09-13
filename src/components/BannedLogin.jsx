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

/* SOLID vertical chakra cascade (no blur), with white follower from the right */
function CascadeOverlay({ durationMs = 2400 }) {
  const [p, setP] = useState(0); // 0..1 timeline
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

  // White follower grows from the right.
  const whiteW = (p * 100).toFixed(3);

  // Color block: fixed width in vw, slides right -> left beyond screen.
  const COLOR_VW = 120;
  const tx = (1 - p) * (100 + COLOR_VW) - COLOR_VW; // in vw

  return createPortal(
    <>
      {/* WHITE follower under the colors */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: `${whiteW}%`,
          background: '#fff',
          zIndex: 9998,
          pointerEvents: 'none',
          willChange: 'width',
          transition: 'width 16ms linear',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* COLOR stripes moving as one block (hard edges) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: `${COLOR_VW}vw`,
          transform: `translate3d(${tx}vw,0,0)`,
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
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

      {/* BRAND stays on top during the whole sweep */}
      <div className="lb-brand" aria-hidden="true" style={{ zIndex: 10001 }}>
        <span className="lb-brand-text">LAMEBOY, USA</span>
      </div>

      {/* Hard-edged, fully opaque stripes — no glows, no filters */}
      <style jsx global>{`
        .lb-cascade {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(7, 1fr); /* vertical bars */
          height: 100%;
          width: 100%;
          pointer-events: none;
          mix-blend-mode: initial;
          contain: layout paint size style;
        }
        .lb-band {
          width: 100%;
          height: 100%;
          opacity: 1;
          background: var(--c);
          box-shadow: none !important;
          filter: none !important;
          image-rendering: crisp-edges;
        }
        /* Chakra colors (crown → root) */
        .lb-b1 { --c: #c084fc; }
        .lb-b2 { --c: #4f46e5; }
        .lb-b3 { --c: #3b82f6; }
        .lb-b4 { --c: #22c55e; }
        .lb-b5 { --c: #facc15; }
        .lb-b6 { --c: #f97316; }
        .lb-b7 { --c: #ef4444; }

        .lb-brand {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .lb-brand-text {
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: clamp(11px, 1.3vw, 14px);
          text-shadow: 0 0 8px rgba(0,0,0,.25);
        }
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

  // Hide UI → run cascade → keep white
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

  // Orb click == Bypass (true 3D hit only)
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  // "is banned" -> scary red. "Lameboy" -> chakra.
  const setRed = useCallback(() => {
    setOrbMode('red');
    setOrbGlow(1.0);
    setOrbVersion(v => v + 1);
  }, []);
  const setChakra = useCallback(() => {
    setOrbMode('chakra');
    setOrbGlow(0.9);
    setOrbVersion(v => v + 1);
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
              key={`${orbMode}-${orbGlow}-${orbVersion}`} // hard remount on changes
              rpm={44}                      // spin faster
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

                  {/* email line with NEON glow on email =" */}
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;
                    <span className="neon-chunk">
                      <span className="code-var">email</span>
                      <span className="code-op">=</span>
                      <span className="code-string">"</span>
                    </span>
                    <input
                      ref={emailRef}
                      className="code-input"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                    />
                    <span className="code-string">"</span>
                    <span className="code-punc">;</span>
                  </div>

                  {/* phone line with NEON glow on phone =" */}
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;
                    <span className="neon-chunk">
                      <span className="code-var">phone</span>
                      <span className="code-op">=</span>
                      <span className="code-string">"</span>
                    </span>
                    <input
                      className="code-input"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="+1 305 555 0123"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <span className="code-string">"</span>
                    <span className="code-punc">;</span>
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

      {/* Global tweaks (incl. NEW neon-chunk glow) */}
      <style jsx global>{`
        html,body{ background:#000; }

        .lb-seafoam{
          color:#32ffc7; font-weight:800;
          text-shadow:0 0 8px #32ffc7,0 0 20px #32ffc7,0 0 44px #32ffc7,0 0 80px #32ffc7;
          filter:saturate(1.35) brightness(1.06);
        }

        /* NEW: Neon glow for the email =" and phone =" tokens, keeps original colors */
        .neon-chunk > .code-var,
        .neon-chunk > .code-op,
        .neon-chunk > .code-string {
          position: relative;
          text-shadow:
            0 0 6px currentColor,
            0 0 16px currentColor,
            0 0 36px currentColor,
            0 0 64px currentColor;
          filter: saturate(1.25) brightness(1.06);
          mix-blend-mode: screen;
        }
        /* Tame the bloom a bit on mobile */
        @media (hover: none) and (pointer: coarse) {
          .neon-chunk > .code-var,
          .neon-chunk > .code-op,
          .neon-chunk > .code-string {
            text-shadow:
              0 0 3px currentColor,
              0 0 8px currentColor,
              0 0 18px currentColor;
            filter: none;
          }
        }

        .commit-btn.btn-bypass{ will-change: filter, transform; transition: filter .15s ease, transform .12s ease; }
        .btn-yellow{ filter: none; }
        .btn-red{ filter: hue-rotate(-95deg) saturate(1.15); }
        .commit-btn.btn-bypass:hover,
        .commit-btn.btn-bypass.btn-activated,
        .commit-btn.btn-bypass:focus-visible{ transform: translateY(-0.5px); outline: none; }

        .code-banned.banned-trigger{ cursor:pointer; text-decoration:none; }
        .code-banned.banned-trigger:hover,
        .code-banned.banned-trigger:focus-visible{ text-decoration:underline; }

        /* iOS/Safari mobile: tone down bloom for rainbow + seafoam */
        @media (hover: none) and (pointer: coarse){
          .lb-letter{
            text-shadow: 0 0 2px currentColor, 0 0 6px currentColor, 0 0 10px currentColor !important;
            filter: none !important;
          }
          .lb-seafoam{
            text-shadow: 0 0 2px #32ffc7, 0 0 6px #32ffc7, 0 0 12px #32ffc7 !important;
            filter: none !important;
          }
        }
      `}</style>

      <style jsx>{`
        .orb-row{
          width:100%;
          contain: layout paint style;
          isolation: isolate;
        }
      `}</style>
    </div>
  );
}
