'use client';

import dynamic from 'next/dynamic';

// Lazy-load the heavy UI (client-only; avoids SSR mismatch)
const BannedLogin = dynamic(() => import('../components/BannedLogin'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100dvh' }} />,
});

export default function Page() {
  return <BannedLogin />;
}
