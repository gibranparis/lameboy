// src/components/ChakraBottomRunner.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Bottom ticker of 7 bars moving right → left with a neon glow.
 * Listens to `lb:orb-mode` events:
 *   detail.mode: 'chakra' | 'red'
 *
 * Props:
 * - height   : px height for the bar (default 14)
 * - speedSec : seconds for one full loop (default 12)
 * - zIndex   : stacking order (default 40)
 */
export default function ChakraBottomRunner({
  height = 14,
  speedSec = 12,
  zIndex = 40,
}) {
  const [mode, setMode] = useState('chakra');  // 'chakra' | 'red'
  const [isNight, setIsNight] = useState(() => {
    if (typeof document === 'undefined') return false;
    const root = document.documentElement;
    return root.dataset.theme === 'night' || root.classList.contains('dark');
  });

  // react to theme changes so we can adjust glow strength/blend mode
  useEffect(() => {
    const onTheme = (e) => {
      const t = e?.detail?.theme;
      const night = t ? t === 'night' :
        document.documentElement.dataset.theme === 'night' ||
        document.documentElement.classList.contains('dark');
      setIsNight(night);
    };
    window.addEventListener('theme-change', onTheme);
    document.addEventListener('theme-change', onTheme);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      document.removeEventListener('theme-change', onTheme);
    };
  }, []);

  // palette per mode
  const palette = useMemo(() => {
    if (mode === 'red') {
      return ['#ffc1c1', '#ff9aa4', '#ff6b79', '#ff3a52', '#e8183a', '#bf0f2f', '#8f0a22'];
    }
    return ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'];
  }, [mode]);

  // sync runner height to CSS var so the heart offset stays correct
  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--runner-h', `${Math.max(6, Math.round(height))}px`);
    } catch {}
  }, [height]);

  // listen for orb mode toggle broadcasts
  useEffect(() => {
    const onMode = (e) => {
      const m = e?.detail?.mode;
      setMode(m === 'red' ? 'red' : 'chakra');
    };
    window.addEventListener('lb:orb-mode', onMode);
    document.addEventListener('lb:orb-mode', onMode);
    return () => {
      window.removeEventListener('lb:orb-mode', onMode);
      document.removeEventListener('lb:orb-mode', onMode);
    };
  }, []);

  // CSS vars
  const vars = {
    '--c1': palette[0],
    '--c2': palette[1],
    '--c3': palette[2],
    '--c4': palette[3],
    '--c5': palette[4],
    '--c6': palette[5],
    '--c7': palette[6],
    '--h': `${Math.max(6, Math.round(height))}px`,
    '--dur': `${Math.max(4, Number(speedSec) || 12)}s`,
    // stronger glow at night; slightly softer in day to avoid overpowering
    '--glow-o': isNight ? '0.95' : '0.78',
    '--blend': isNight ? 'screen' : 'multiply',
  };

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'var(--h)',
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'linear-gradient(to top, rgba(0,0,0,.25), rgba(0,0,0,0))',
        willChange: 'transform',
        contain: 'layout style paint',
        ...vars,
      }}
    >
      {/* Two identical tracks for seamless loop */}
      <RunnerTrack isNight={isNight} />
      <RunnerTrack mirror isNight={isNight} />

      <style jsx>{`
        @keyframes lb-chakra-run {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(#__next) :where(div[aria-hidden]) > div {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

function RunnerTrack({ mirror = false, isNight }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '200%',
        display: 'grid',
        gridAutoFlow: 'column',
        gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', // 7 bars * 2 sets
        animation: 'lb-chakra-run var(--dur) linear infinite',
        transform: mirror ? 'translateX(-50%)' : 'translateX(0%)',
        mixBlendMode: 'normal',
      }}
    >
      {/* First 7 */}
      <Bar i={1} isNight={isNight} />
      <Bar i={2} isNight={isNight} />
      <Bar i={3} isNight={isNight} />
      <Bar i={4} isNight={isNight} />
      <Bar i={5} isNight={isNight} />
      <Bar i={6} isNight={isNight} />
      <Bar i={7} isNight={isNight} />
      {/* Second 7 */}
      <Bar i={1} isNight={isNight} />
      <Bar i={2} isNight={isNight} />
      <Bar i={3} isNight={isNight} />
      <Bar i={4} isNight={isNight} />
      <Bar i={5} isNight={isNight} />
      <Bar i={6} isNight={isNight} />
      <Bar i={7} isNight={isNight} />
    </div>
  );
}

function Bar({ i, isNight }) {
  const colorVar = `var(--c${i})`;
  return (
    <div
      style={{
        position: 'relative',
        height: 'var(--h)',
        background: colorVar,
        // tiny inner shadow to keep definition against light backgrounds
        boxShadow: isNight ? '0 0 0 rgba(0,0,0,0)' : 'inset 0 0 0 1px rgba(0,0,0,.04)',
        overflow: 'visible',
      }}
    >
      {/* Neon glow layer (like the cascade): a blurred, oversized duplicate */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-14px',
          background: colorVar,
          filter: 'blur(24px)',
          opacity: 'var(--glow-o)',
          mixBlendMode: 'var(--blend)',
          pointerEvents: 'none',
          willChange: 'filter, opacity',
        }}
      />
    </div>
  );
}
