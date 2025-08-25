import swell from '@/lib/swell';
import AddToCart from '@/components/AddToCart';
import ProductGallery from '@/components/ProductGallery';

export const revalidate = 60;

async function getProduct(slug) {
  return await swell.products.get(slug, { expand: ['variants', 'images'] });
}

export async function generateStaticParams() {
  const { results = [] } = await swell.products.list({ limit: 50 });
  return results.map(p => ({ slug: p.slug }));
}

export default async function ProductPage({ params }) {
  // ✅ Next 15: params is a Promise
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
    .map(i => ({
      url: i?.file?.url,
      w: i?.file?.width || 1200,
      h: i?.file?.height || 1200,
    }))
    .filter(Boolean);

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
          <div className="price">
            ${Number(product.price || 0).toFixed(2)}
          </div>
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
