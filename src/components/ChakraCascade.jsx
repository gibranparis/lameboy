'use client';
import { useEffect } from 'react';
import { scheduleChakraChimes } from '../lib/chakra-audio';

export default function ChakraCascade({ onComplete }) {
  // Visual timings (match your CSS): duration 1.2s, stagger .18s
  const bandStagger = 0.18;
  const bandDuration = 1.2;
  const delays = [0, bandStagger, bandStagger*2, bandStagger*3, bandStagger*4, bandStagger*5, bandStagger*6];

  useEffect(() => {
    // Schedule the 7 chimes to match the 7 bands:
    scheduleChakraChimes(delays, bandDuration);

    // Allow enough time for last band: last delay + duration + small buffer
    const totalMs = (delays[delays.length - 1] + bandDuration + 0.1) * 1000; // ≈ 2400ms
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
