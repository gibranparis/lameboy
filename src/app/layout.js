// src/app/layout.js
import './globals.css';
import { CartProvider } from '../contexts/CartContext';

// Import client component normally (it has 'use client' inside).
// Do NOT use next/dynamic here — layout.js is a Server Component.
import SilentWarmup from '@/components/SilentWarmup';

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.vercel.app'),
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
