'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import ChakraCascade from './ChakraCascade';
import ShopGrid from './ShopGrid';

export default function BannedCard() {
  const [phase, setPhase] = useState('ui');               // 'ui' | 'chakra' | 'shop'
  const [afterCascade, setAfterCascade] = useState('ui'); // 'ui' | 'shop'
  const [mode, setMode] = useState('banned');             // 'banned' | 'login'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Label flip during cascades
  const [cascadeFlip, setCascadeFlip] = useState(false);
  const [glowFlorida, setGlowFlorida] = useState(false);

  // inputs
  const emailRef = useRef(null);
  const emailMeasureRef = useRef(null);
  const phoneMeasureRef = useRef(null);
  const [emailPx, setEmailPx] = useState(8);
  const [phonePx, setPhonePx] = useState(8);

  const slideCardClass = mode === 'banned' ? 'card-slide-right' : 'card-slide-left';
  const slideFloridaClass = mode === 'banned' ? 'slide-in-right' : 'slide-in-left';

  const toggleMode = () => { setMsg(null); setMode(m => (m === 'banned' ? 'login' : 'banned')); };

  // Florida small button click (always toggles)
  const onFloridaClick = () => {
    setGlowFlorida(true);
    setTimeout(() => setGlowFlorida(false), 500);
    toggleMode();
  };

  useLayoutEffect(() => {
    if (emailMeasureRef.current) setEmailPx(emailMeasureRef.current.getBoundingClientRect().width || 8);
  }, [email]);
  useLayoutEffect(() => {
    if (phoneMeasureRef.current) setPhonePx(phoneMeasureRef.current.getBoundingClientRect().width || 8);
  }, [phone]);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);

    let success = false;
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      success = res.ok === true;
    } catch {
      success = false;
    }

    setCascadeFlip(v => !v);

    if (success) {
      setAfterCascade('shop');   // hide login during cascade, then open shop
    } else {
      setAfterCascade('ui');     // hide login during cascade, then show failure text
    }

    setPhase('chakra');
    setBusy(false);
  }

  const handleChakraComplete = () => {
    setPhase(afterCascade);
    if (afterCascade === 'ui' && mode !== 'banned') {
      setMsg({ type: 'err', text: 'Submit failed' });
    }
  };

  if (phase === 'shop') return <ShopGrid />;

  const inCascade = phase === 'chakra';
  const labelDuringCascade = cascadeFlip ? 'LAMEBOY, USA' : 'Florida, USA';
  const labelText = inCascade ? labelDuringCascade : 'Florida, USA';

  // Hide login card any time a cascade is running
  const hideLoginCard = inCascade && mode === 'login';

  // Bypass heart: only on LOGIN + UI phase
  const bypassToShop = () => {
    setAfterCascade('shop');
    setCascadeFlip(v => !v);
    setPhase('chakra');
  };

  return (
    <>
      {inCascade && <ChakraCascade onComplete={handleChakraComplete} />}

      {/* Edge hover zones  — UPDATED mapping:
          BANNED → RIGHT half (where Florida label sits)
          LOGIN  → LEFT  half (opposite side)
      */}
      {phase === 'ui' && mode === 'banned' && (
        <div
          className="hover-zone-right"
          onMouseEnter={() => setGlowFlorida(true)}
          onMouseLeave={() => setGlowFlorida(false)}
          onClick={toggleMode}
          aria-hidden="true"
        />
      )}
      {phase === 'ui' && mode === 'login' && (
        <div
          className="hover-zone-left"
          onMouseEnter={() => setGlowFlorida(true)}
          onMouseLeave={() => setGlowFlorida(false)}
          onClick={toggleMode}
          aria-hidden="true"
        />
      )}

      <div className="page-center">
        <div className="row-nowrap ui-top">
          {mode === 'banned' ? (
            <>
              <div className={`vscode-card card-ultra-tight rounded-xl ${slideCardClass}`} style={{ maxWidth: 420 }}>
                <div className="text-sm leading-6">
                  <div className="code-comment">
                    <span>// </span>
                    <span className="chakra-letter chakra-root">L</span>
                    <span className="chakra-letter chakra-sacral">A</span>
                    <span className="chakra-letter chakra-plexus">M</span>
                    <span className="chakra-letter chakra-heart">E</span>
                    <span className="chakra-letter chakra-throat">B</span>
                    <span className="chakra-letter chakra-thirdeye">O</span>
                    <span className="chakra-letter chakra-crown">Y</span>
                    <span className="code-comment">.COM</span>
                  </div>

                  <div className="code-comment">
                    // is <span className="code-banned">banned</span>
                  </div>
                  <div className="mt-1 caret">
                    <span className="code-keyword">console</span>
                    <span className="code-punc">.</span>
                    <span className="code-keyword">log</span>
                    <span className="code-punc">(</span>
                    <span className="code-string">"hi..."</span>
                    <span className="code-punc">);</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`ghost-btn text-xs florida-pulse ${slideFloridaClass} ${glowFlorida ? 'is-glowing' : ''}`}
                onClick={onFloridaClick}
                aria-label={labelText}
              >
                {labelText}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`ghost-btn text-xs florida-pulse ${slideFloridaClass} ${glowFlorida ? 'is-glowing' : ''}`}
                onClick={onFloridaClick}
                aria-label={labelText}
              >
                {labelText}
              </button>

              {!hideLoginCard && (
                <div className={`vscode-card card-ultra-tight login-card rounded-xl ${slideCardClass}`}>
                  <form className="text-sm" onSubmit={onSubmit}>
                    <div className="code-comment">// login</div>

                    {/* const email = "…" */}
                    <div className="code-line">
                      <span className="code-keyword">const</span>
                      <span className="code-var">email</span>
                      <span className="code-op">=</span>
                      <span className="code-punc">"</span>

                      <span className="caretwrap" onClick={() => emailRef.current?.focus()}>
                        {email.length === 0 && <span className="purple-caret" aria-hidden="true"></span>}
                        <input
                          ref={emailRef}
                          className="code-input"
                          type="email"
                          name="email"
                          value={email}
                          onChange={(e)=>setEmail(e.target.value)}
                          autoComplete="email"
                          style={{ width: Math.max(8, emailPx) }}
                        />
                        {email.length === 0 && <span className="code-placeholder">you@example.com</span>}
                        <span ref={emailMeasureRef} className="measurer">{email}</span>
                      </span>

                      <span className="code-punc">"</span>
                      <span className="code-punc">;</span>
                    </div>

                    {/* const phone = "…" */}
                    <div className="code-line">
                      <span className="code-keyword">const</span>
                      <span className="code-var">phone</span>
                      <span className="code-op">=</span>
                      <span className="code-punc">"</span>

                      <span className="caretwrap" onClick={() => document.getElementById('phone-input')?.focus()}>
                        {phone.length === 0 && <span className="purple-caret" aria-hidden="true"></span>}
                        <input
                          id="phone-input"
                          className="code-input"
                          type="tel"
                          name="phone"
                          value={phone}
                          onChange={(e)=>setPhone(e.target.value)}
                          autoComplete="tel"
                          style={{ width: Math.max(8, phonePx) }}
                        />
                        {phone.length === 0 && <span className="code-placeholder">+1 305 555 0123</span>}
                        <span ref={phoneMeasureRef} className="measurer">{phone}</span>
                      </span>

                      <span className="code-punc">"</span>
                      <span className="code-punc">;</span>
                    </div>

                    <div className="row-nowrap" style={{ marginTop: 6 }}>
                      <button type="submit" className="commit-btn" disabled={busy}>
                        {busy ? 'Submitting…' : 'Submit'}
                      </button>

                      {msg && (
                        <span style={{ marginLeft: 10 }}>
                          <span className="code-punc">"</span>
                          <span className={msg.type === 'err' ? 'code-fail' : 'code-success'}>{msg.text}</span>
                          <span className="code-punc">"</span>
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pink heart bypass (Login only) */}
      {phase === 'ui' && mode === 'login' && (
        <button className="bypass-heart" onClick={bypassToShop} aria-label="Skip and enter shop">♥</button>
      )}
    </>
  );
}
