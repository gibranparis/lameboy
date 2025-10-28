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

    // Polyfilled requestIdleCallback
    const rIC = (cb, timeout = 1200) => {
      try {
        if (typeof window.requestIdleCallback === 'function') {
          return window.requestIdleCallback(cb, { timeout });
        }
      } catch {}
      const id = setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), timeout);
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

    // Only warm when tab is visible to avoid wasting work in the background.
    const isVisible = () => document.visibilityState !== 'hidden';

    let idleIds = [];

    // 1) After first paint, lightly prefetch the route.
    const rafId = requestAnimationFrame(() => {
      if (!isVisible()) return;
      idleIds.push(
        rIC(() => { try { router.prefetch(prefetchPath); } catch {} }, 800)
      );
    });

    // 2) Warm image cache gently (Birkin + moons).
    idleIds.push(
      rIC(() => {
        if (!isVisible()) return;
        try {
          images.forEach((src) => {
            const img = new Image();
            img.decoding = 'async';
            img.loading = 'eager'; // hint only; still async
            img.referrerPolicy = 'no-referrer';
            img.src = src;
            // Best-effort decode to push into the decode queue without blocking.
            img.decode?.().catch(() => {});
          });
        } catch {}
      }, 1500)
    );

    // 3) Final nudge once the page fully loads.
    const onLoad = () => {
      try { router.prefetch(prefetchPath); } catch {}
      try {
        images.forEach((src) => {
          const img = new Image();
          img.decoding = 'async';
          img.src = src;
        });
      } catch {}
    };
    window.addEventListener('load', onLoad, { once: true });

    // 4) If the tab becomes visible later, kick a tiny follow-up prefetch.
    const onVisible = () => {
      if (!isVisible()) return;
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
