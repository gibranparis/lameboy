// src/components/ChakraBottomRunner.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Bottom ticker with stronger NEON (matches cascade glow).
 * Listens to `lb:orb-mode` {mode:'chakra'|'red'}.
 */
export default function ChakraBottomRunner({
  height = 7,
  speedSec = 12,
  zIndex = 40,
}) {
  const [mode, setMode] = useState('chakra');

  const palette = useMemo(() => {
    return mode === 'red'
      ? ['#ffc1c1','#ff9aa4','#ff6b79','#ff3a52','#e8183a','#bf0f2f','#8f0a22']
      : ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#4f46e5','#c084fc'];
  }, [mode]);

  useEffect(() => {
    try { document.documentElement.style.setProperty('--runner-h', `${Math.max(6, Math.round(height))}px`); } catch {}
  }, [height]);

  useEffect(() => {
    const onMode = (e) => setMode(e?.detail?.mode === 'red' ? 'red' : 'chakra');
    window.addEventListener('lb:orb-mode', onMode); document.addEventListener('lb:orb-mode', onMode);
    return () => { window.removeEventListener('lb:orb-mode', onMode); document.removeEventListener('lb:orb-mode', onMode); };
  }, []);

  const vars = {
    '--c1': palette[0], '--c2': palette[1], '--c3': palette[2],
    '--c4': palette[3], '--c5': palette[4], '--c6': palette[5], '--c7': palette[6],
    '--h':  `${Math.max(6, Math.round(height))}px`,
    '--dur': `${Math.max(4, Number(speedSec) || 12)}s`,
  };

  return (
    <div
      aria-hidden
      className="lb-chakra-runner"
      style={{
        position:'fixed', left:0, right:0,
        bottom:'env(safe-area-inset-bottom, 0px)',
        height:'var(--h)', zIndex, pointerEvents:'none', overflow:'hidden',
        background:'linear-gradient(to top, rgba(0,0,0,.25), rgba(0,0,0,0))',
        willChange:'transform',
        ...vars,
      }}
    >
      {/* base tracks */}
      <RunnerTrack />
      <RunnerTrack mirror />
      {/* glow overlay tracks (blurred, brighter) */}
      <RunnerTrack glow />
      <RunnerTrack glow mirror />
      <style jsx>{`
        @keyframes lb-chakra-run { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

function RunnerTrack({ mirror=false, glow=false }){
  return (
    <div
      style={{
        position:'absolute', inset:0, width:'200%',
        display:'grid', gridAutoFlow:'column', gridTemplateColumns:'repeat(14, minmax(0, 1fr))',
        animation:'lb-chakra-run var(--dur) linear infinite',
        transform: mirror ? 'translateX(-50%)' : 'translateX(0%)',
        mixBlendMode: glow ? 'screen' : 'normal',
        opacity: glow ? .9 : 1,
        filter: glow ? 'blur(12px) saturate(1.3)' : 'none',
      }}
    >
      {Array.from({length:14}, (_,k)=>(<Bar key={k} i={(k%7)+1} />))}
    </div>
  );
}

function Bar({ i }){
  return (
    <div style={{ height:'var(--h)', background:`var(--c${i})` }} />
  );
}
