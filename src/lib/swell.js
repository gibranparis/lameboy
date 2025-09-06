// src/lib/swell.js
import swell from 'swell-js';

if (!swell.isInitialized()) {
  swell.init(
    process.env.NEXT_PUBLIC_SWELL_STORE_ID,
    process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY,
    { useCamelCase: true }
  );
}

export default swell;
