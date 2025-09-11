'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * BannedCard
 * - Yellow glow on Florida/LAMEBOY location when hover/click
 * - Yellow STAR bypass button docked to the login bubble (bypasses form)
 * - Chakra cascade restored; on SUCCESS set location to "LAMEBOY, USA" (persist)
 */
export default function BannedCard(){
  const [view, setView] = useState<'banned'|'login'>('banned');
  const [locationLabel, setLocationLabel] = useState('Florida, USA');
  const [hotLocation, setHotLocation] = useState(false);

  // form
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'idle'|'ok'|'fail'>('idle');

  // cascade
  const [showCascade, setShowCascade] = useState(false);
  const cascadeMs = 1600; // keep in sync with CSS keyframes total

  // simple email/phone pass check
  const isValidEmail = (v)=> /\S+@\S+\.\S+/.test(v);
  const isValidPhone = (v)=> v.replace(/[^\d]/g,'').length >= 7;

  const bubbleRef = useRef(null);

  /** trigger the chakra overlay, then run an action */
  const triggerCascade = (after) => {
    setShowCascade(true);
    window.requestAnimationFrame(()=> {
      setTimeout(() => {
        setShowCascade(false);
        after && after();
      }, cascadeMs);
    });
  };

  /** go to login screen (smooth) */
  const goLogin = () => {
    setHotLocation(true);
    setView('login'); // CSS handles slide-in if page wraps it
    setTimeout(() => setHotLocation(false), 600);
  };

  /** bypass via STAR */
  const bypassToShop = () => {
    triggerCascade(() => {
      window.location.assign('/shop');
    });
  };

  /** submit */
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setResult('idle');

    const ok = isValidEmail(email) && isValidPhone(phone);

    // ALWAYS show the cascade (even on fail)
    triggerCascade(() => {
      if (ok) {
        setResult('ok');
        // lock label to LAMEBOY, USA after success
        setLocationLabel('LAMEBOY, USA');
        window.location.assign('/shop');
      } else {
        setResult('fail');
        // stay on login, bubble reappears automatically post-cascade
      }
      setSubmitting(false);
    });
  };

  // make location react to hover/click with yellow glow
  const locationProps = {
    className: `ghost-btn florida-link ${hotLocation ? 'is-hot' : ''}`,
    onMouseEnter: () => setHotLocation(true),
    onMouseLeave: () => setHotLocation(false),
    onClick: () => (view === 'banned' ? goLogin() : setView('banned')),
    'aria-label': 'Toggle login',
  };

  return (
    <>
      {/* CHAKRA OVERLAY (violet→red, right→left) */}
      {showCascade && (
        <div className="chakra-overlay">
          <div className="chakra-band band-1 chakra-crown" />
          <div className="chakra-band band-2 chakra-thirdeye" />
          <div className="chakra-band band-3 chakra-throat" />
          <div className="chakra-band band-4 chakra-heart" />
          <div className="chakra-band band-5 chakra-plexus" />
          <div className="chakra-band band-6 chakra-sacral" />
          <div className="chakra-band band-7 chakra-root" />
        </div>
      )}

      <div className="page-center ui-top">
        {/* CODE BUBBLE */}
        {view === 'banned' ? (
          <div ref={bubbleRef} className="vscode-card card-ultra-tight card-slide-left">
            <div className="code-line">
              <span className="code-comment">// </span>
              <span className="code-comment">LAMEBOY.COM</span>
            </div>
            <div className="code-line">
              <span className="code-comment">//</span>
              <span className="code-banned">&nbsp;is banned</span>
            </div>
            <div className="code-line">
              <span className="code-keyword">console</span>
              <span className="code-op">.</span>
              <span className="code-var">log</span>
              <span className="code-punc">(</span>
              <span className="code-string">"hi..."</span>
              <span className="code-punc">)</span>
              <span className="code-punc">;</span>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} ref={bubbleRef} className="vscode-card login-card card-ultra-tight slide-in-right">
            <div className="code-line">
              <span className="code-comment">// login</span>
            </div>
            <div className="code-line">
              <span className="code-keyword">const</span>&nbsp;
              <span className="code-var">email</span>
              <span className="code-op">=</span>
              <span className="code-punc">"</span>
              <input
                className="code-input"
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <span className="code-punc">"</span>
              <span className="code-punc">;</span>
            </div>
            <div className="code-line">
              <span className="code-keyword">const</span>&nbsp;
              <span className="code-var">phone</span>
              <span className="code-op">=</span>
              <span className="code-punc">"</span>
              <input
                className="code-input"
                type="tel"
                value={phone}
                onChange={(e)=>setPhone(e.target.value)}
                placeholder="+1 305 555 0123"
                autoComplete="tel"
              />
              <span className="code-punc">"</span>
              <span className="code-punc">;</span>
            </div>

            <div className="row-nowrap" style={{ justifyContent:'flex-start', marginTop:6 }}>
              <button className="commit-btn" disabled={submitting} type="submit">
                {submitting ? '...' : 'Submit'}
              </button>
              {result === 'ok'   && <span className="code-success" style={{ marginLeft:10 }}>"Success"</span>}
              {result === 'fail' && <span className="code-fail"    style={{ marginLeft:10 }}>"Submit failed"</span>}
            </div>

            {/* Yellow STAR bypass sticker (close to bubble) */}
            <button
              type="button"
              className="bypass-star"
              onClick={bypassToShop}
              title="Skip sign in"
              aria-label="Skip sign in"
            >
              ⭐
            </button>
          </form>
        )}

        {/* Location control */}
        <button {...locationProps}>{locationLabel}</button>
      </div>
    </>
  );
}
