// src/app/layout.js
import './globals.css';
import { CartProvider } from '../contexts/CartContext';
import SilentWarmup from '@/components/SilentWarmup';

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.vercel.app'),
};

// Tell Next to emit the correct viewport (includes safe areas + dynamic vh)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // enables env(safe-area-inset-*)
  interactiveWidget: 'resizes-content',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Warm images/prefetch in the background */}
        <SilentWarmup />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
