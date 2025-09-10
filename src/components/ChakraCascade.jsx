'use client';

import { useEffect } from 'react';
import { playChakraSequenceRTL } from '../lib/chakra-audio';

export default function ChakraCascade({ onComplete }) {
  useEffect(() => {
    // Fire tones when the cascade mounts
    playChakraSequenceRTL().catch(() => {});

    // Total = last delay (1.08s) + band dur (1.2s) + buffer
    const t = setTimeout(() => onComplete?.(), 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  // DOM order matches RTL visual order (right-most first)
  return (
    <div className="chakra-overlay">
      <div className="chakra-band chakra-crown    band-1"></div>
      <div className="chakra-band chakra-thirdeye band-2"></div>
      <div className="chakra-band chakra-throat   band-3"></div>
      <div className="chakra-band chakra-heart    band-4"></div>
      <div className="chakra-band chakra-plexus   band-5"></div>
      <div className="chakra-band chakra-sacral   band-6"></div>
      <div className="chakra-band chakra-root     band-7"></div>
    </div>
  );
}
