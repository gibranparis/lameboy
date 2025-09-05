// src/app/page.js
import Link from 'next/link';

export default function Page() {
  return (
    <main className="container" style={{ padding: '2rem 1rem' }}>
      <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.5 }}>LAMEBOY</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>Headless store powered by Swell + Next.js.</p>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Link href="/shop">Shop</Link>
        <Link href="/cart">Cart</Link>
      </div>
    </main>
  );
}
