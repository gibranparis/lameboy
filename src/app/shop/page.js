export const revalidate = 60; // ISR revalidate every 60s
import swell from '@/lib/swell';
import ProductCard from '@/components/ProductCard';

async function getProducts() {
  const { results } = await swell.products.list({ limit: 24, expand: ['images'] });
  return results || [];
}

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Shop</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </main>
  );
}
