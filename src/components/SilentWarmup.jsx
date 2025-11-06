// src/components/SilentWarmup.jsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Default assets live in /public
const CART   = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];
const TOGGLE = ['/toggle/moon-blue.png','/toggle/moon-red.png'];

export default function SilentWarmup({
  enable        = true,
  prefetchPath  = '/shop',
  images        = [...CART, ...TOGGLE],
  maxConcurrent = 2,          // keep network gentle
  startDelayMs  = 300,        // wait a tick after mount
}) {
  const started = useRef(false);
  const stopRef = useRef(false);
  const router  = useRouter();

  useEffect(() => {
    if (!enable || started.current) return;
    started.current = true;

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const here = window.location?.pathname || '';
    if (here === prefetchPath) return;               // don’t prefetch the page we’re on

    // Environment checks
    const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    const saveData = !!conn?.saveData;
    const slowNet = /^(slow-2g|2g)$/.test(conn?.effectiveType || '');
    const isVisible = () => document.visibilityState !== 'hidden';

    // If the user asked for data savings or the net is tiny, do nothing.
    if (saveData || slowNet) return;

    // requestIdleCallback polyfill
    const rIC = (cb, timeout = 1500) => {
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
          window.cancelIdleCallback(id);
          return;
        }
      } catch {}
      clearTimeout(id);
    };

    // --- helpers ------------------------------------------------------
    const idleIds = [];
    let rafId = 0;
    const loaded = new Set();

    const uniqueQueue = images.filter(Boolean).filter((src, i, arr) => arr.indexOf(src) === i);

    const loadImage = (src) =>
      new Promise((resolve) => {
        if (!src || loaded.has(src) || stopRef.current) return resolve();
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';                // we’re controlling when it starts
        img.referrerPolicy = 'no-referrer';
        img.onload = img.onerror = () => { loaded.add(src); resolve(); };
        // kick on next tick so we can throttle multiple starts
        setTimeout(() => { if (!stopRef.current) img.src = src; }, 0);
      });

    // Little concurrency controller
    const warmQueue = async () => {
      if (!isVisible() || stopRef.current) return;
      const q = uniqueQueue.slice();     // copy
      const runners = new Array(Math.max(1, Math.min(maxConcurrent, q.length)))
        .fill(0)
        .map(async () => {
          while (q.length && !stopRef.current) {
            const next = q.shift();
            // small spacing between kicks to avoid bursts
            // (helps on iOS and underpowered devices)
            // eslint-disable-next-line no-await-in-loop
            await loadImage(next);
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, 120));
          }
        });
      await Promise.all(runners);
    };

    // --- schedule ------------------------------------------------------
    // 1) After first paint, queue a gentle prefetch of the shop route
    rafId = requestAnimationFrame(() => {
      if (!isVisible()) return;
      idleIds.push(rIC(() => { if (!stopRef.current) { try { router.prefetch(prefetchPath); } catch {} } }, 900));
    });

    // 2) Warm images when idle
    idleIds.push(rIC(() => { if (!stopRef.current && isVisible()) warmQueue(); }, 1500));

    // 3) Final nudge once fully loaded
    const onLoad = () => {
      if (stopRef.current) return;
      try { router.prefetch(prefetchPath); } catch {}
      warmQueue();
    };
    // small delay to avoid competing with critical resources
    const loadTimer = setTimeout(() => window.addEventListener('load', onLoad, { once: true }), startDelayMs);

    // 4) If the tab becomes visible later, do one tiny follow-up prefetch
    const onVisible = () => {
      if (!isVisible() || stopRef.current) return;
      try { router.prefetch(prefetchPath); } catch {}
      document.removeEventListener('visibilitychange', onVisible);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopRef.current = true;
      try { cancelAnimationFrame(rafId); } catch {}
      idleIds.forEach((id) => cRIC(id));
      clearTimeout(loadTimer);
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enable, prefetchPath, images, maxConcurrent, startDelayMs, router]);

  return null;
}
