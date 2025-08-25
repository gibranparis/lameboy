export const metadata = {
  title: 'LAMEBOY — Shop',
  description: 'Headless store powered by Swell + Next.js',
};
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <a href="/">LAMEBOY</a>
          <nav style={{ display:'flex', gap:12 }}>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
