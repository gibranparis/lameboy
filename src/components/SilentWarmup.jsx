// src/components/SilentWarmup.jsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CART = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];
const TOGGLE = ['/toggle/moon-blue.png','/toggle/moon-red.png'];

export default function SilentWarmup({
  prefetchPath = '/shop',
  images = [...CART, ...TOGGLE],
}) {
  const started = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Stagger work so it never blocks paint / interactions on the banned page.
    const idle = (cb, timeout = 1000) =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(cb, { timeout })
        : setTimeout(cb, 0);

    // 1) After first paint + one animation frame, prefetch the /shop route
    requestAnimationFrame(() => {
      idle(() => {
        try { router.prefetch(prefetchPath); } catch {}
      });
    });

    // 2) Then warm image cache (Birkin + toggle moons) very gently
    idle(() => {
      images.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';      // still async; just hints priority
        img.src = src;
      });
    }, 1200);

    // 3) As a last nudge, kick again when the page is fully loaded
    const onLoad = () => {
      try { router.prefetch(prefetchPath); } catch {}
      images.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
    };
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, [prefetchPath, images, router]);

  return null; // nothing visual ever renders
}
