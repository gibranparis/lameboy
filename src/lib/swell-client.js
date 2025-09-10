// src/lib/swell-client.js
import swell from 'swell-js';

// Read from env (configure in .env.local and Vercel project settings)
const storeId  = process.env.NEXT_PUBLIC_SWELL_STORE_ID;
const publicKey = process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY;

// Initialize once per module load
if (!storeId || !publicKey) {
  // Helpful error for missing envs during build
  // (won't crash runtime, but you'll see a clear message)
  console.warn(
    '[swell-client] Missing NEXT_PUBLIC_SWELL_STORE_ID or NEXT_PUBLIC_SWELL_PUBLIC_KEY'
  );
} else {
  try {
    // v4 init signature
    swell.init(storeId, publicKey, { useCamelCase: true });
  } catch (e) {
    // If init is called twice by accident, swallow benign errors
    // and keep the already-initialized instance.
    // console.debug('[swell-client] init error (possibly re-init):', e);
  }
}

export default swell;
