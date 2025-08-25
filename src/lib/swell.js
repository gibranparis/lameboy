// src/lib/swell.js
import swell from 'swell-js';

const storeId   = process.env.NEXT_PUBLIC_SWELL_STORE_ID;
const publicKey = process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY;

if (!storeId || !publicKey) {
  console.warn('Missing NEXT_PUBLIC_SWELL_STORE_ID or NEXT_PUBLIC_SWELL_PUBLIC_KEY');
}

swell.init(storeId || '', publicKey || '', { useCamelCase: true });

export default swell;
