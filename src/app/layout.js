import './globals.css';
import { CartProvider } from '../contexts/CartContext';

export const metadata = {
  title: 'LAMEBOY',
  description: 'lameboy.com',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
