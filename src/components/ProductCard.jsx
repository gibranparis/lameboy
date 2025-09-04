// src/components/ProductCard.jsx
import Link from 'next/link';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const slug = product?.slug || product?.id;
  const href = `/shop/${slug}`;

  const img =
    product?.images?.[0]?.file?.url ||
    product?.images?.[0]?.url ||
    null;

  return (
    <Link className="card" href={href} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f6f6f6', borderRadius: 12, overflow: 'hidden' }}>
        {img ? (
          <Image
            src={img}
            alt={product?.name || 'Product image'}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 14 }}>{product?.name || 'Product'}</div>
        <div className="price">
          ${Number(product?.sale_price ?? product?.price ?? 0).toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
