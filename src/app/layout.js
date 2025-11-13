import './globals.css'
import { CartProvider } from '../contexts/CartContext'
import SilentWarmup from '@/components/SilentWarmup'

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.vercel.app'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* keep background black here; shop flips after mount via data-shop-mounted */}
        <SilentWarmup />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
