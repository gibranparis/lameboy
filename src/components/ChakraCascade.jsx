'use client';
import { useEffect } from 'react';

export default function ChakraCascade({ onComplete }) {
  useEffect(() => {
    // last delay (.72s) + duration (1.6s) + small buffer ≈ 2.6s
    const totalMs = 2600;
    const t = setTimeout(() => onComplete?.(), totalMs);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="chakra-overlay" aria-hidden="true">
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
