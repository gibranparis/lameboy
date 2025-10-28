// src/components/SilentWarmup.jsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CART   = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];
const TOGGLE = ['/toggle/moon-blue.png','/toggle/moon-red.png'];

export default function SilentWarmup({
  prefetchPath = '/shop',
  images = [...CART, ...TOGGLE],
}) {
  const started = useRef(false);
  const router  = useRouter();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // SSR guard
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Skip if we're already on the target route
    const here = window.location?.pathname || '';
    if (here === prefetchPath) return;

    // Respect Data Saver when present
    const saveData = !!navigator?.connection?.saveData;
    // Only warm when tab is visible
    const isVisible = () => document.visibilityState !== 'hidden';

    // requestIdleCallback polyfill
    const rIC = (cb, timeout = 1200) => {
      try {
        if (typeof window.requestIdleCallback === 'function') {
          return window.requestIdleCallback(cb, { timeout });
        }
      } catch {}
      const id = window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), timeout);
      return id;
    };
    const cRIC = (id) => {
      try {
        if (typeof window.cancelIdleCallback === 'function') {
          return window.cancelIdleCallback(id);
        }
      } catch {}
      clearTimeout(id);
    };

    const idleIds = [];
    let rafId = 0;

    // 1) After first paint, lightly prefetch the route (only if visible & not on saver)
    rafId = requestAnimationFrame(() => {
      if (!isVisible() || saveData) return;
      idleIds.push(
        rIC(() => { try { router.prefetch(prefetchPath); } catch {} }, 800)
      );
    });

    // Helper to warm a list of images
    const warmImages = (list) => {
      try {
        list.forEach((src) => {
          if (!src) return;
          const img = new Image();
          img.decoding = 'async';
          // keep it async; no fetch priority to avoid stealing bandwidth
          img.referrerPolicy = 'no-referrer';
          img.src = src;
          // queue decode if supported, but don’t block or throw on fail
          img.decode?.().catch(() => {});
        });
      } catch {}
    };

    // 2) Warm image cache gently (Birkin + moons) if not on saver
    idleIds.push(
      rIC(() => {
        if (!isVisible() || saveData) return;
        warmImages(images);
      }, 1500)
    );

    // 3) Final nudge once the page fully loads
    const onLoad = () => {
      if (saveData) return;
      try { router.prefetch(prefetchPath); } catch {}
      warmImages(images);
    };
    window.addEventListener('load', onLoad, { once: true });

    // 4) If the tab becomes visible later, do one tiny follow-up prefetch
    const onVisible = () => {
      if (!isVisible() || saveData) return;
      try { router.prefetch(prefetchPath); } catch {}
      document.removeEventListener('visibilitychange', onVisible);
    };
    document.addEventListener('visibilitychange', onVisible);

    // Cleanup
    return () => {
      try { cancelAnimationFrame(rafId); } catch {}
      idleIds.forEach((id) => cRIC(id));
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [prefetchPath, images, router]);

  return null; // invisible warmup helper
}
