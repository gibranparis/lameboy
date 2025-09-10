'use client';

import { useEffect } from 'react';

/**
 * Full-screen left→right chakra cascade.
 * Each band appears (fades in), then disappears (fades out) sequentially,
 * with a soft glow. Calls onComplete() after the last band finishes.
 */
export default function ChakraCascade({ onComplete }) {
  useEffect(() => {
    // Total = last delay (1.08s) + anim (1.2s) + small buffer
    const totalMs = 2400;
    const t = setTimeout(() => onComplete?.(), totalMs);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="chakra-overlay">
      <div className="chakra-band band-1 chakra-root" />
      <div className="chakra-band band-2 chakra-sacral" />
      <div className="chakra-band band-3 chakra-plexus" />
      <div className="chakra-band band-4 chakra-heart" />
      <div className="chakra-band band-5 chakra-throat" />
      <div className="chakra-band band-6 chakra-thirdeye" />
      <div className="chakra-band band-7 chakra-crown" />
    </div>
  );
}
