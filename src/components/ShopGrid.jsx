'use client';

import { useEffect, useState } from 'react';
import swell from '../lib/swell-client';

function productCode(p) {
  // Prefer short code-like labels similar to yeezy.
  const tryKeys = ['code', 'short_code', 'sku', 'slug', 'name'];
  for (const k of tryKeys) {
    const v = p?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim().toUpperCase();
  }
  return String(p?.id || '').slice(0, 8).toUpperCase();
}

export default function ShopGrid() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await swell.products.list({ limit: 60, page: 1, active: true });
        if (!alive) return;
        setItems(res?.results || []);
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
    <main className="shop-wrap max-w-7xl mx-auto">
      <div className="shop-grid">
        {items.map((p) => {
          const code = productCode(p);
          const href = `/product/${p.slug || p.id}`;
          const img = p.images?.[0]?.file?.url;

          return (
            <a key={p.id} href={href} className="product-tile">
              <div className="product-box vscode-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img ? (
                  <img className="product-img" src={img} alt={p.name || code} />
                ) : (
                  <div className="code-placeholder" aria-hidden>no image</div>
                )}
              </div>
              <div className="product-meta">{code}</div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
