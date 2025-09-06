// src/app/layout.js
import './globals.css';
import { cookies } from 'next/headers';

import Header from '@/components/Header';
import { CartUIProvider } from '@/contexts/CartUIContext';
import CartFlyout from '@/components/CartFlyout';
import Maintenance from '@/components/Maintenance';
import { CartProvider } from '@/contexts/CartContext';

export const dynamic = 'force-dynamic';

const isTrue = (v) => String(v ?? '').toLowerCase() === 'true';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'LAMEBOY – Shop',
  description: 'Headless store powered by Swell + Next.js',
};

export default async function RootLayout({ children }) {
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
              <CartProvider>
                <main className="container">{children}</main>
                <CartFlyout />
              </CartProvider>
            </CartUIProvider>
          </>
        )}
      </body>
    </html>
  );
}
