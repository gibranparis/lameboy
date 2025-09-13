// src/components/BannedLogin.jsx
'use client';

import dynamic from 'next/dynamic';
const BlueOrbCross3D = dynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false });

import { useCallback, useRef, useState } from 'react';
import { playChakraSequenceRTL } from '@/lib/chakra-audio';

const CASCADE_MS = 2400; // keep in sync with your cascade CSS

/** Chakra-colored "Lameboy" with BRIGHT pulsing glow; ".com" stays plain */
function ChakraWord({ word = 'Lameboy', suffix = '', strong = true, className = '' }) {
  const colors = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#a855f7']; // root→crown
  return (
    <span className={`chakra-word ${className}`}>
      {word.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="chakra-letter glow-plus"
          style={{ color: colors[i % colors.length], fontWeight: strong ? 800 : 700 }}
        >
          {ch}
        </span>
      ))}
      {suffix ? <span className="chakra-suffix">{suffix}</span> : null}
      <style jsx>{`
        .chakra-word { display: inline-flex; letter-spacing: 0.06em; gap: 0.02em; }
        .chakra-suffix { margin-left: 0.06em; font-weight: 700; }

        /* SUPER shiny rainbow glow */
        .chakra-letter.glow-plus {
          position: relative;
          mix-blend-mode: screen; /* brighter on dark bg */
          text-shadow:
            0 0 8px   currentColor,
            0 0 18px  currentColor,
            0 0 32px  currentColor,
            0 0 54px  currentColor,
            0 0 88px  currentColor;
          filter:
            drop-shadow(0 0 6px currentColor)
            drop-shadow(0 0 14px currentColor)
            drop-shadow(0 0 26px currentColor);
          animation: glowPulseMega 1.8s ease-in-out infinite alternate;
        }

        @keyframes glowPulseMega {
          0% {
            text-shadow:
              0 0 8px  currentColor,
              0 0 18px currentColor,
              0 0 32px currentColor,
              0 0 54px currentColor,
              0 0 88px currentColor;
            filter:
              drop-shadow(0 0 6px currentColor)
              drop-shadow(0 0 14px currentColor)
              drop-shadow(0 0 26px currentColor);
          }
          100% {
            text-shadow:
              0 0 12px currentColor,
              0 0 28px currentColor,
              0 0 50px currentColor,
              0 0 84px currentColor,
              0 0 120px currentColor;
            filter:
              drop-shadow(0 0 8px currentColor)
              drop-shadow(0 0 22px currentColor)
              drop-shadow(0 0 40px currentColor);
          }
        }
      `}</style>
    </span>
  );
}

export default function BannedLogin() {
  const [view, setView] = useState('banned');          // 'banned' | 'login'
  const [cascade, setCascade] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [whiteout, setWhiteout] = useState(false);

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

  const runCascade = useCallback((after, { washAway = false } = {}) => {
    setCascade(true);
    setHideAll(true);
    setWhiteout(false);
    try { playChakraSequenceRTL(); } catch {}

    const t = setTimeout(() => {
      setCascade(false);
      if (washAway) setHideBubble(true);
      setWhiteout(true);
      after && after();
    }, CASCADE_MS);

    return () => clearTimeout(t);
  }, []);

  const onBubbleClick = useCallback(() => {
    setBubblePulse(true); setTimeout(() => setBubblePulse(false), 700);
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    goLogin();
  }, [goLogin]);

  const onFloridaClick = useCallback(() => {
    if (hideAll) return;
    setFloridaHot(true); setTimeout(() => setFloridaHot(false), 700);
    setHideBubble(false);
    setView(v => (v === 'banned' ? 'login' : 'banned'));
  }, [hideAll]);

  const onLink = useCallback(() => {
    setActivated('link'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  const onBypass = useCallback(() => {
    setActivated('bypass'); setTimeout(() => setActivated(null), 650);
    runCascade(() => {}, { washAway: true });
  }, [runCascade]);

  return (
    <div className="page-center" style={{ position: 'relative', flexDirection: 'column', gap: 10 }}>
      {!hideAll && (
        <div className="login-stack">
          {/* Orb — safe geometry, 20% faster spin, close to the bubble */}
          <BlueOrbCross3D rpm={7.2} color="#32ffc7" geomScale={1} style={{ marginBottom: -9, height: '10vh' }} />

          {/* Blue bubble */}
          {!hideBubble && (
            <div
              className={[
                'vscode-card','card-ultra-tight','login-card',
                view === 'banned' ? 'slide-in-left' : 'slide-in-right',
                'bubble-button', bubblePulse ? 'bubble-glow-blue' : '',
              ].join(' ')}
              style={{ minWidth: 260 }}
              role={view === 'banned' ? 'button' : undefined}
              tabIndex={view === 'banned' ? 0 : -1}
              onClick={view === 'banned' ? onBubbleClick : undefined}
              onKeyDown={
                view === 'banned'
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBubbleClick(); } }
                  : undefined
              }
            >
              {view === 'banned' ? (
                <pre className="code-line" style={{ margin: 0 }}>
                  <span className="code-comment">// </span>
                  <ChakraWord word="Lameboy" suffix=".com" />
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
                    <span className="code-var">email<
