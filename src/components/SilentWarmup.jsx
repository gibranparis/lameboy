// src/components/SilentWarmup.jsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Default assets live in /public
const CART   = ['/cart/birkin-green.png','/cart/birkin-royal.png','/cart/birkin-sky.png'];
const TOGGLE = ['/toggle/moon-blue.png','/toggle/moon-red.png'];

export default function SilentWarmup({
  enable            = true,
  prefetchPath      = '/shop',
  images            = [...CART, ...TOGGLE],
  maxConcurrent     = 2,      // keep network gentle
  startDelayMs      = 300,    // wait a tick after mount
  onlyWhenGate      = true,   // don't warm if we're already in shop mode
  prefetchOnVisible = true,   // do a one-time follow-up prefetch on visibility
}) {
  const started = useRef(false);
  const stopRef = useRef(false);
  const router  = useRouter();

  useEffect(() => {
    if (!enable || started.current) return;
    started.current = true;

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const here = window.location?.pathname || '';
    const mode = document.documentElement.getAttribute('data-mode'); // 'gate' | 'shop'
    if (here === prefetchPath) return;                  // don’t prefetch the page we’re on
    if (onlyWhenGate && mode === 'shop') return;        // skip if already in shop

    // Environment checks
    const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    const saveData = !!conn?.saveData;
    const slowNet = /^(slow-2g|2g)$/.test(conn?.effectiveType || '');
    const isVisible = () => document.visibilityState !== 'hidden';

    // Respect data-saver / tiny networks
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
    const timers = new Set();
    const loaded = new Set();
    const imgsInFlight = new Set();

    const uniqueQueue = images.filter(Boolean).filter((src, i, arr) => arr.indexOf(src) === i);

    const loadImage = (src) =>
      new Promise((resolve) => {
        if (!src || loaded.has(src) || stopRef.current) return resolve();
        const img = new Image();
        imgsInFlight.add(img);
        img.decoding = 'async';
        img.loading = 'eager';                // we’re controlling when it starts
        img.referrerPolicy = 'no-referrer';
        img.onload = img.onerror = () => {
          loaded.add(src);
          imgsInFlight.delete(img);
          resolve();
        };
        // kick on next tick so we can throttle multiple starts
        const t = setTimeout(() => { if (!stopRef.current) img.src = src; }, 0);
        timers.add(t);
      });

    // Little concurrency controller
    const warmQueue = async () => {
      if (!isVisible() || stopRef.current || !uniqueQueue.length) return;
      const q = uniqueQueue.slice();     // copy
      const runners = new Array(Math.max(1, Math.min(maxConcurrent, q.length)))
        .fill(0)
        .map(async () => {
          while (q.length && !stopRef.current) {
            const next = q.shift();
            // eslint-disable-next-line no-await-in-loop
            await loadImage(next);
            // small spacing between kicks to avoid bursts (helps on iOS/low power)
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => {
              const t = setTimeout(r, 120);
              timers.add(t);
            });
          }
        });
      await Promise.all(runners);
    };

    // --- schedule ------------------------------------------------------
    // 1) After first paint, queue a gentle prefetch of the shop route
    try {
      rafId = requestAnimationFrame(() => {
        if (!isVisible() || stopRef.current) return;
        const id = rIC(() => { if (!stopRef.current) { try { router.prefetch(prefetchPath); } catch {} } }, 900);
        idleIds.push(id);
      });
    } catch {}

    // 2) Warm images when idle
    idleIds.push(rIC(() => { if (!stopRef.current && isVisible()) warmQueue(); }, 1500));

    // 3) Final nudge once fully loaded
    const onLoad = () => {
      if (stopRef.current) return;
      try { router.prefetch(prefetchPath); } catch {}
      warmQueue();
    };
    const loadTimer = setTimeout(() => window.addEventListener('load', onLoad, { once: true }), startDelayMs);
    timers.add(loadTimer);

    // 4) If the tab becomes visible later, do one tiny follow-up prefetch
    const onVisible = () => {
      if (!prefetchOnVisible || !isVisible() || stopRef.current) return;
      try { router.prefetch(prefetchPath); } catch {}
      document.removeEventListener('visibilitychange', onVisible);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopRef.current = true;
      try { cancelAnimationFrame(rafId); } catch {}
      idleIds.forEach((id) => cRIC(id));
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisible);
      // Best-effort cleanup of in-flight images
      imgsInFlight.forEach((img) => {
        try {
          img.onload = img.onerror = null;
          // Setting src to empty string hints many browsers to drop the request if still pending
          img.src = '';
        } catch {}
      });
      imgsInFlight.clear();
    };
  }, [enable, prefetchPath, images, maxConcurrent, startDelayMs, onlyWhenGate, prefetchOnVisible, router]);

  return null;
}
