// src/lib/swell.js
import swell from 'swell-js';

const STORE_ID  = process.env.NEXT_PUBLIC_SWELL_STORE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY;

if (!STORE_ID || !PUBLIC_KEY) {
  // This warns in both dev and build if Vercel env vars are missing/mis-scoped
  console.warn('[swell] Missing NEXT_PUBLIC_SWELL_STORE_ID or NEXT_PUBLIC_SWELL_PUBLIC_KEY');
}

// Module scope runs once per bundle; keep a tiny guard anyway.
let _didInit = false;
try {
  if (!_didInit) {
    swell.init(STORE_ID, PUBLIC_KEY, { useCamelCase: true });
    _didInit = true;
  }
} catch (err) {
  console.error('[swell] init failed:', err);
}

export default swell;
