'use client';

import { useEffect } from 'react';

/**
 * Full-screen 7-band chakra waterfall.
 * Calls onComplete() after the last band finishes.
 */
export default function ChakraCascade({ onComplete }) {
  useEffect(() => {
    // duration ~ last delay (.96s) + anim (.5s) + tiny buffer
    const t = setTimeout(() => onComplete?.(), 1600);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="chakra-overlay">
      <div className="chakra-band band-1 chakra-root"></div>
      <div className="chakra-band band-2 chakra-sacral"></div>
      <div className="chakra-band band-3 chakra-plexus"></div>
      <div className="chakra-band band-4 chakra-heart"></div>
      <div className="chakra-band band-5 chakra-throat"></div>
      <div className="chakra-band band-6 chakra-thirdeye"></div>
      <div className="chakra-band band-7 chakra-crown"></div>
    </div>
  );
}
