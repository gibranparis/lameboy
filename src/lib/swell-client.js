// src/lib/swell-client.js
'use client';

import swell from 'swell-js';

const STORE_ID   = process.env.NEXT_PUBLIC_SWELL_STORE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY;

if (!globalThis.__SWELL_READY__) {
  if (!STORE_ID || !PUBLIC_KEY) {
    console.error(
      '[swell-client] Missing NEXT_PUBLIC_SWELL_STORE_ID or NEXT_PUBLIC_SWELL_PUBLIC_KEY'
    );
  } else {
    try {
      swell.init(STORE_ID, PUBLIC_KEY, { useCamelCase: true });
      globalThis.__SWELL_READY__ = true;
      // expose for quick console checks
      // (type: swellClient.cart.get().then(console.log))
      globalThis.swellClient = swell;
    } catch (err) {
      console.error('[swell-client] init failed', err);
    }
  }
}

export default swell;
