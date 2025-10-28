// src/app/layout.js
import './globals.css';
import nextDynamic from 'next/dynamic';
import { CartProvider } from '../contexts/CartContext';

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.vercel.app'),
};

// Warmup runs client-side; no SSR
const SilentWarmup = nextDynamic(() => import('@/components/SilentWarmup'), { ssr: false });

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-mode="gate"          // default; page.js flips to 'shop'
      data-theme="day"          // default; DayNightToggle/page.js will update
    >
      <body>
        <CartProvider>
          {/* Gentle prefetch + image decode for /shop + UI assets */}
          <SilentWarmup prefetchPath="/shop" />
          {children}

          {/* Optional portal target if you ever need one (keeps overlays tidy) */}
          <div id="portal-root" />
        </CartProvider>
      </body>
    </html>
  );
}
