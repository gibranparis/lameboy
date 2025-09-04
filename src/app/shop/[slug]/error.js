'use client';

export default function Error({ error, reset }) {
  // This will show up in the browser console (and Vercel Replay if enabled)
  console.error('Product page error:', error);
  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <p>Something went wrong on this product page.</p>
      <button onClick={() => reset()}>Retry</button>
    </main>
  );
}
