// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);       // overlay is running
  const [hideAll, setHideAll] = useState(false);       // hide all UI while/after cascade
  const [showFinalBrand, setShowFinalBrand] = useState(false); // show "LAMEBOY, USA" after cascade

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

  // Core: start cascade, hide everything; when it ends, reveal centered brand
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    setHideAll(true);         // hide ALL the UI immediately
    setShowFinalBrand(false); // brand appears only AFTER cascade finishes
    try { playChakraSequenceRTL(); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setShowFinalBrand(true); // show "LAMEBOY, USA"
      after && after();
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, []);

  // Bubble click (no cascade): just open login
  const onBubbleClick = useCallback(() => {
    setBubblePulse(true); setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  // Florida toggles views (only when UI is visible)
  const onFloridaClick = useCallback(() => {
    if (hideAll) return;
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, [hideAll]);

  // Link: run cascade and end on brand screen (no redirect)
  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {
      // If you want to redirect AFTER the brand shows, uncomment:
      // setTimeout(() => (window.location.href = '/shop'), 1200);
    }, { washAway: true });
  }, [runCascade]);

  // Bypass: same behavior (brand screen after cascade)
  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {
      // Optional redirect after showing brand:
      // setTimeout(() => (window.location.href = '/shop'), 1200);
    }, { washAway: true });
  }, [runCascade]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {/* Normal UI is entirely hidden while/after cascade once triggered */}
      {!hideAll && (
        <div className="login-stack">

          {/* 3D orb cross ABOVE the blue bubble on the login view */}
          {view === 'login' && (
            <BlueOrbCross3D height="42vh" rpm={2.2} />
          )}

          {/* Blue bubble (is a button in banned view) */}
          {!hideBubble && (
            <div
              className={[
                'vscode-card',
                'card-ultra-tight',
                'login-card',
                view === 'banned' ? 'slide-in-left' : 'slide-in-right',
                'bubble-button',
                bubblePulse ? 'bubble-glow-blue' : '',
              ].join(' ')}
              style={{ minWidth: 260 }}
              role={view === 'banned' ? 'button' : undefined}
              tabIndex={view === 'banned' ? 0 : -1}
              onClick={view === 'banned' ? onBubbleClick : undefined}
              onKeyDown={
                view === 'banned'
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onBubbleClick();
                      }
                    }
                  : undefined
              }
            >
              {view === 'banned' ? (
                <pre className="code-line" style={{ margin: 0 }}>
                  <span className="code-comment">// </span>
                  <span className="lameboy-glow">LAMEBOY.COM</span>
                  {'\n'}
                  <span className="code-comment">// </span>
                  <span className="code-banned">is banned</span>
                  {'\n'}
                  <span className="code-keyword">console</span>
                  <span className="code-punc">.</span>
                  <span className="code-var">log</span>
                  <span className="code-punc">(</span>
                  <span className="code-string">"hi..."</span>
                  <span className="code-punc">);</span>
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
                    <button
                      type="button"
                      className={`commit-btn btn-link ${activated === 'link' ? 'btn-activated' : ''}`}
                      onClick={onLink}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className={`commit-btn btn-bypass ${activated === 'bypass' ? 'btn-activated' : ''}`}
                      onClick={onBypass}
                    >
                      Bypass
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Florida label (hidden once cascade triggers) */}
          <button
            type="button"
            className={['ghost-btn', 'florida-link', 'florida-inline', floridaHot ? 'is-hot' : ''].join(' ')}
            onClick={onFloridaClick}
            onMouseEnter={() => setFloridaHot(true)}
            onMouseLeave={() => setFloridaHot(false)}
          >
            Florida, USA
          </button>
        </div>
      )}

      {/* Chakra overlay during cascade */}
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

      {/* Centered brand AFTER the cascade passes */}
      {showFinalBrand && !cascade && (
        <div className="brand-center" aria-hidden="true">
          <span className="brand-text">LAMEBOY, USA</span>
        </div>
      )}

      {/* Local styles: centered brand */}
      <style jsx>{`
        .brand-center {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          z-index: 1200;        /* above everything */
          pointer-events: none; /* do not block clicks if you re-enable navigation */
        }
        .brand-text {
          color: #fff;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: clamp(22px, 5.2vw, 64px);
          text-align: center;
          opacity: 0;
          animation: brandFade 420ms ease-out forwards;
          text-shadow: 0 0 10px rgba(255,255,255,0.25);
        }
        @keyframes brandFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
