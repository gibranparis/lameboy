'use client';
import { useEffect } from 'react';
import { scheduleChakraChimes } from '../lib/chakra-audio';

export default function ChakraCascade({ onComplete }) {
  // Visual timings (your non-overlapping version)
  const bandStagger = 0.18;  // seconds between bands
  const bandDuration = 1.2;  // CSS animation duration
  const delays = [0, bandStagger, bandStagger*2, bandStagger*3, bandStagger*4, bandStagger*5, bandStagger*6];

  useEffect(() => {
    // 🔧 AUDIO TWEAKS — adjust to taste
    scheduleChakraChimes(delays, {
      // pitch
      octave: 1,          // +1 = one octave up (brighter). Try 0 or -1.
      // envelope / ring length
      attack: 0.025,      // slightly softer onset
      duration: 1.6,      // total per note (≈ attack + decay)
      // tone color
      filterHz: 10000,    // a bit brighter than 8k
      filterQ: 0.8,
      partialRatio: 2.71, // inharmonic sparkle
      partialLevel: 0.30, // stronger overtone
      // loudness
      noteGain: 0.55,     // per-note peak (0..1)
      masterGain: 0.85,   // overall
    });

    // Allow enough time for last band to finish + tiny buffer
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
