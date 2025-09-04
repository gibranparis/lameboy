// src/app/shop/page.js
import swell from '@/lib/swell';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop — LAMEBOY', alternates: { canonical: '/shop' } };

async function getProducts() {
  try {
    const res = await swell.products.list({ limit: 24, expand: ['images'] });
    return res?.results ?? [];
  } catch (e) {
    console.error('[build] products.list failed', e);
    return [];
  }
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Shop</h2>
      {products.length === 0 ? (
        <div className="muted">No products found.</div>
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}
        >
          {products.map(p => (
            <ProductCard key={p.id || p.slug} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
