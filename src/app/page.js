'use client';

import dynamic from 'next/dynamic';

const BannedLogin = dynamic(() => import('../components/BannedLogin'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100dvh' }} aria-busy="true" />,
});

export default function Page() {
  // keep this minimal: the dynamic import ensures client-only behavior
  return <BannedLogin key="banned-login" />;
}
