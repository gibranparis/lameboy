'use client';

import { useCallback, useRef, useState } from 'react';

const CASCADE_MS = 2400; // keep in sync with your CSS timing

export default function BannedLogin() {
  const [view, setView] = useState('banned');      // 'banned' | 'login'
  const [hotFlorida, setHotFlorida] = useState(false);
  const [cascade, setCascade] = useState(false);
  const [hideBubble, setHideBubble] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  const goLogin = useCallback(() => {
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 260);
  }, []);

  const goBanned = useCallback(() => {
    setView('banned');
  }, []);

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

  const onSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      const ok = email.trim() && phone.trim();
      runCascade(() => {
        if (ok) {
          window.location.href = '/shop';
        } else {
          setView('login');
        }
      });
    },
    [email, phone, runCascade]
  );

  const onBypass = () => {
    runCascade(() => {
      window.location.href = '/shop';
    });
  };

  // Hover zones (do not cover inputs anymore)
  const bannedRightZone = (
    <div
      className="hover-zone right"
      onMouseEnter={() => setHotFlorida(true)}
      onMouseLeave={() => setHotFlorida(false)}
      onClick={goLogin}
      aria-hidden
    />
  );
  const loginLeftZone = (
    <div
      className="hover-zone left"
      onMouseEnter={() => setHotFlorida(true)}
      onMouseLeave={() => setHotFlorida(false)}
      onClick={goBanned}
      aria-hidden
    />
  );

  return (
    <div className="page-center" style={{ position: 'relative' }}>
      {view === 'banned' ? bannedRightZone : loginLeftZone}

      {/* Florida, USA — now fixed & above hover zones */}
      <button
        type="button"
        className={`ghost-btn florida-link florida-fixed ${
          view === 'banned' ? 'florida-right' : 'florida-left'
        } ${hotFlorida ? 'is-hot' : ''}`}
        onClick={view === 'banned' ? goLogin : goBanned}
        onMouseEnter={() => setHotFlorida(true)}
        onMouseLeave={() => setHotFlorida(false)}
      >
        Florida, USA
      </button>

      {/* Code bubble */}
      {!hideBubble && (
        <div
          className={`vscode-card card-ultra-tight login-card ${
            view === 'banned' ? 'slide-in-left' : 'slide-in-right'
          }`}
          style={{ minWidth: 260 }}
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
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

              <div style={{ marginTop: 6 }}>
                <button type="button" className="commit-btn" onClick={onSubmit}>
                  Submit
                </button>
              </div>

              {/* yellow star bypass, anchored to the bubble */}
              <button
                type="button"
                className="bypass-star"
                onClick={onBypass}
                title="Skip to shop"
                aria-label="Skip to shop"
              >
                ★
              </button>
            </form>
          )}
        </div>
      )}

      {/* Chakra overlay */}
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
