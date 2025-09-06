// src/app/shop/[slug]/page.js
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import swell from '@/lib/swell';
import AddToCart from '@/components/AddToCart';
import ResponsiveProductImage from '@/components/ResponsiveProductImage';

export const revalidate = 60; // ISR

export async function generateMetadata({ params }) {
  const { slug } = params;
  const p = await safeGetProduct(slug);

  if (!p) {
    return {
      title: 'Product – LAMEBOY',
      description: 'Browse LAMEBOY products.',
      alternates: { canonical: `/shop/${slug}` },
    };
  }

  const plain = p.meta_description || (p.description ? p.description.replace(/<[^>]+>/g, '').slice(0,160) : '');

  return {
    title: `${p.name} – LAMEBOY`,
    description: plain,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: `${p.name} – LAMEBOY`,
      description: plain,
      images: p.images?.[0]?.file?.url ? [{ url: p.images[0].file.url }] : [],
    },
  };
}

async function safeGetProduct(slug) {
  try {
    // Swell supports get by slug
    return await swell.products.get(slug, { expand: ['variants', 'images'] });
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }) {
  const product = await safeGetProduct(params.slug);
  if (!product) return notFound();

  const image = product?.images?.[0]?.file?.url;

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/shop" style={{ display: 'inline-block', marginBottom: 12 }}>&larr; Back to shop</Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          {image ? (
            <ResponsiveProductImage src={image} alt={product.name} />
          ) : null}
        </div>
        <div>
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          <Price product={product} />
          <div style={{ marginTop: 16 }}>
            <AddToCart product={product} />
          </div>
          {product.description ? (
            <div style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Price({ product }) {
  const currency = product?.currency || 'USD';
  const price = product?.sale_price ?? product?.price ?? 0;
  try {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    return <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt.format(price)}</div>;
  } catch {
    return <div style={{ fontSize: 20, fontWeight: 700 }}>${Number(price || 0).toFixed(2)}</div>;
  }
}
