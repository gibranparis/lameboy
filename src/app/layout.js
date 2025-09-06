// src/app/layout.js
import './globals.css';
import { cookies } from 'next/headers';

import Header from '@/components/Header';
import CartFlyout from '@/components/CartFlyout';
import { CartProvider } from '@/contexts/CartContext';
import { CartUIProvider } from '@/contexts/CartUIContext';
import Maintenance from '@/components/Maintenance';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.com'),
  title: 'LAMEBOY | Shop',
  description: 'Headless store powered by Swell + Next.js',
};

export default function RootLayout({ children }) {
  const c = cookies();
  const bypass = c.get('bypass_maintenance')?.value === '1';
  const maintenance = process.env.MAINTENANCE_MODE === 'true' && !bypass;

  if (maintenance) {
    // Minimal shell, no header/cart while locked
    return (
      <html lang="en">
        <body>
          <main className="container">
            <Maintenance />
          </main>
        </body>
      </html>
    );
  }

  // Normal shell with cart wired up
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <CartUIProvider>
            <Header />
            <main className="container">{children}</main>
            <CartFlyout />
          </CartUIProvider>
        </CartProvider>
      </body>
    </html>
  );
}
