'use client';

import { useEffect, useState } from 'react';
import swell from '@/lib/swell-client';

export default function ShopGrid() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await swell.products.list({ limit: 24, page: 1, active: true });
        if (alive) setItems(res?.results || []);
      } catch (e) {
        console.error('products list failed', e);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (busy) {
    return <div className="page-center"><div className="code-comment">// loading shop…</div></div>;
  }

  if (!items.length) {
    return <div className="page-center"><div className="code-comment">// no products yet</div></div>;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}
      >
        {items.map(p => (
          <a key={p.id} href={`/product/${p.slug || p.id}`} className="vscode-card card-ultra-tight block">
            <div style={{ aspectRatio: '1 / 1', background:'#0a0a0a', borderRadius: 10, overflow:'hidden' }}>
              {p.images?.[0]?.file?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].file.url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              )}
            </div>
            <div style={{ padding:'8px 6px 6px 6px' }}>
              <div style={{ fontWeight:700 }}>{p.name}</div>
              <div style={{ color:'#b3b3b3' }}>${(p.sale_price ?? p.price ?? 0).toFixed(2)}</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
