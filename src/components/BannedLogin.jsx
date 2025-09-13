// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

/** Chakra-colored "Lameboy" with BRIGHT pulsing glow; ".com" stays plain */
function ChakraWord({ word = 'Lameboy', suffix = '', strong = true, className = '' }) {
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
      {suffix ? <span className="chakra-suffix">{suffix}</span> : null}
      <style jsx>{`
        .chakra-word { display: inline-flex; letter-spacing: 0.06em; gap: 0.02em; }
        .chakra-suffix { margin-left: 0.06em; font-weight: 700; }

        /* SUPER shiny rainbow glow */
        .chakra-letter.glow-plus {
          position: relative;
          mix-blend-mode: screen;
          text-shadow:
            0 0 8px   currentColor,
            0 0 18px  currentColor,
            0 0 32px  currentColor,
            0 0 54px  currentColor,
            0 0 88px  currentColor;
          filter:
            drop-shadow(0 0 6px currentColor)
            drop-shadow(0 0 14px currentColor)
            drop-shadow(0 0 26px currentColor);
          animation: glowPulseMega 1.8s ease-in-out infinite alternate;
        }
        @keyframes glowPulseMega {
          0% {
            text-shadow: 0 0 8px currentColor, 0 0 18px currentColor, 0 0 32px currentColor, 0 0 54px currentColor, 0 0 88px currentColor;
            filter: drop-shadow(0 0 6px currentColor) drop-shadow(0 0 14px currentColor) drop-shadow(0 0 26px currentColor);
          }
          100% {
            text-shadow: 0 0 12px currentColor, 0 0 28px currentColor, 0 0 50px currentColor, 0 0 84px currentColor, 0 0 120px currentColor;
            filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 22px currentColor) drop-shadow(0 0 40px currentColor);
          }
        }
      `}</style>
    </span>
  );
}

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
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

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  // Start cascade: hide everything, show text over the bands; when done -> white screen
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

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {!hideAll && (
        <div className="login-stack">
          {/* Orb — safe geometry, 20% faster spin, close to the bubble */}
          <BlueOrbCross3D rpm={7.2} color="#32ffc7" geomScale={1} style={{ marginBottom: -9, height: '10vh' }} />

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
                  <span className="code-comment">// </span>
                  <ChakraWord word="Lameboy" suffix=".com" />
                  {'\n'}
                  <span className="code-comment">// </span>
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
                    <span className="code-comment">// login</span>
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

          {/* Florida label (hidden once cascade triggers) */}
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

      {/* Cascade bands */}
      {cascade && (
        <div className="chakra-overlay">
          <div className="chakra-band chakra-crown band-1" />
          <div className="chakra-band chakra-thirdeye band-2" />
          <div className="chakra-band chakra-throat band-3" />
          <div className="chakra-band chakra-heart band-4" />
          <div className="chakra-band chakra-plexus band-5" />
          <div className="chakra-band chakra-sacral band-6" />
          <div className="chakra-band chakra-root band-7" />
        </div>
      )}

      {/* Small white "LAMEBOY, USA" OVER the cascade */}
      {cascade && (
        <div className="brand-overlay" aria-hidden="true">
          <span className="brand-overlay-text">LAMEBOY, USA</span>
        </div>
      )}

      {/* After cascade: full white screen */}
      {whiteout && !cascade && <div className="whiteout" />}

      <style jsx>{`
        .brand-overlay {
          position: fixed; inset: 0; display: grid; place-items: center;
          z-index: 2000; pointer-events: none;
        }
        .brand-overlay-text {
          color: #fff; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          font-size: clamp(11px, 1.3vw, 14px);
          text-shadow: 0 0 8px rgba(0,0,0,0.25);
        }
        .whiteout { position: fixed; inset: 0; background: #fff; z-index: 1500; }
      `}</style>
    </div>
  );
}
