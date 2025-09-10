'use client';

import { useEffect } from 'react';

export default function ChakraCascade({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), 1400); // match band-7 end (~1.2s + small buffer)
    return () => clearTimeout(t);
  }, [onComplete]);

  // NOTE: order is violet -> red; container CSS is RTL so the first child lands on the RIGHT
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
