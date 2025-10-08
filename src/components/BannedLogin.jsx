// @ts-check
// src/components/BannedLogin.jsx
'use client';

import nextDynamic from 'next/dynamic'; // ✅ alias to avoid route `dynamic` name collisions
const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import ButterflyChakra from '@/components/ButterflyChakra';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';
import { useRouter } from 'next/navigation';

const CASCADE_MS = 2400;
const HOP_PATH = '/shop';
const SWAP_MS = 22000; // 22s swap cadence

/** @typedef {'banned'|'login'} ViewState */
/** @typedef {'link'|'bypass'|null} Activation */

/**
 * Wordmark
 * @param {{
 *  onClickWordmark: () => void;
 *  lRef: import('react').RefObject<HTMLSpanElement>;
 *  yRef: import('react').RefObject<HTMLSpanElement>;
 * }} props
 */
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

/** Cascade overlay */
/** @param {{ durationMs?: number }} props */
function CascadeOverlay({ durationMs = CASCADE_MS }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    /** @type {number|undefined} */ let start;
    /** @type {number|undefined} */ let id;
    const step = (t /** @type {number} */) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / durationMs);
      setP(k);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => { if (id) cancelAnimationFrame(id); };
  }, [durationMs]);

  const whiteTx = (1 - p) * 100;
  const COLOR_VW = 120;
  const bandsTx = (1 - p) * (100 + COLOR_VW) - COLOR_VW;

  return createPortal(
    <>
      <div aria-hidden="true" style={{
        position:'fixed', inset:0, transform:`translate3d(${whiteTx}%,0,0)`,
        background:'#fff', zIndex:9998, pointerEvents:'none', willChange:'transform'
      }}/>
      <div aria-hidden="true" style={{
        position:'fixed', top:0, left:0, height:'100vh', width:`${COLOR_VW}vw`,
        transform:`translate3d(${bandsTx}vw,0,0)`,
        zIndex:9999, pointerEvents:'none', willChange:'transform'
      }}>
        <div className="lb-cascade">
          <div className="lb-band lb-b1"/><div className="lb-band lb-b2"/><div className="lb-band lb-b3"/>
          <div className="lb-band lb-b4"/><div className="lb-band lb-b5"/><div className="lb-band lb-b6"/><div className="lb-band lb-b7"/>
        </div>
      </div>
      <div className="lb-brand" aria-hidden="true" style={{ zIndex:10001 }}>
        <span className="lb-brand-text">LAMEBOY, USA</span>
      </div>
      <style jsx global>{`
        .lb-cascade{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(7,1fr); }
        .lb-band{ width:100%; height:100%; background:var(--c); }
        .lb-b1{ --c:#ef4444 } .lb-b2{ --c:#f97316 } .lb-b3{ --c:#facc15 }
        .lb-b4{ --c:#22c55e } .lb-b5{ --c:#3b82f6 } .lb-b6{ --c:#4f46e5 } .lb-b7{ --c:#c084fc }
        .lb-brand{ position:fixed; inset:0; display:grid; place-items:center; pointer-events:none; }
        .lb-brand-text{
          color:#fff; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
          font-size:clamp(11px,1.3vw,14px); text-shadow:0 0 8px rgba(0,0,0,.25);
        }
      `}</style>
    </>,
    document.body
  );
}

/** @param {{ onProceed?: () => void }} props */
export default function BannedLogin({ onProceed }) {
  const router = useRouter();

  /** @type {[ViewState, (v: ViewState) => void]} */
  // @ts-ignore - React infers, JSDoc narrows
  const [view, setView] = useState(/** @type {ViewState} */('banned'));
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

  const [hideBubble, setHideBubble] = useState(false);
  const [floridaHot, setFloridaHot] = useState(false);
  /** @type {[Activation, (a: Activation) => void]} */
  // @ts-ignore
  const [activated, setActivated] = useState(/** @type {Activation} */(null));

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  /** @type {import('react').RefObject<HTMLInputElement>} */
  const emailRef = useRef(null);

  // orb state
  const SEAFOAM = '#32ffc7';
  const RED = '#ff001a';
  /** @type {['chakra'|'red', (m: 'chakra'|'red') => void]} */
  // @ts-ignore
  const [orbMode, setOrbMode] = useState(/** @type {'chakra'|'red'} */('chakra'));
  const [orbGlow, setOrbGlow] = useState(0.9);
  const [orbVersion, setOrbVersion] = useState(0);

  /** @type {import('react').RefObject<HTMLSpanElement>} */
  const lRef = useRef(null);
  /** @type {import('react').RefObject<HTMLSpanElement>} */
  const yRef = useRef(null);
  const [flyOnce, setFlyOnce] = useState(false);

  // === Swap "hi..." <-> "...レ乃モ" every 22s ===
  const [altText, setAltText] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setAltText(v => !v), SWAP_MS);
    return () => clearInterval(id);
  }, []);
  const msgCore = altText ? '...レ乃モ' : 'hi...';
  const msgAria = altText ? 'Ellipsis Renomo' : 'hi';

  useEffect(() => { try { router.prefetch?.(HOP_PATH); } catch {} }, [router]);

  // lock scroll during cascade/whiteout
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

  /**
   * Run the color cascade, optionally washing away bubble, then hop.
   * @param {() => void} [after]
   * @param {{ washAway?: boolean }} [opts]
   */
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
        onProceed();
      } else {
        try { router.push(HOP_PATH); } catch {}
      }
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, [onProceed, router]);

  const onLink = useCallback(() => {
    setActivated('link');
    setTimeout(()=>setActivated(null),650);
    runCascade(()=>{}, { washAway:true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass');
    setTimeout(()=>setActivated(null),650);
    runCascade(()=>{}, { washAway:true });
  }, [runCascade]);

  const toggleOrbColor = useCallback(() => {
    setOrbMode(prev => {
      const next = prev === 'red' ? 'chakra' : 'red';
      setOrbGlow(next === 'red' ? 1.0 : 0.9);
      setOrbVersion(v => v + 1);
      return next;
    });
  }, []);

  return (
    <div className="page-center" style={{ position:'relative', flexDirection:'column', gap:8 }}>
      {flyOnce && (
        <ButterflyChakra
          startEl={lRef.current}
          endEl={yRef.current}
          durationMs={1600}
          onDone={() => setFlyOnce(false)}
        />
      )}

      {cascade && <CascadeOverlay durationMs={CASCADE_MS} />}
      {whiteout && !cascade && createPortal(
        <div aria-hidden="true" style={{ position:'fixed', inset:0, background:'#fff', zIndex:10002, pointerEvents:'none' }}/>,
        document.body
      )}

      {!hideAll && (
        <div className="login-stack">
          {/* ✅ Orb now steps grid density 5↔1 with a simple click (no cascade here) */}
          <div className="orb-row" style={{ marginBottom:-16, display:'grid', placeItems:'center' }}>
            <button
              type="button"
              aria-label="Grid density +1"
              onClick={() => {
                /** @type {CustomEventInit<{ step: number }>} */
                const evt = { detail: { step: 1 } };
                window.dispatchEvent(new CustomEvent('grid-density', evt));
              }}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ lineHeight: 0 }}
            >
              <BlueOrbCross3D
                key={`${orbMode}-${orbGlow}-${orbVersion}`}
                rpm={44}
                color={SEAFOAM}
                geomScale={1.12}
                glow
                glowOpacity={orbGlow}
                includeZAxis
                height="72px"
                /* ⛔ removed onActivate to avoid accidental cascade on click */
                overrideAllColor={orbMode==='red' ? RED : null}
                overrideGlowOpacity={orbMode==='red' ? 1.0 : undefined}
                interactive={true}
              />
            </button>
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
                      role="button"
                      tabIndex={0}
                      aria-label={msgAria}
                      className="code-string code-link"
                      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); goLogin(); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); goLogin(); }}}
                      title="Continue"
                    >
                      {`"${msgCore}"`}
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
            style={{ marginTop: 6 }}
          >
            Florida, USA
          </button>
        </div>
      )}
    </div>
  );
}
