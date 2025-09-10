'use client';
import { useEffect } from 'react';
import { scheduleChakraChimes } from '../lib/chakra-audio';

export default function ChakraCascade({ onComplete }) {
  // Visual timing used by CSS
  const bandStagger = 0.18;
  const bandDuration = 1.2;
  const delays = [0, bandStagger, bandStagger*2, bandStagger*3, bandStagger*4, bandStagger*5, bandStagger*6];

  useEffect(() => {
    // Audio in sync (tweakable)
    scheduleChakraChimes(delays, {
      octave: 1,        // brighter: 1, neutral: 0, deep: -1
      attack: 0.025,
      duration: 1.6,
      filterHz: 10000,
      filterQ: 0.8,
      partialRatio: 2.71,
      partialLevel: 0.30,
      noteGain: 0.55,
      masterGain: 0.85,
    });

    const totalMs = (delays[6] + bandDuration + 0.1) * 1000; // ≈ 2400ms
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
