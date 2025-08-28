export const metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Welcome to LAMEBOY</h1>
      <p className="muted">Ultra-fast, headless commerce starter using Swell + Next.js.</p>
      <div style={{ marginTop: 24 }}>
        <a className="btn" href="/shop">Enter Shop →</a>
      </div>
    </main>
  );
}