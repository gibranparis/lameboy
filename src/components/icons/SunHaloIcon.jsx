// @ts-check
'use client';
import { useId } from 'react';

/** @param {{ className?: string }} props */
export default function SunHaloIcon({ className = '' }) {
  const id = useId();
  const coreId = `sunCore-${id}`;
  const glowId = `sunGlow-${id}`;
  const haloId = `haloStroke-${id}`;

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7cc" />
          <stop offset="55%" stopColor="#ffd75e" />
          <stop offset="100%" stopColor="#ffb200" />
        </radialGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc850" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffc850" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={haloId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a0d8ff" />
          <stop offset="33%" stopColor="#a8ffbf" />
          <stop offset="66%" stopColor="#ffd080" />
          <stop offset="100%" stopColor="#a0d8ff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="20" fill={`url(#${glowId})`} />
      <circle cx="32" cy="32" r="24" fill="none" stroke={`url(#${haloId})`} strokeWidth="2.2" opacity="0.9" />
      <circle cx="12" cy="32" r="3.2" fill="#ffe08a" />
      <circle cx="52" cy="32" r="3.2" fill="#ffe08a" />
      <circle cx="32" cy="32" r="12" fill={`url(#${coreId})`} />
    </svg>
  );
}
