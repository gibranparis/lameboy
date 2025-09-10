'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import ChakraCascade from './ChakraCascade';
import ShopGrid from './ShopGrid';

export default function BannedCard() {
  const [phase, setPhase] = useState('ui');               // 'ui' | 'chakra' | 'shop'
  const [afterCascade, setAfterCascade] = useState('ui'); // where to go after cascade
  const [mode, setMode] = useState('banned');             // 'banned' | 'login'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  // We’ll only show this AFTER the cascade completes on failure
  const [msg, setMsg] = useState(null);           // actually rendered message
  const msgPendingRef = useRef(null);             // stored during cascade

  // measurements for inline inputs
  const emailRef = useRef(null);
  const emailMeasureRef = useRef(null);
  const phoneMeasureRef = useRef(null);
  const [emailPx, setEmailPx] = useState(8);
  const [phonePx, setPhonePx] = useState(8);

  const slideCardClass = mode === 'banned' ? 'card-slide-right' : 'card-slide-left';
  const slideFloridaClass = mode === 'banned' ? 'slide-in-right' : 'slide-in-left';

  const toggle = () => { setMsg(null); setMode(m => (m === 'banned' ? 'login' : 'banned')); };

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
    // Clear any visible message now; we’ll reveal result AFTER cascade
    setMsg(null);
    msgPendingRef.current = null;

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

    if (success) {
      // On success we navigate to shop after cascade; no need to show a message
      setAfterCascade('shop');
    } else {
      // On failure we’ll show the glowing red message AFTER the cascade finishes
      msgPendingRef.current = { type: 'err', text: 'Submit failed' };
      setAfterCascade('ui');
    }

    setPhase('chakra'); // play cascade either way
    setBusy(false);
  }

  const handleChakraComplete = () => {
    if (afterCascade === 'ui' && msgPendingRef.current) {
      // Only now reveal the message result
      setMsg(msgPendingRef.current);
      msgPendingRef.current = null;
    }
    setPhase(afterCascade);
  };

  if (phase === 'shop') {
    return <ShopGrid />;
  }

  return (
    <>
      {/* Foreground cascade ONLY during submit; background stays black */}
      {phase === 'chakra' && <ChakraCascade onComplete={handleChakraComplete} />}

      <div className="page-center" aria-hidden={phase !== 'ui'}>
        <div className="row-nowrap">
          {mode === 'banned' ? (
            <>
              <div className={`vscode-card card-ultra-tight rounded-xl ${slideCardClass}`} style={{ maxWidth: 420 }}>
                <div className="text-sm leading-6">
                  {/* // LAMEBOY.COM — each letter colored to chakra, .COM seafoam */}
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
                className={`ghost-btn text-xs florida-pulse ${slideFloridaClass}`}
                onClick={toggle}
                aria-label="Florida, USA"
              >
                Florida, USA
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`ghost-btn text-xs florida-pulse ${slideFloridaClass}`}
                onClick={toggle}
                aria-label="Florida, USA"
              >
                Florida, USA
              </button>

              <div className={`vscode-card card-ultra-tight login-card rounded-xl ${slideCardClass}`}>
                <form className="text-sm" onSubmit={onSubmit}>
                  <div className="code-comment">// login</div>

                  {/* const email = "…" */}
                  <div className="code-line">
                    <span className="code-keyword">const</span>
                    <span className="code-var">email</span>
                    <span className="code-op">=</span>
                    <span className="code-punc">"</span>

                    <span
                      className="relative inline-flex items-baseline"
                      onClick={() => emailRef.current?.focus()}
                    >
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

                      {email.length === 0 && (
                        <span className="absolute code-placeholder" style={{ left: 0 }}>
                          you@example.com
                        </span>
                      )}
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

                    <span
                      className="relative inline-flex items-baseline"
                      onClick={() => document.getElementById('phone-input')?.focus()}
                    >
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

                      {phone.length === 0 && (
                        <span className="absolute code-placeholder" style={{ left: 0 }}>
                          +1 305 555 0123
                        </span>
                      )}
                      <span ref={phoneMeasureRef} className="measurer">{phone}</span>
                    </span>

                    <span className="code-punc">"</span>
                    <span className="code-punc">;</span>
                  </div>

                  <div className="row-nowrap" style={{ marginTop: 6 }}>
                    <button type="submit" className="commit-btn" disabled={busy}>
                      {busy ? 'Submitting…' : 'Submit'}
                    </button>
                    {/* Show result ONLY after cascade and only on UI phase */}
                    {phase === 'ui' && msg && (
                      <span style={{ marginLeft: 10 }}>
                        {/* keep quotes, color only the inner text red-glow */}
                        <span className="code-punc">"</span>
                        <span className={msg.type === 'err' ? 'code-fail' : 'code-comment'}>
                          {msg.text}
                        </span>
                        <span className="code-punc">"</span>
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
