import './globals.css';
import { CartProvider } from '../contexts/CartContext';

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.vercel.app'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
