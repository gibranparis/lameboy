// src/app/shop/[slug]/page.js
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import swell from '@/lib/swell';
import AddToCart from '@/components/AddToCart';
import ResponsiveProductImage from '@/components/ResponsiveProductImage';

export const revalidate = 60; // ISR hint

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

  const plain =
    p.meta_description ||
    (p.description ? p.description.replace(/<[^>]+>/g, '').slice(0, 160) : '');

  return {
    title: `${p.name} – LAMEBOY`,
    description: plain,
    alternates: { canonical: `/shop/${p.slug || slug}` },
  };
}

async function safeGetProduct(slugOrId) {
  if (!slugOrId) return null;
  try {
    // 1) Try by slug short-hand
    let p = await swell.products.get(`slug:${slugOrId}`, {
      expand: ['images', 'variants'],
    });
    if (p) return p;

    // 2) Try via list where.slug
    const list = await swell.products.list({
      where: { slug: slugOrId },
      limit: 1,
      expand: ['images', 'variants'],
    });
    if (list?.results?.[0]) return list.results[0];

    // 3) Try by id
    p = await swell.products.get(slugOrId, { expand: ['images', 'variants'] });
    if (p) return p;

    return null;
  } catch (e) {
    console.error('[product] fetch failed', e);
    return null;
  }
}

export default async function ProductPage({ params, searchParams }) {
  const { slug } = params;
  const product = await safeGetProduct(slug);

  // Debug helper: /shop/<slug>?debug=1
  if (searchParams?.debug === '1') {
    return (
      <main className="container" style={{ paddingTop: 24 }}>
        <pre className="card" style={{ padding: 16, overflow: 'auto' }}>
{JSON.stringify({ slug, product }, null, 2)}
        </pre>
        <p className="muted" style={{ marginTop: 12 }}>
          If product is null, the slug likely doesn’t exist or isn’t published.
        </p>
        <Link href="/shop" className="btn ghost" style={{ marginTop: 12 }}>
          ← Back to Shop
        </Link>
      </main>
    );
  }

  if (!product) return notFound();

  const images = product?.images || [];
  const firstImg =
    images?.[0]?.file?.url ||
    images?.[0]?.url ||
    null;

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Image column */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#f6f6f6',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Try scenario-based art-direction first */}
          <ResponsiveProductImage
            images={images}
            map={{
              desktopWebp: 'desktop-webp',
              desktopJpg: 'desktop-jpg',
              mobileWebp: 'mobile-webp',
              mobileJpg: 'mobile-jpg',
            }}
            alt={product.name}
          />

          {/* If no tagged images exist, fall back to Next/Image optimizer on the first image */}
          {!hasAnyTagged(images) && firstImg && (
            <Image
              src={firstImg}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.1 }}>{product.name}</h1>
          <Price product={product} />
          {product?.stock_status === 'out_of_stock' && (
            <div className="muted" style={{ fontSize: 14 }}>Out of stock</div>
          )}
          <AddToCart product={product} />
          {product?.description && (
            <div
              style={{ marginTop: 8, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
          <div style={{ marginTop: 12 }}>
            <Link href="/shop" className="btn ghost">← Back to Shop</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function hasAnyTagged(images = []) {
  const tags = ['desktop-webp', 'desktop-jpg', 'mobile-webp', 'mobile-jpg'];
  return images.some((i) => {
    const c = String(i?.caption || '').toLowerCase();
    return tags.some((t) => c.includes(t));
  });
}

function Price({ product }) {
  const currency = product?.currency || 'USD';
  const price = product?.sale_price ?? product?.price ?? 0;
  try {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    return <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt.format(price)}</div>;
  } catch {
    return (
      <div style={{ fontSize: 20, fontWeight: 700 }}>
        ${Number(price || 0).toFixed(2)}
      </div>
    );
  }
}
