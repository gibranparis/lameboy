// @ts-check
'use client';
import { useId } from 'react';

/** @param {{ className?: string }} props */
export default function MoonIcon({ className = '' }) {
  const id = useId();
  const shadeId = `moonShade-${id}`;
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" role="img">
      <defs>
        <radialGradient id={shadeId} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd6e6" />
        </radialGradient>
      </defs>
      <path
        d="M42 52c-11.046 0-20-8.954-20-20 0-6.87 3.46-12.91 8.72-16.47C28.3 16.16 26 20.86 26 26c0 11.05 8.95 20 20 20 5.14 0 9.85-2.3 10.47-4.72C54.91 48.54 48.87 52 42 52z"
        fill={`url(#${shadeId})`}
      />
    </svg>
  );
}
