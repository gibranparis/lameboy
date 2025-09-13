// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/** Chakra rainbow "Lameboy" + seafoam ".com" */
function ChakraWord({ word = 'Lameboy', suffix = '.com' }) {
  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#a855f7']; // root→crown
  return (
    <span className="chakra-word">
      {word.split('').map((ch, i) => (
        <span key={`${ch}-${i}`} className="chakra-letter" style={{ color: colors[i % colors.length] }}>
          {ch}
        </span>
      ))}
      <span className="seafoam-glow">{suffix}</span>

      <style jsx>{`
        .chakra-word { display:inline-flex; letter-spacing:.06em; gap:.02em; }
        .chakra-letter {
          font-weight:800; -webkit-text-stroke:.6px currentColor;
          text-shadow:
            0 0 10px currentColor, 0 0 26px currentColor, 0 0 54px currentColor,
            0 0 96px currentColor, 0 0 150px currentColor;
          filter:saturate(1.55) contrast(1.2) brightness(1.06);
          animation: glowPulse 1.6s ease-in-out infinite alternate;
        }
        .seafoam-glow {
          margin-left:.06em; color:#32ffc7; font-weight:800;
          text-shadow:0 0 8px #32ffc7, 0 0 20px #32ffc7, 0 0 44px #32ffc7, 0 0 80px #32ffc7;
          filter:saturate(1.35) brightness(1.06);
        }
        @keyframes glowPulse {
          from { filter:saturate(1.4) contrast(1.15) brightness(1.04); }
          to   { filter:saturate(1.75) contrast(1.25) brightness(1.08); }
        }
      `}</style>
    </span>
  );
}

/** Client-only portal */
function BodyPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** JS-driven cascade so it can't be blocked by scoped CSS */
function CascadeOverlay({ durationMs = 2400 }) {
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

  return (
    <BodyPortal>
      {/* 1) WHITE SWEEP BELOW bands: follows behind the colors */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', top:0, right:0, height:'100vh',
          width: `${(progress * 100).toFixed(3)}%`,
          background:'#fff', zIndex: 9998, pointerEvents:'none',
          willChange:'width', transition:'width 16ms linear',
        }}
      />
      {/* 2) CHAKRA BANDS ON TOP of sweep (so colors are visible) */}
      <div className="chakra-overlay" aria-hidden="true" style={{ zIndex: 9999 }}>
        <div className="chakra-band band-1" />
        <div className="chakra-band band-2" />
        <div className="chakra-band band-3" />
        <div className="chakra-band band-4" />
        <div className="chakra-band band-5" />
        <div className="chakra-band band-6" />
        <div className="chakra-band band-7" />
      </div>
      {/* 3) BRAND above everything during the cascade */}
      <div className="brand-overlay" aria-hidden="true" style={{ zIndex: 10001 }}>
        <span className="brand-overlay-text">LAMEBOY, USA</span>
      </div>

      {/* GLOBAL styles for the portal content */}
      <style jsx global>{`
        .chakra-overlay {
          position:fixed; inset:0; display:grid; grid-template-rows:repeat(7, 1fr);
          mix-blend-mode:screen; /* vivid colors on dark */
          pointer-events:none;
        }
        .chakra-band { width:100%; height:100%; opacity:.92; background-size: 240% 100%;
          animation: chakraSlide ${durationMs}ms ease-in-out forwards; }
        .band-1 { background-image: linear-gradient(90deg, rgba(192,132,252,.0), rgba(192,132,252,.8), rgba(192,132,252,.0)); } /* crown */
        .band-2 { background-image: linear-gradient(90deg, rgba(79,70,229,.0),  rgba(79,70,229,.85),  rgba(79,70,229,.0)); } /* third eye */
        .band-3 { background-image: linear-gradient(90deg, rgba(59,130,246,.0),  rgba(59,130,246,.9),  rgba(59,130,246,.0)); } /* throat */
        .band-4 { background-image: linear-gradient(90deg, rgba(34,197,94,.0),   rgba(34,197,94,.9),   rgba(34,197,94,.0)); } /* heart */
        .band-5 { background-image: linear-gradient(90deg, rgba(250,204,21,.0),  rgba(250,204,21,.9),  rgba(250,204,21,.0)); } /* solar */
        .band-6 { background-image: linear-gradient(90deg, rgba(249,115,22,.0),  rgba(249,115,22,.9),  rgba(249,115,22,.0)); } /* sacral */
        .band-7 { background-image: linear-gradient(90deg, rgba(239,68,68,.0),   rgba(239,68,68,.9),   rgba(239,68,68,.0)); } /* root */
        @keyframes chakraSlide {
          from { background-position: 110% 0; }
          to   { background-position: -130% 0; }
        }
        .brand-overlay {
          position:fixed; inset:0; display:grid; place-items:center; pointer-events:none;
        }
        .brand-overlay-text {
          color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
          font-size:clamp(11px, 1.3vw, 14px); text-shadow:0 0 8px rgba(0,0,0,.25);
        }
      `}</style>
    </BodyPortal>
  );
}

export default function BannedLogin() {
  const [view, setView] = useState('banned');     // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);  // cascade running
  const [hideAll, setHideAll] = useState(false);  // hide UI during cascade
  const [whiteout, setWhiteout] = useState(false);// full white after

  const [hideBubble, setHideBubble] = useState(false);
  const [bubblePulse, setBubblePulse] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  const [activated, setActivated] = useState(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  // Start cascade: hide UI (black bg remains), show chakra + trailing white, then lock white.
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    setHideAll(true);
    setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true); // introduce solid white screen after colors finish
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

  // ORB click behaves exactly like Bypass (3D hit only; handled by BlueOrbCross3D raycast)
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
      {/* CASCADE */}
      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && (
        <BodyPortal>
          <div aria-hidden="true" style={{
            position:'fixed', inset:0, background:'#fff',
            zIndex: 10002, pointerEvents:'none'
          }}/>
        </BodyPortal>
      )}

      {/* Normal UI (hidden during cascade) */}
      {!hideAll && (
        <div className="login-stack">
          {/* 3D orb */}
          <div className="orb-row" style={{ marginBottom: -28 }}>
            <BlueOrbCross3D
              rpm={14.4}
              color="#32ffc7"
              geomScale={1}
              glow
              glowOpacity={0.85}
              includeZAxis
              height="10vh"
              onActivate={onOrbActivate}
            />
          </div>

          {/* Blue bubble */}
          {!hideBubble && (
            <div
              className={[
                'vscode-card','card-ultra-tight','login-card',
                view === 'banned' ? 'slide-in-left' : 'slide-in-right',
                'bubble-button', bubblePulse ? 'bubble-glow-blue' : '',
              ].join(' ')}
              style={{ minWidth: 260 }}
              role={view === 'banned' ? 'button' : undefined}
              tabIndex={view === 'banned' ? 0 : -1}
              onClick={view === 'banned' ? onBubbleClick : undefined}
              onKeyDown={
                view === 'banned'
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBubbleClick(); } }
                  : undefined
              }
            >
              {view === 'banned' ? (
                <pre className="code-line" style={{ margin: 0 }}>
                  <span className="seafoam-glow">//</span>&nbsp;
                  <ChakraWord word="Lameboy" suffix=".com" />
                  {'\n'}
                  <span className="seafoam-glow">//</span>&nbsp;
                  <span className="code-banned">is banned</span>
                  {'\n'}
                  <span className="code-keyword">const</span>&nbsp;
                  <span className="code-var">msg</span>
                  <span className="code-op">=</span>
                  <span className="code-string">"hi..."</span>
                  <span className="code-punc">;</span>
                </pre>
              ) : (
                <form onSubmit={(e) => e.preventDefault()} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div className="code-line">
                    <span className="seafoam-glow">// login</span>
                  </div>
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;
                    <span className="code-var">email</span>
                    <span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input
                      ref={emailRef}
                      className="code-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                    />
                    <span className="code-string">"</span>
                    <span className="code-punc">;</span>
                  </div>
                  <div className="code-line">
                    <span className="code-keyword">const</span>&nbsp;
                    <span className="code-var">phone</span>
                    <span className="code-op">=</span>
                    <span className="code-string">"</span>
                    <input
                      className="code-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 305 555 0123"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <span className="code-string">"</span>
                    <span className="code-punc">;</span>
                  </div>
                  <div className="row-nowrap" style={{ marginTop: 6, gap: 8 }}>
                    <button type="button" className={`commit-btn btn-link ${activated === 'link' ? 'btn-activated' : ''}`} onClick={onLink}>Link</button>
                    <button type="button" className={`commit-btn btn-bypass ${activated === 'bypass' ? 'btn-activated' : ''}`} onClick={onBypass}>Bypass</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <button
            type="button"
            className={['ghost-btn','florida-link','florida-inline', floridaHot ? 'is-hot' : ''].join(' ')}
            onClick={onFloridaClick}
            onMouseEnter={() => setFloridaHot(true)}
            onMouseLeave={() => setFloridaHot(false)}
          >
            Florida, USA
          </button>
        </div>
      )}

      {/* Ensure base bg is black without needing globals.css */}
      <style jsx global>{`
        html, body { background:#000; }
      `}</style>

      <style jsx>{`.orb-row{ width:100%; }`}</style>
    </div>
  );
}
