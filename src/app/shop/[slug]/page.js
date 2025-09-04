// src/app/shop/[slug]/page.js

import dynamic from 'next/dynamic';
import swell from '@/lib/swell';

// Load client-only components (anything that might touch window/document)
const AddToCart = dynamic(() => import('@/components/AddToCart'), { ssr: false });
const ProductGallery = dynamic(() => import('@/components/ProductGallery'), { ssr: false });

export const revalidate = 60; // ISR

// Build-time: pre-generate product slugs (safe with try/catch)
export async function generateStaticParams() {
  try {
    const { results = [] } = await swell.products.list({ limit: 50 });
    return results.map(p => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// Per-page metadata (canonical + good title/description)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  let title = 'LAMEBOY';
  let description = '';
  try {
    const p = await swell.products.get(slug);
    if (p) {
      title = `${p.name} – LAMEBOY`;
      const raw =
        typeof p?.meta?.description === 'string'
          ? p.meta.description
          : p?.description || '';
      description = String(raw).replace(/<[^>]*>/g, '').slice(0, 160);
    }
  } catch {}

  return {
    title,
    description,
    alternates: { canonical: `/shop/${encodeURIComponent(slug)}` },
  };
}

// Server helper with guardrails
async function getProductSafe(slug) {
  try {
    return await swell.products.get(slug, { expand: ['variants', 'images'] });
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params; // Next 15: params is a Promise
  const product = await getProductSafe(slug);

  if (!product) {
    return (
      <main className="container">
        <p>Not found.</p>
      </main>
    );
  }

  // Build a clean images array; only keep entries with a URL
  const images = Array.isArray(product.images)
    ? product.images
        .map(i => ({
          url: i?.file?.url || '',
          w: i?.file?.width || 1200,
          h: i?.file?.height || 1200,
        }))
        .filter(img => !!img.url)
    : [];

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          {images.length > 0 ? (
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
            // product.description can be HTML from CMS
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
