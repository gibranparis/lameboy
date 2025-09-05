// src/app/layout.js
import './globals.css';
import { cookies } from 'next/headers';

import Header from '@/components/Header';
import { CartUIProvider } from '@/contexts/CartUIContext';
import CartFlyout from '@/components/CartFlyout';
import Maintenance from '@/components/Maintenance';

const isTrue = (v) => String(v ?? '').toLowerCase() === 'true';

export const metadata = {
  title: 'LAMEBOY — Shop',
  description: 'Headless store powered by Swell + Next.js',
};

export default async function RootLayout({ children }) {
  // Next.js 15: cookies() must be awaited
  const cookieStore = await cookies();
  const hasBypass = cookieStore.get('bypass_maintenance')?.value === '1';

  const enabled = isTrue(process.env.MAINTENANCE_MODE);
  const locked = enabled && !hasBypass;

  return (
    <html lang="en">
      <body>
        {locked ? (
          <Maintenance />
        ) : (
          <>
            <Header />
            <CartUIProvider>
              <main className="container">{children}</main>
              <CartFlyout />
            </CartUIProvider>
          </>
        )}
      </body>
    </html>
  );
}
