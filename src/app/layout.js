// Root layout (App Router)
import './globals.css';
import Header from '../components/Header';

import { CartUIProvider } from '@/contexts/CartUIContext';
import CartFlyout from '@/components/CartFlyout';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'LAMEBOY – Shop',
  description: 'Headless store powered by Swell + Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartUIProvider>
          <Header />
          <main className="container">{children}</main>
          {/* Global cart drawer */}
          <CartFlyout />
        </CartUIProvider>
      </body>
    </html>
  );
}
