'use client';

import { useCallback, useRef, useState } from 'react';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

export default function BannedLogin() {
  const [view, setView] = useState('banned');        // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideBubble, setHideBubble] = useState(false);
  const [bubblePulse, setBubblePulse] = useState(false); // blue click pulse
  const [floridaHot, setFloridaHot] = useState(false);   // warm yellow glow

  // login inputs
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const goLogin = useCallback(() => {
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  const goBanned = useCallback(() => setView('banned'), []);

  // cascade runner (used only by Link in / Bypass)
  const runCascade = useCallback((after) => {
    setCascade(true);
    setHideBubble(true);
    const t = setTimeout(() => {
      setCascade(false);
      setHideBubble(false);
      after && after();
    }, CASCADE_MS);
    return () => clearTimeout(t);
  }, []);

  // Bubble click: blue pulse + set Florida glowing briefly, then go to login (no cascade)
  const onBubbleClick = useCallback(() => {
    setBubblePulse(true);
    setFloridaHot(true);
    setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  // Florida toggles views (no cascade)
  const onFloridaClick = useCallback(() => {
    setFloridaHot(true);
    setTimeout(() => setFloridaHot(false), 700);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, []);

  // Link in (was Submit): cascade, then either go shop (if both fields filled) or stay on login
  const onLinkIn = useCallback(() => {
    const ok = email.trim() && phone.trim();
    runCascade(() => {
      if (ok) {
        window.location.href = '/shop';
      } else {
        setView('login'); // show bubble again on failure
      }
    });
  }, [email, phone, runCascade]);

  // Bypass: cascade then go shop
  const onBypass = useCallback(() => {
    runCascade(() => { window.location.href = '/shop'; });
  }, [runCascade]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {/* STACK: bubble + Florida inline under it */}
      {!hideBubble && (
        <div className="login-stack">
          {/* Bubble (acts as a button in banned view) */}
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
              <form
                onSubmit={(e) => { e.preventDefault(); }}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
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
                  <button type="button" className="commit-btn" onClick={onLinkIn}>
                    Link in
                  </button>
                  <button type="button" className="commit-btn" onClick={onBypass}>
                    Bypass
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Florida, USA — centered under bubble.
              Default muted; glows warm yellow on hover/click and also when bubble is clicked. */}
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
      )}

      {/* Chakra overlay (only on Link in / Bypass) */}
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
