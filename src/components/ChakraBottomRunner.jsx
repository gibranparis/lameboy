// src/components/ChakraBottomRunner.jsx
'use client';

import { useEffect } from 'react';

/**
 * Bottom ticker with stronger NEON (matches cascade glow).
 * Listens to `lb:orb-mode` {mode:'chakra'|'red'}.
 */
export default function ChakraBottomRunner({
  height = 7,
  speedSec = 12,
  zIndex = 40,
}) {
  const palette = ['#cc0014','#e05500','#ffd400','#00a832','#0066ff','#3a00b5','#9333ea'];

  useEffect(() => {
    try { document.documentElement.style.setProperty('--runner-h', `${Math.max(6, Math.round(height))}px`); } catch {}
  }, [height]);

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
      {/* base tracks — saturated core */}
      <RunnerTrack />
      <RunnerTrack mirror />
      {/* tight neon glow */}
      <RunnerTrack glow="near" />
      <RunnerTrack glow="near" mirror />
      {/* wide diffuse arcade halo */}
      <RunnerTrack glow="far" />
      <RunnerTrack glow="far" mirror />
      <style jsx>{`
        @keyframes lb-chakra-run { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lb-arcade-pulse { 0%,100% { opacity: .85; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function RunnerTrack({ mirror=false, glow='' }){
  const isNear = glow === 'near';
  const isFar  = glow === 'far';
  const isGlow = isNear || isFar;
  return (
    <div
      style={{
        position:'absolute', inset: isFar ? '-8px 0' : 0, width:'200%',
        display:'grid', gridAutoFlow:'column', gridTemplateColumns:'repeat(14, minmax(0, 1fr))',
        animation:'lb-chakra-run var(--dur) linear infinite',
        transform: mirror ? 'translateX(-50%)' : 'translateX(0%)',
        mixBlendMode: isGlow ? 'screen' : 'normal',
        opacity: isFar ? .7 : isNear ? 1 : 1,
        filter: isFar
          ? 'blur(18px) saturate(1.8) brightness(1.6)'
          : isNear
            ? 'blur(6px) saturate(1.5) brightness(1.4)'
            : 'saturate(1.2) brightness(1.1)',
        ...(isFar ? { animation: 'lb-chakra-run var(--dur) linear infinite, lb-arcade-pulse 2.4s ease-in-out infinite' } : {}),
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
