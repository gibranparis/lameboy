// src/app/shop/[slug]/page.js

import swell from '@/lib/swell';
import AddToCart from '@/components/AddToCart';          // client component
import ProductGallery from '@/components/ProductGallery'; // client component

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  try {
    const { results = [] } = await swell.products.list({ limit: 50 });
    return results.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  let name = 'Product';
  try {
    const p = await swell.products.get(slug);
    name = p?.name || name;
  } catch {}

  const url = `/shop/${encodeURIComponent(slug)}`;
  return {
    title: `${name} – LAMEBOY`,
    alternates: { canonical: url },
    openGraph: { url, title: `${name} – LAMEBOY` },
  };
}

async function getProduct(slug) {
  try {
    return await swell.products.get(slug, { expand: ['variants', 'images'] });
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <main className="container">
        <p>Not found.</p>
      </main>
    );
  }

  const images = (product.images || [])
    .map((i) => ({
      url: i?.file?.url,
      w: i?.file?.width || 1200,
      h: i?.file?.height || 1200,
    }))
    .filter(Boolean)
    .slice(0, 8);

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          {images.length ? (
            <ProductGallery images={images} name={product.name} />
          ) : (
            <div className="muted">No image</div>
          )}
        </div>

        <div className="card">
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          <div className="price">${Number(product.price || 0).toFixed(2)}</div>
          <div
            style={{ marginTop: 16 }}
            dangerouslySetInnerHTML={{ __html: product.description || '' }}
          />
          <div style={{ marginTop: 24 }}>
            <AddToCart productId={product.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
