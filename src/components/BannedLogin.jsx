// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400;

/** Chakra-colored "Lameboy" with BRIGHT pulsing glow; ".com" glows seafoam */
function ChakraWord({ word = 'Lameboy', suffix = '.com', strong = true, className = '' }) {
  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#a855f7']; // root→crown
  return (
    <span className={`chakra-word ${className}`}>
      {word.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="chakra-letter glow-plus"
          style={{ color: colors[i % colors.length], fontWeight: strong ? 800 : 700 }}
        >
          {ch}
        </span>
      ))}
      {suffix ? <span className="chakra-suffix seafoam-glow">{suffix}</span> : null}
      <style jsx>{`
        .chakra-word { display: inline-flex; letter-spacing: 0.06em; gap: 0.02em; }

        .chakra-letter.glow-plus {
          position: relative;
          -webkit-text-stroke: 0.6px currentColor;
          text-shadow:
            0 0 10px  currentColor,
            0 0 26px  currentColor,
            0 0 54px  currentColor,
            0 0 96px  currentColor,
            0 0 150px currentColor;
          filter: saturate(1.55) contrast(1.2) brightness(1.06);
          animation: glowPulseMega 1.6s ease-in-out infinite alternate;
        }
        @keyframes glowPulseMega {
          0% { text-shadow: 0 0 10px currentColor, 0 0 26px currentColor, 0 0 54px currentColor, 0 0 96px currentColor, 0 0 150px currentColor;
               filter: saturate(1.4) contrast(1.15) brightness(1.04); }
          100% { text-shadow: 0 0 14px currentColor, 0 0 36px currentColor, 0 0 80px currentColor, 0 0 130px currentColor, 0 0 180px currentColor;
                 filter: saturate(1.75) contrast(1.25) brightness(1.08); }
        }

        .seafoam-glow {
          color: #32ffc7;
          font-weight: 800;
          text-shadow:
            0 0 8px  #32ffc7,
            0 0 20px #32ffc7,
            0 0 44px #32ffc7,
            0 0 80px #32ffc7;
          filter: saturate(1.35) brightness(1.06);
        }
      `}</style>
    </span>
  );
}

/** Body portal (so overlays never get clipped by parent transforms/overflow) */
function BodyPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** JS-driven white sweep from the right (no CSS keyframes required) */
function CascadeOverlay({ durationMs = 2400, showBrand = true }) {
  const [progress, setProgress] = useState(0); // 0..1 width
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
      {/* White sweep grows from the RIGHT */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: `${(progress * 100).toFixed(3)}%`,
          background: '#fff',
          zIndex: 9999,
          pointerEvents: 'none',
          willChange: 'width',
          transition: 'width 16ms linear', // keeps it smooth between RAF frames
        }}
      />
      {showBrand && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: 10001,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 'clamp(11px, 1.3vw, 14px)',
              textShadow: '0 0 8px rgba(0,0,0,0.25)',
            }}
          >
            LAMEBOY, USA
          </span>
        </div>
      )}
    </BodyPortal>
  );
}

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);       // cascade running
  const [hideAll, setHideAll] = useState(false);       // hide UI during cascade
  const [whiteout, setWhiteout] = useState(false);     // full white after

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

  // Start cascade: hide UI (leaving site bg), white sweep from right, then hold white.
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    setHideAll(true);
    setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true); // lock white after sweep completes
      after && after();
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, []);

  // bubble → open login
  const onBubbleClick = useCallback(() => {
    setBubblePulse(true); setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  // Florida toggles view if visible
  const onFloridaClick = useCallback(() => {
    if (hideAll) return;
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, [hideAll]);

  // Buttons
  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  // ORB click behaves exactly like Bypass (3D hit only)
  const onOrbActivate = useCallback(() => {
    onBypass();
  }, [onBypass]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {/* === CASCADE OVERLAYS (portal) === */}
      {cascade && <CascadeOverlay durationMs={CASCADE_MS} showBrand />}
      {/* After cascade: persistent white */}
      {whiteout && !cascade && (
        <BodyPortal>
          <div
            aria-hidden="true"
            style={{
              position: 'fixed', inset: 0, background: '#fff',
              zIndex: 9998, pointerEvents: 'none',
            }}
          />
        </BodyPortal>
      )}

      {/* === Normal UI (hidden during cascade) === */}
      {!hideAll && (
        <div className="login-stack">
          {/* Orb — clickable only on mesh via 3D raycasting */}
          <div className="orb-row" style={{ marginBottom: -28 }}>
            <BlueOrbCross3D
              rpm={14.4}              // 2× speed
              color="#32ffc7"         // bar color
              geomScale={1}
              glow
              glowOpacity={0.85}
              includeZAxis
              height="10vh"
              onActivate={onOrbActivate}  // click on orb == Bypass
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
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* tiny local styles */}
      <style jsx>{`
        .orb-row { width: 100%; }
      `}</style>
    </div>
  );
}
