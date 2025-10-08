// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import ButterflyChakra from '@/components/ButterflyChakra';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';
import { useRouter } from 'next/navigation';

const HOP_PATH = '/shop'; // fallback if parent doesn't provide onProceed

/** FINAL STAIRCASE TIMING — no overlap (each band finishes before the next starts) */
const BAND_MS    = 360;              // grow time per band (snappy)
const GAP_MS     = 80;               // tiny pause between bands
const STAGGER_MS = BAND_MS + GAP_MS; // step between bands (no overlap)
const CASCADE_MS = STAGGER_MS * 6 + BAND_MS + 240; // total incl. safety pad

function Wordmark({ onClickWordmark, lRef, yRef }) {
  return (
    <span className="lb-word" onClick={onClickWordmark} style={{ cursor:'pointer' }} title="Launch butterfly">
      <span className="lb-white">
        <span ref={lRef}>L</span>amebo<span ref={yRef}>y</span>
        <span className="lb-seafoam">.com</span>
      </span>
      <style jsx>{`
        .lb-word { display:inline; }
        .lb-white {
          color:#fff; font-weight:800; letter-spacing:0; word-spacing:0;
          text-shadow:0 0 8px #fff,0 0 18px #fff,0 0 36px #fff,0 0 70px #fff;
        }
        .lb-seafoam { letter-spacing:0; word-spacing:0; }
      `}</style>
    </span>
  );
}

/** Chakra Staircase (Red → Violet) — bright, glossy, black underlay + screen bloom */
function CascadeOverlay() {
  const [veilOp, setVeilOp] = useState(0);

  useEffect(() => {
    // Start the white veil right before the last band finishes to avoid wash/flicker
    const lead = setTimeout(
      () => setVeilOp(1),
      STAGGER_MS * 6 + Math.max(0, BAND_MS - 120)
    );
    const end  = setTimeout(() => setVeilOp(1), CASCADE_MS); // safety
    return () => { clearTimeout(lead); clearTimeout(end); };
  }, []);

  return createPortal(
    <>
      {/* BLACK underlay so colors/bloom pop regardless of page theme */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', inset:0, background:'#000',
          zIndex:9998, pointerEvents:'none'
        }}
      />

      {/* Fixed 7-col grid (no sweeping transform). Isolated so blending stays inside */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', inset:0, zIndex:9999, pointerEvents:'none',
          display:'grid', gridTemplateColumns:'repeat(7,1fr)', overflow:'hidden',
          isolation:'isolate', willChange:'transform,opacity'
        }}
      >
        {/* RED → ORANGE → YELLOW → GREEN → BLUE → INDIGO → VIOLET */}
        <div className="chakra-band c-red"    style={{ ['--d']: 0 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-orange" style={{ ['--d']: 1 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-yellow" style={{ ['--d']: 2 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-green"  style={{ ['--d']: 3 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-blue"   style={{ ['--d']: 4 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-indigo" style={{ ['--d']: 5 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
        <div className="chakra-band c-violet" style={{ ['--d']: 6 * STAGGER_MS + 'ms', ['--band']: BAND_MS+'ms' }} />
      </div>

      {/* White veil (appears at the very end) */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed', inset:0, zIndex:10000, background:'#fff',
          opacity: veilOp, transition:'opacity .001s linear', pointerEvents:'none'
        }}
      />

      <style jsx global>{`
        /* Glossy staircase: left-origin growth + neon + screen-bloom */
        .chakra-band{
          position:relative; height:100%;
          transform-origin:left center;
          transform: scaleX(0.001); opacity:0;
          animation: bandGrow var(--band,360ms) cubic-bezier(.25,.9,.25,1) forwards;
          animation-delay: var(--d,0ms);
          filter: saturate(1.26) brightness(1.08) contrast(1.10);
        }
        /* Inner neon (inset) */
        .chakra-band::before{
          content:""; position:absolute; inset:0;
          box-shadow:
            inset 0 0 140px rgba(255,255,255,.55),
            inset 0 0 300px rgba(255,255,255,.30),
            inset 0 0 460px rgba(255,255,255,.20);
          pointer-events:none;
        }
        /* External bloom that adds light — uses screen blend on black underlay */
        .chakra-band::after{
          content:""; position:absolute; inset:-8px; border-radius:2px;
          background: radial-gradient(120% 60% at 5% 50%,
                      rgba(255,255,255,.90) 0%,
                      rgba(255,255,255,.45) 28%,
                      rgba(255,255,255,.08) 62%,
                      rgba(255,255,255,0) 100%);
          filter: blur(10px);
          opacity:.65;
          mix-blend-mode: screen;
          animation: bloomIn var(--band,360ms) ease-out forwards;
          animation-delay: var(--d,0ms);
        }

        @keyframes bandGrow{
          0%   { transform: scaleX(0.001); opacity: 0; }
          18%  { opacity: 1; }
          100% { transform: scaleX(1);     opacity: 1; }
        }
        @keyframes bloomIn{
          0%   { opacity:0; filter: blur(18px); }
          40%  { opacity:.75; }
          100% { opacity:.65; filter: blur(10px); }
        }

        /* Chakra colors — sRGB fallback + P3 for richer displays */
        .c-red   { background:#ef4444;    background: color(display-p3 0.94 0.27 0.27); } /* root */
        .c-orange{ background:#f97316;    background: color(display-p3 0.97 0.48 0.16); } /* sacral */
        .c-yellow{ background:#facc15;    background: color(display-p3 0.98 0.82 0.19); } /* solar */
        .c-green { background:#22c55e;    background: color(display-p3 0.35 0.78 0.47); } /* heart */
        .c-blue  { background:#3b82f6;    background: color(display-p3 0.30 0.58 0.96); } /* throat */
        .c-indigo{ background:#4f46e5;    background: color(display-p3 0.41 0.39 0.90); } /* third eye */
        .c-violet{ background:#c084fc;    background: color(display-p3 0.79 0.52 0.98); } /* crown */

        @media (prefers-reduced-motion: reduce){
          .chakra-band{ animation:none; transform:none; opacity:1; }
          .chakra-band::after{ animation:none; opacity:.5; }
        }
      `}</style>
    </>,
    document.body
  );
}

export default function BannedLogin({ onProceed }) {
  const router = useRouter();

  const [view, setView] = useState('banned'); // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  const [activated, setActivated] = useState(null); // 'link' | 'bypass' | null

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const emailRef = useRef(null);

  // orb state
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  const [orbMode, setOrbMode] = useState('chakra'); // 'chakra' | 'red'
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  const lRef = useRef(null);
  const yRef = useRef(null);
  const [flyOnce, setFlyOnce] = useState(false);

  useEffect(() => { try { router.prefetch?.(HOP_PATH); } catch {} }, [router]);

  useEffect(() => {
    const lock = cascade || whiteout;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cascade, whiteout]);

  const goLogin = useCallback(() => {
    setHideBubble(false);
    setView('login');
    setTimeout(() => emailRef.current?.focus(), 200);
  }, []);

  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true); setHideAll(true); setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}
    try { sessionStorage.setItem('fromCascade', '1'); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true);
      after && after();

      if (typeof onProceed === 'function') {
        onProceed(); // parent flips to shop inline (single page)
      } else {
        try { router.push(HOP_PATH); } catch {}
      }
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, [onProceed, router]);

  const onLink   = useCallback(() => { setActivated('link');   setTimeout(()=>setActivated(null),650); runCascade(()=>{}, { washAway:true }); }, [runCascade]);
  const onBypass = useCallback(() => { setActivated('bypass'); setTimeout(()=>setActivated(null),650); runCascade(()=>{}, { washAway:true }); }, [runCascade]);
  const onOrbActivate = useCallback(() => { onBypass(); }, [onBypass]);

  const toggleOrbColor = useCallback(() => {
    setOrbMode(prev => {
      const next = prev === 'red' ? 'chakra' : 'red';
      setOrbGlow(next === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      return next;
    });
  }, []);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:10 }}>
      {flyOnce && (
        <ButterflyChakra
          startEl={lRef.current}
          endEl={yRef.current}
          durationMs={1600}
          onDone={() => setFlyOnce(false)}
        />
      )}

      {cascade && <CascadeOverlay />}
      {whiteout && !cascade && createPortal(
        <div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>,
        document.body
      )}

      {!hideAll && (
        <div className="login-stack">
          <div className="orb-row" style={{ marginBottom:-28 }}>
            <BlueOrbCross3D
              key={`${orbMode}-${orbGlow}-${orbVersion}`}
              rpm={44}
              color={SEAFOAM}
              geomScale={1}
              glow
              glowOpacity={orbGlow}
              includeZAxis
              height="10vh"
              onActivate={onOrbActivate}
              overrideAllColor={orbMode==='red' ? RED : null}
              overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
            />
          </div>

          {!hideBubble && (
            <div
              className={[
                'vscode-card','card-ultra-tight','login-card',
                view==='banned' ? 'slide-in-left' : 'slide-in-right',
                'bubble-button'
              ].join(' ')}
              style={{ minWidth:260 }}
              role={view==='login' ? 'form' : undefined}
              tabIndex={view==='login' ? 0 : -1}
            >
              {view==='banned' ? (
                <pre className="code-tight" style={{ margin:0 }}>
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <Wordmark
                    onClickWordmark={() => setFlyOnce(true)}
                    lRef={lRef}
                    yRef={yRef}
                  />
                  {'\n'}
                  <span className="lb-seafoam code-comment">//</span>{' '}
                  <span
                    role="button" tabIndex={0}
                    className="code-banned banned-trigger"
                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleOrbColor(); }}}
                    title="Toggle orb color"
                  >
                    is banned
                  </span>{'\n'}
                  <span className="code-keyword">const</span>{' '}
                  <span className="code-var">msg</span>{' '}
                  <span className="code-op">=</span>{' '}
                  <span className="nogap">
                    <span
                      role="button" tabIndex={0}
                      className="code-string code-link"
                      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); goLogin(); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); goLogin(); }}}
                    >
                      "hi..."
                    </span>
                    <span className="code-punc">;</span>
                  </span>
                </pre>
              ) : (
                <form onSubmit={(e)=>e.preventDefault()} style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  <div className="code-row">
                    <span className="lb-seafoam code-comment glow-seafoam">// login</span>
                  </div>

                  <div className="code-row">
                    <span className="code-var neon-violet">email</span>
                    <span className="code-op neon-violet">=</span>
                    <span className="code-string neon-violet">"</span>
                    <input
                      ref={emailRef}
                      className="code-input code-input-violet"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      size={Math.max(1, (email || '').length)}
                      style={{ minWidth: '18ch' }}
                    />
                    <span className="nogap">
                      <span className="code-string neon-violet">"</span>
                      <span className="code-punc neon-violet">;</span>
                    </span>
                  </div>

                  <div className="code-row">
                    <span className="code-var neon-violet">phone</span>
                    <span className="code-op neon-violet">=</span>
                    <span className="code-string neon-violet">"</span>
                    <input
                      className="code-input code-input-violet"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="+1 305 555 0123"
                      inputMode="tel"
                      autoComplete="tel"
                      size={Math.max(1, (phone || '').length)}
                      style={{ minWidth: '16ch' }}
                    />
                    <span className="nogap">
                      <span className="code-string neon-violet">"</span>
                      <span className="code-punc neon-violet">;</span>
                    </span>
                  </div>

                  <div className="row-nowrap" style={{ marginTop:6, gap:8 }}>
                    <button type="button" className={`commit-btn btn-yellow ${activated==='link'?'btn-activated':''}`} onClick={onLink}>Link</button>
                    <button type="button" className={`commit-btn btn-red ${activated==='bypass'?'btn-activated':''}`} onClick={onBypass}>Bypass</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <button
            type="button"
            className={['ghost-btn','florida-link','florida-inline', floridaHot?'is-hot':''].join(' ')}
            onClick={()=>{ if(!hideAll){ setFloridaHot(true); setTimeout(()=>setFloridaHot(false),700); setHideBubble(false); setView(v=>v==='banned'?'login':'banned'); }}}
            onMouseEnter={()=>setFloridaHot(true)}
            onMouseLeave={()=>setFloridaHot(false)}
          >
            Florida, USA
          </button>
        </div>
      )}

      <style jsx global>{`
        :root { --lb-seafoam:#32ffc7; }
        .login-card pre.code-tight{ letter-spacing:0; word-spacing:-0.10ch; white-space:pre; line-height:1.35; }
        .code-row{ display:flex; align-items:baseline; gap:.35ch; line-height:1.35; }
        .nogap{ display:inline-flex; gap:0; }
        .login-card .lb-seafoam, .login-card .code-comment{
          color:var(--lb-seafoam) !important;
          text-shadow:0 0 6px var(--lb-seafoam), 0 0 14px var(--lb-seafoam);
          letter-spacing:0; word-spacing:normal;
        }
        .login-card .code-keyword, .login-card .code-var, .login-card .code-op, .login-card .code-string, .login-card .code-punc, .login-card .lb-white {
          text-shadow:0 0 6px currentColor, 0 0 14px currentColor;
        }
        .login-card .commit-btn{ border:none; border-radius:10px; padding:6px 10px; font-weight:700; line-height:1; cursor:pointer; transition:color .15s ease, box-shadow .15s ease, filter .15s ease; }
        .login-card .btn-yellow{ background:linear-gradient(#ffd84a,#f7b400); color:#2a2000; box-shadow:0 0 14px rgba(255,214,64,.35), 0 0 28px rgba(255,214,64,.18); }
        .login-card .btn-red{ background:linear-gradient(#ff4b66,#d90f1c); color:#330004; box-shadow:0 0 14px rgba(255,76,97,.40), 0 0 28px rgba(255,76,97,.22); }
        .login-card .commit-btn.btn-activated,.login-card .commit-btn:active{ color:#fff !important; text-shadow:0 0 6px #fff, 0 0 14px #fff, 0 0 26px #fff; filter:saturate(1.15) brightness(1.15); }
        .login-card .commit-btn:focus-visible{ outline:2px solid rgba(255,255,255,.65); outline-offset:2px; }
        .code-input-violet{ color:#a78bfa; -webkit-text-fill-color:#a78bfa !important; caret-color:#a78bfa; background:transparent; border:0; outline:0; font:inherit; padding:0; margin:0; width:auto; text-shadow:0 0 6px #a78bfa, 0 0 14px #a78bfa; filter:saturate(1.15); }
        .code-input-violet::placeholder{ color:#9a8aec; opacity:.95; text-shadow:0 0 4px #9a8aec, 0 0 10px #9a8aec; }
        .code-link{ cursor:pointer; text-decoration:none; }
        .code-link:hover, .code-link:focus-visible{ text-decoration:underline; outline:none; }
        .code-banned.banned-trigger{ cursor:pointer; text-decoration:none; }
        .code-banned.banned-trigger:hover, .code-banned.banned-trigger:focus-visible{ text-decoration:underline; }
      `}</style>

      <style jsx>{`.orb-row{ width:100%; contain:layout paint style; isolation:isolate; }`}</style>
    </div>
  );
}
