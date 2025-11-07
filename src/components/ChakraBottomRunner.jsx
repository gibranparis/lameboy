// src/components/ChakraBottomRunner.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Always-on bottom ticker of 7 chakra bars moving right → left.
 * Listens to `lb:orb-mode` events:
 *   detail.mode: 'chakra' | 'red'
 *
 * Props:
 * - height   : px height for the bar (default 14)
 * - speedSec : seconds for one full loop (default 12)
 * - zIndex   : stacking order (default 40, above backgrounds, under header)
 */
export default function ChakraBottomRunner({
  height = 14,
  speedSec = 12,
  zIndex = 40,
}) {
  const [mode, setMode] = useState('chakra'); // 'chakra' | 'red'

  // palette per mode
  const palette = useMemo(() => {
    if (mode === 'red') {
      // crimson spectrum (light→deep) while preserving 7-bar rhythm
      return ['#ffc1c1', '#ff9aa4', '#ff6b79', '#ff3a52', '#e8183a', '#bf0f2f', '#8f0a22'];
    }
    // chakra colors
    return ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#4f46e5', '#c084fc'];
  }, [mode]);

  useEffect(() => {
    // initial sync (default chakra) + listen for orb mode changes
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

  // CSS vars for colors
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
  };

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'var(--h)',
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
        // slight backdrop for readability in day mode without being intrusive
        background:
          'linear-gradient(to top, rgba(0,0,0,.25), rgba(0,0,0,0))',
        ...vars,
      }}
    >
      {/* Two identical tracks for seamless loop */}
      <RunnerTrack />
      <RunnerTrack mirror />
      <style jsx>{`
        @keyframes lb-chakra-run {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function RunnerTrack({ mirror = false }) {
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
      <Bar i={1} />
      <Bar i={2} />
      <Bar i={3} />
      <Bar i={4} />
      <Bar i={5} />
      <Bar i={6} />
      <Bar i={7} />
      {/* Second 7 */}
      <Bar i={1} />
      <Bar i={2} />
      <Bar i={3} />
      <Bar i={4} />
      <Bar i={5} />
      <Bar i={6} />
      <Bar i={7} />
    </div>
  );
}

function Bar({ i }) {
  return (
    <div
      style={{
        height: 'var(--h)',
        background: `var(--c${i})`,
        boxShadow: '0 0 12px rgba(0,0,0,.15)',
      }}
    />
  );
}
