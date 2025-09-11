'use client';

import { useCallback, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideBubble, setHideBubble] = useState(false); // washed-away bubble (Florida remains)
  const [bubblePulse, setBubblePulse] = useState(false); // blue click pulse
  const [floridaHot, setFloridaHot] = useState(false);   // warm yellow glow for Florida text
  const [activated, setActivated] = useState(null);      // 'link' | 'bypass' | null (lime pulse)

  // inputs
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const goLogin = useCallback(() => {
    setHideBubble(false);           // bubble visible when entering login
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  const goBanned = useCallback(() => {
    setHideBubble(false);
    setView('banned');
  }, []);

  /**
   * Cascade runner:
   * - shows cascade immediately
   * - fires chakra tones
   * - if washAway=true, hides the bubble AFTER the cascade finishes
   */
  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    try { playChakraSequenceRTL(); } catch { /* ignore audio init failures */ }
    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);   // <- washed away here (Florida remains)
      after && after();
    }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  // Bubble click: blue pulse + set Florida glow briefly, then go to login (NO cascade here)
  const onBubbleClick = useCallback(() => {
    setBubblePulse(true);
    setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true);
    setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  // Florida toggles views (NO cascade)
  const onFloridaClick = useCallback(() => {
    setFloridaHot(true);
    setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, []);

  // Link button: cascade, wash bubble away, then go /shop if both fields present
  const onLink = useCallback(() => {
    setActivated('link');
    setTimeout(() => setActivated(null), 650); // quick lime pulse
    const ok = email.trim() && phone.trim();
    runCascade(() => {
      if (ok) {
        window.location.href = '/shop';
      } else {
        // Stay on login with bubble gone (washed away). Florida stays, so user can toggle.
        setView('login');
      }
    }, { washAway: true });
  }, [email, phone, runCascade]);

  // Bypass: cascade, wash bubble, then go shop
  const onBypass = useCallback(() => {
    setActivated('bypass');
    setTimeout(() => setActivated(null), 650);
    runCascade(() => {
      window.location.href = '/shop';
    }, { washAway: true });
  }, [runCascade]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {/* Stack container is always rendered; we hide only the bubble, not Florida */}
      <div className="login-stack">

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

        {/* Florida centered under bubble; muted by default; glows yellow on hover/click or after bubble click */}
        <button
          type="button"
          className={`ghost-btn florida-link florida-inline ${floridaHot ? 'is-hot' : ''}`}
          onClick={onFloridaClick}
          onMouseEnter={() => setFloridaHot(true)}
          onMouseLeave={() => setFloridaHot(false)}
        >
          Florida, USA
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
    </div>
  );
}
