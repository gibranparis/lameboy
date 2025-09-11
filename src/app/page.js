'use client';

import dynamic from 'next/dynamic';

const BannedLogin = dynamic(() => import('../components/BannedLogin'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100dvh' }} />,
});

export default function Page() {
  return <BannedLogin />;
}
