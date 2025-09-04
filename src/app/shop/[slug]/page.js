// src/app/shop/[slug]/page.js

import swell from '@/lib/swell';
import AddToCart from '@/components/AddToCart';
import ProductGallery from '@/components/ProductGallery';

// Don't prerender this route at build. Render on request instead.
export const dynamic = 'force-dynamic'; // (alternative: export const revalidate = 0)

// NOTE: intentionally no generateStaticParams() here while we stabilize the build.
// If you re-enable SSG/ISR later, re-add it once builds succeed.

async function getProductSafe(slug) {
  try {
    return await swell.products.get(slug, { expand: ['variants', 'images'] });
  } catch (e) {
    console.error('[build] getProduct failed', e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductSafe(slug);

  const url = `/shop/${encodeURIComponent(slug)}`;
  const title = product?.name ? `${product.name} — LAMEBOY` : 'Product — LAMEBOY';

  const raw = product?.meta?.description ?? product?.description ?? '';
  const description =
    typeof raw === 'string' ? raw.replace(/<[^>]+>/g, '').slice(0, 160) : undefined;

  const images = (product?.images || [])
    .map(i => i?.file?.url)
    .filter(Boolean)
    .slice(0, 4);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'product', images },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductSafe(slug);

  if (!product) {
    // Render a soft "not found" shell; don't throw during build.
    return (
      <main className="container">
        <p className="muted">Not found.</p>
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
