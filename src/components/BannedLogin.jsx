// src/components/BannedLogin.jsx
'use client';

import RotatingFlagCSS from '@/components/RotatingFlagCSS';
import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideBubble, setHideBubble] = useState(false);  // bubble removed after cascade
  const [washing, setWashing] = useState(false);        // animate bubble while cascade runs
  const [bubblePulse, setBubblePulse] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);  // warm yellow glow
  const [activated, setActivated] = useState(null);     // 'link' | 'bypass' | null

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  const goBanned = useCallback(() => {
    setHideBubble(false);
    setView('banned');
  }, []);

  // Cascade: play tones + overlay; if washAway, animate bubble during cascade then remove it
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    if (washAway) setWashing(true);
    try { playChakraSequenceRTL(); } catch {}
    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) {
        setHideBubble(true);   // actually remove from DOM
        setWashing(false);     // stop the animation flag
      }
      after && after();
    }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  // Bubble click (no cascade): blue pulse + brief Florida glow → login
  const onBubbleClick = useCallback(() => {
    setBubblePulse(true); setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  // Florida toggles views (no cascade)
  const onFloridaClick = useCallback(() => {
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, []);

  // Link: cascade, wash bubble away, then go /shop if both fields exist
  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    const ok = email.trim() && phone.trim();
    runCascade(() => {
      if (ok) window.location.href = '/shop';
      else setView('login'); // stay on login; bubble washed away
    }, { washAway: true });
  }, [email, phone, runCascade]);

  // Bypass: cascade, wash bubble, then go shop
  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => { window.location.href = '/shop'; }, { washAway: true });
  }, [runCascade]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {/* Stack container always rendered; we hide only the bubble, not the location label */}
      <div className="login-stack">

        {/* Rotating emblem ABOVE the bubble in login view (keep or remove if using 3D later) */}
        {view === 'login' && (
          <RotatingFlagCSS height="44vh" speedSec={16} />
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
              washing ? 'washing-out' : '',      // <— fade/blur/scale while cascade runs
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

        {/* Location label: swap to white “Lameboy, USA” while cascade runs */}
        <button
          type="button"
          className={[
            'ghost-btn',
            'florida-link',
            'florida-inline',
            floridaHot ? 'is-hot' : '',
            cascade ? 'is-white' : '',   // <-- white during cascade
          ].join(' ')}
          onClick={onFloridaClick}
          onMouseEnter={() => setFloridaHot(true)}
          onMouseLeave={() => setFloridaHot(false)}
        >
          {cascade ? 'Lameboy, USA' : 'Florida, USA'}
        </button>
      </div>

      {/* Chakra overlay (only on Link / Bypass) */}
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

      {/* Local styles for the wash-out + white label-on-cascade */}
      <style jsx>{`
        .washing-out {
          animation: washOut ${CASCADE_MS}ms ease-in forwards;
          transform-origin: 50% 55%;
        }
        @keyframes washOut {
          0%   { opacity: 1; filter: blur(0px);   transform: translateY(0)    scale(1); }
          40%  { opacity: 0.85; filter: blur(0.5px); transform: translateY(2px) scale(0.98); }
          100% { opacity: 0; filter: blur(2px);   transform: translateY(6px)  scale(0.9); }
        }

        .florida-link.is-white {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255,255,255,0.35);
        }
      `}</style>
    </div>
  );
}
